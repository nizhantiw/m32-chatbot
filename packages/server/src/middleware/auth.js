import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' })
  }

  const token = authHeader.slice(7)
  try {
    req.user = jwt.verify(token, env.JWT_SECRET)
    next()
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    res.status(401).json({ error: message })
  }
}
