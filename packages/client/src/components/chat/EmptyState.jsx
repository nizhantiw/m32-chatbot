import { TrendingUp, Search, Calculator, Globe, BarChart2 } from 'lucide-react'

const SUGGESTIONS = [
  {
    icon: Search,
    text: "Who are the top 3 competitors of Shopify in SMB e-commerce?",
    category: "Competitor Research",
  },
  {
    icon: Calculator,
    text: "Calculate the ROI if I invest $50,000 and get $75,000 back in 18 months",
    category: "Financial Calc",
  },
  {
    icon: Globe,
    text: "What are the latest SaaS pricing trends for B2B companies in 2024?",
    category: "Market Research",
  },
  {
    icon: BarChart2,
    text: "What's the average profit margin for a software company?",
    category: "Industry Data",
  },
]

export default function EmptyState({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-6">
        <TrendingUp className="w-8 h-8 text-brand-600" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">
        How can I help your business today?
      </h2>
      <p className="text-slate-500 text-sm max-w-sm mb-10 leading-relaxed">
        I can research competitors, analyze markets, perform financial calculations, and answer your business questions with cited sources.
      </p>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.text}
              onClick={() => onSuggestion(s.text)}
              className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-brand-200 hover:bg-brand-50 transition text-left group"
            >
              <div className="w-8 h-8 bg-brand-50 group-hover:bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 transition">
                <Icon className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-brand-600 mb-1">{s.category}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
