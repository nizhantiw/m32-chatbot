import { env } from '../config/env.js'

let _langfuse = null

// Initialize lazily to avoid crashing if keys are absent
const initLangfuse = async () => {
  if (_langfuse !== null) return _langfuse
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) {
    _langfuse = false // sentinel: "checked but unavailable"
    return null
  }
  try {
    const { Langfuse } = await import('langfuse')
    _langfuse = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_HOST,
      flushAt: 5,
      flushInterval: 5000,
    })
    console.log('📊 Langfuse observability enabled')
    return _langfuse
  } catch (err) {
    console.warn('Langfuse init failed (non-fatal):', err.message)
    _langfuse = false
    return null
  }
}

export const traceChat = async ({
  userId,
  conversationId,
  inputMessages,
  outputText,
  toolCalls,
  model,
  durationMs,
  usage,
}) => {
  const lf = await initLangfuse()
  if (!lf) return

  try {
    const trace = lf.trace({
      name: 'bizpilot-chat',
      userId: String(userId),
      metadata: { conversationId },
      tags: ['chat'],
    })

    trace.generation({
      name: 'llm-response',
      model: model || env.GEMINI_MODEL,
      input: inputMessages,
      output: outputText,
      metadata: { toolCallCount: toolCalls?.length || 0, durationMs },
      usage: usage
        ? { input: usage.promptTokens, output: usage.completionTokens }
        : undefined,
    })

    lf.flushAsync().catch(() => {})
  } catch (err) {
    console.warn('Langfuse trace error (non-fatal):', err.message)
  }
}
