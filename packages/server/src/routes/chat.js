import { Router } from 'express'
import { eq, and, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/client.js'
import { conversations, messages } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { streamChatResponse, generateTitle } from '../services/aiService.js'

const router = Router()
router.use(authenticate)

/**
 * POST /api/chat/:conversationId/message
 *
 * Accepts the Vercel AI SDK useChat payload: { messages: [...] }
 * Extracts the last user message, saves to DB, loads full history,
 * then streams the AI response in Vercel AI data-stream format.
 */
router.post('/:conversationId/message', async (req, res, next) => {
  const { conversationId } = req.params
  const db = getDb()

  // Accept both { messages } (useChat) and { content } (direct)
  const clientMessages = req.body?.messages
  const directContent = req.body?.content

  const userContent = directContent?.trim() ||
    clientMessages?.findLast?.((m) => m.role === 'user')?.content?.trim()

  if (!userContent) {
    return res.status(400).json({ error: 'No user message provided.' })
  }

  // Ownership check
  const conv = db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, req.user.sub)
      )
    )
    .get()

  if (!conv) return res.status(404).json({ error: 'Conversation not found.' })

  // Persist the user message
  const userMsgId = uuidv4()
  db.insert(messages).values({
    id: userMsgId,
    conversationId,
    role: 'user',
    content: userContent,
    createdAt: new Date(),
  }).run()

  // Load full history from DB (source of truth)
  const history = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .all()

  // Map to AI SDK format
  const aiMessages = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  // Auto-generate title for the first message
  if (history.length === 1 && conv.title === 'New Conversation') {
    generateTitle(userContent).then((title) =>
      db.update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId))
        .run()
    ).catch(() => {})
  }

  try {
    const result = await streamChatResponse({
      messages: aiMessages,
      userId: req.user.sub,
      conversationId,
      onFinish: async ({ text, toolCalls }) => {
        if (!text) return

        // Persist assistant response
        db.insert(messages).values({
          id: uuidv4(),
          conversationId,
          role: 'assistant',
          content: text,
          toolCalls: toolCalls?.length ? JSON.stringify(toolCalls) : null,
          createdAt: new Date(),
        }).run()

        // Bump conversation updatedAt
        db.update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId))
          .run()
      },
    })

    // Pipe the AI SDK data stream to Express response
    // Pass explicit headers so the Vite proxy and nginx don't buffer
    result.pipeDataStreamToResponse(res, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[chat/message] AI stream failed')
    console.error('message:', err?.message)
    console.error('code:', err?.code)
    console.error('status:', err?.status || err?.statusCode)
    console.error('stack:', err?.stack)

    if (!res.headersSent) {
      next(err)
    } else {
      console.error('[chat stream error]', err.message)
      res.end()
    }
  }
})

export default router
