import { tool } from 'ai'
import { z } from 'zod'
import { env } from '../config/env.js'

export const webSearch = tool({
  description:
    'Search the web for current information: market data, competitor research, industry trends, company news, pricing, regulations, and any business topic requiring up-to-date facts. Always use this instead of guessing.',
  parameters: z.object({
    query: z
      .string()
      .describe(
        'Specific search query. Include company names, dates, or industry context for better results.'
      ),
    maxResults: z
      .number()
      .min(1)
      .max(8)
      .optional()
      .default(5)
      .describe('Number of results to return (1–8)'),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    if (!env.TAVILY_API_KEY) {
      return {
        status: 'unavailable',
        message:
          'Web search is not configured. Add TAVILY_API_KEY to .env to enable live search.',
        query,
      }
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          search_depth: 'basic',
          include_answer: true,
          include_raw_content: false,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return { status: 'error', message: `Search API error: ${text}`, query }
      }

      const data = await response.json()

      return {
        status: 'success',
        query,
        answer: data.answer || null,
        results: (data.results || []).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 400) || '',
          publishedDate: r.published_date || null,
        })),
        searchedAt: new Date().toISOString(),
      }
    } catch (err) {
      return { status: 'error', message: err.message, query }
    }
  },
})
