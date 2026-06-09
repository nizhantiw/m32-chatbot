import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/client.js'
import { users, refreshTokens } from '../db/schema.js'
import { env } from '../config/env.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

const issueTokens = (userId, email, name) => {
  const accessToken = jwt.sign(
    { sub: userId, email, name },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { sub: userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

const storeRefreshToken = (db, userId, token) => {
  db.insert(refreshTokens).values({
    id: uuidv4(),
    userId,
    token,
    expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    createdAt: new Date(),
  }).run()
}

// ─── Register ────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {}

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const db = getDb()
    const existing = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    const now = new Date()

    db.insert(users).values({
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: now,
      updatedAt: now,
    }).run()

    const { accessToken, refreshToken } = issueTokens(userId, email.toLowerCase(), name.trim())
    storeRefreshToken(db, userId, refreshToken)

    res.status(201).json({
      user: { id: userId, name: name.trim(), email: email.toLowerCase() },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    next(err)
  }
})

// ─── Login ───────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const db = getDb()
    const user = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
    if (!user?.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const { accessToken, refreshToken } = issueTokens(user.id, user.email, user.name)
    storeRefreshToken(db, user.id, refreshToken)

    res.json({
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    next(err)
  }
})

// ─── Refresh ─────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {}
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required.' })
    }

    let payload
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' })
    }

    const db = getDb()
    const stored = db.select().from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken)).get()

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token not found or expired.' })
    }

    const user = db.select().from(users).where(eq(users.id, payload.sub)).get()
    if (!user) return res.status(401).json({ error: 'User not found.' })

    // Token rotation
    db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken)).run()

    const tokens = issueTokens(user.id, user.email, user.name)
    storeRefreshToken(db, user.id, tokens.refreshToken)

    res.json({
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      ...tokens,
    })
  } catch (err) {
    next(err)
  }
})

// ─── Logout ──────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {}
    const db = getDb()
    if (refreshToken) {
      db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken)).run()
    }
    res.json({ message: 'Logged out successfully.' })
  } catch (err) {
    next(err)
  }
})

// ─── Me ──────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const db = getDb()
    const user = db
      .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, req.user.sub))
      .get()

    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

export default router
