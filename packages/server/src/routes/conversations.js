import { Router } from 'express'
import { eq, and, desc, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/client.js'
import { conversations, messages } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/conversations — list user's conversations
router.get('/', async (req, res, next) => {
  try {
    const db = getDb()
    const convs = db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, req.user.sub))
      .orderBy(desc(conversations.updatedAt))
      .all()

    res.json({ conversations: convs })
  } catch (err) {
    next(err)
  }
})

// POST /api/conversations — create new conversation
router.post('/', async (req, res, next) => {
  try {
    const { title = 'New Conversation' } = req.body ?? {}
    const now = new Date()
    const id = uuidv4()
    const db = getDb()

    db.insert(conversations).values({
      id,
      userId: req.user.sub,
      title: title.trim().slice(0, 80) || 'New Conversation',
      createdAt: now,
      updatedAt: now,
    }).run()

    res.status(201).json({
      conversation: { id, userId: req.user.sub, title, createdAt: now, updatedAt: now },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req, res, next) => {
  try {
    const db = getDb()
    const conv = db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.user.sub)
        )
      )
      .get()

    if (!conv) return res.status(404).json({ error: 'Conversation not found.' })

    const msgs = db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, req.params.id))
      .orderBy(asc(messages.createdAt))
      .all()

    res.json({ messages: msgs, conversation: conv })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/conversations/:id — rename
router.patch('/:id', async (req, res, next) => {
  try {
    const { title } = req.body ?? {}
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })

    const db = getDb()
    db.update(conversations)
      .set({ title: title.trim().slice(0, 80), updatedAt: new Date() })
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.user.sub)
        )
      )
      .run()

    res.json({ message: 'Conversation renamed.' })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/conversations/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDb()
    db.delete(conversations)
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.user.sub)
        )
      )
      .run()

    res.json({ message: 'Conversation deleted.' })
  } catch (err) {
    next(err)
  }
})

export default router
