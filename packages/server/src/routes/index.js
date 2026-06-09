import { Router } from 'express'
import authRouter from './auth.js'
import conversationsRouter from './conversations.js'
import chatRouter from './chat.js'

export const router = Router()

router.use('/auth', authRouter)
router.use('/conversations', conversationsRouter)
router.use('/chat', chatRouter)
