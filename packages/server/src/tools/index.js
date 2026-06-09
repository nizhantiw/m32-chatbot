import { tool } from 'ai'
import { z } from 'zod'
import { webSearch } from './webSearch.js'
import { calculator } from './calculator.js'

const getDateTime = tool({
  description:
    "Get today's date and current time. Use this when the user asks about the current date, day of the week, or time.",
  parameters: z.object({
    timezone: z.string().optional().default('UTC'),
  }),
  execute: async ({ timezone = 'UTC' }) => {
    const now = new Date()
    try {
      return {
        iso: now.toISOString(),
        date: now.toLocaleDateString('en-US', {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: now.toLocaleTimeString('en-US', { timeZone: timezone }),
        timezone,
      }
    } catch {
      return { iso: now.toISOString(), timezone: 'UTC' }
    }
  },
})

export const tools = {
  webSearch,
  calculator,
  getDateTime,
}
