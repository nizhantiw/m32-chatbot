import { tool } from 'ai'
import { z } from 'zod'

export const calculator = tool({
  description:
    'Perform precise financial and business math: ROI, profit margins, break-even analysis, growth rates, percentages, compound interest, payback periods, and any numeric computation. Use this instead of approximating.',
  parameters: z.object({
    expression: z
      .string()
      .describe(
        'A math expression using +, -, *, /, (, ), and numbers. Example: "(120000 - 85000) / 85000 * 100"'
      ),
    label: z.string().optional().describe('Human-readable name for what is being calculated'),
    unit: z.string().optional().describe('Unit of the result, e.g. "%" or "USD" or "months"'),
  }),
  execute: async ({ expression, label, unit }) => {
    try {
      // Whitelist-sanitize: only allow safe math characters
      const sanitized = expression.replace(/[^0-9+\-*/.()\s%,]/g, '').trim()
      if (!sanitized) {
        return { status: 'error', message: 'Invalid expression — only numbers and math operators allowed.' }
      }

      // Safe evaluation
      // eslint-disable-next-line no-new-func
      const result = new Function(`"use strict"; return (${sanitized})`)()

      if (typeof result !== 'number' || !isFinite(result)) {
        return { status: 'error', message: 'Result is not a valid finite number.' }
      }

      const rounded = Math.round(result * 1e6) / 1e6
      const formatted = rounded.toLocaleString('en-US', { maximumFractionDigits: 4 })

      return {
        status: 'success',
        expression: sanitized,
        label: label || 'Result',
        result: rounded,
        formatted: unit ? `${formatted} ${unit}` : formatted,
        unit: unit || null,
      }
    } catch (err) {
      return { status: 'error', message: `Calculation error: ${err.message}` }
    }
  },
})
