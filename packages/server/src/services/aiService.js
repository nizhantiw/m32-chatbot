import { streamText, generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { tools } from '../tools/index.js'
import { traceChat } from './observability.js'
import { env } from '../config/env.js'

const SYSTEM_PROMPT = `You are BizPilot, an AI-powered business intelligence assistant built for small and medium business owners, CEOs, and department heads.

Your core capabilities:
• Research markets, competitors, and industry trends using web search
• Perform precise financial calculations (ROI, margins, break-even, growth rates)
• Provide strategic business advice grounded in current data
• Answer business questions accurately with cited sources

Communication style:
• Be concise and direct — busy executives need answers fast
• Use plain language, avoid unnecessary jargon
• Lead with the key insight, then support with details
• Format numbers clearly: percentages, dollar amounts, ratios
• When uncertain, search for current data rather than guessing

Source citation:
• Always cite URLs when using web search results
• Make it clear when information is from a live search vs. your training

Today's date: ${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})}`

export const streamChatResponse = async ({
  messages,
  userId,
  conversationId,
  onFinish,
}) => {
  const model = google(env.GEMINI_MODEL)
  const startTime = Date.now()

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,          // allow multi-step tool use (e.g. search → calculate)
    temperature: 0.6,
    maxTokens: 2048,
    onFinish: async ({ text, toolCalls, usage }) => {
      const durationMs = Date.now() - startTime

      // Fire-and-forget observability trace
      traceChat({
        userId,
        conversationId,
        inputMessages: messages,
        outputText: text,
        toolCalls,
        model: env.GEMINI_MODEL,
        durationMs,
        usage,
      }).catch(() => {})

      if (onFinish) {
        await onFinish({ text, toolCalls, usage }).catch(console.error)
      }
    },
  })

  return result
}

/**
 * Generate a short conversation title from the first user message.
 * Falls back gracefully on any error.
 */
export const generateTitle = async (firstMessage) => {
  try {
    const { text } = await generateText({
      model: google(env.GEMINI_MODEL),
      prompt: `Create a short title (4–6 words) for a business chat that starts with:\n"${firstMessage.slice(0, 200)}"\n\nReturn ONLY the title — no quotes, punctuation, or explanation.`,
      maxTokens: 16,
      temperature: 0.3,
    })
    const title = text.trim().replace(/["'.]/g, '').slice(0, 60)
    return title || 'Business Conversation'
  } catch {
    return 'Business Conversation'
  }
}
