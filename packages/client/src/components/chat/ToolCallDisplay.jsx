import { useState } from 'react'
import { Search, Calculator, Clock, ChevronDown, ChevronUp, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const TOOL_META = {
  webSearch: {
    icon: Search,
    label: 'Web Search',
    color: 'bg-blue-50 border-blue-100 text-blue-700',
    iconColor: 'text-blue-500',
  },
  calculator: {
    icon: Calculator,
    label: 'Calculator',
    color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    iconColor: 'text-emerald-500',
  },
  getDateTime: {
    icon: Clock,
    label: 'Date & Time',
    color: 'bg-purple-50 border-purple-100 text-purple-700',
    iconColor: 'text-purple-500',
  },
}

function WebSearchResult({ result }) {
  if (!result || result.status === 'unavailable') {
    return (
      <p className="text-xs text-slate-500 italic">
        {result?.message || 'Search unavailable — add TAVILY_API_KEY to enable.'}
      </p>
    )
  }
  if (result.status === 'error') {
    return <p className="text-xs text-red-500">Search error: {result.message}</p>
  }

  return (
    <div className="space-y-2">
      {result.answer && (
        <p className="text-xs text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
          {result.answer}
        </p>
      )}
      {result.results?.slice(0, 3).map((r, i) => (
        <a
          key={i}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 group"
        >
          <ExternalLink className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-600 group-hover:underline truncate">
              {r.title}
            </p>
            {r.snippet && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{r.snippet}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

function CalculatorResult({ result }) {
  if (result?.status === 'error') {
    return <p className="text-xs text-red-500">{result.message}</p>
  }
  return (
    <div className="text-xs text-slate-700">
      <span className="font-mono bg-white px-2 py-1 rounded border border-slate-100">
        {result?.expression}
      </span>
      <span className="mx-2 text-slate-400">=</span>
      <span className="font-semibold text-emerald-700 text-sm">{result?.formatted || result?.result}</span>
      {result?.unit && <span className="ml-1 text-slate-500">{result.unit}</span>}
    </div>
  )
}

function DateTimeResult({ result }) {
  return (
    <p className="text-xs text-slate-700">
      <span className="font-medium">{result?.date}</span>
      {result?.time && (
        <span className="text-slate-500 ml-2">at {result.time}</span>
      )}
    </p>
  )
}

export default function ToolCallDisplay({ toolInvocations }) {
  const [expanded, setExpanded] = useState({})

  if (!toolInvocations?.length) return null

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-2 my-2">
      {toolInvocations.map((inv) => {
        const meta = TOOL_META[inv.toolName] || {
          icon: Search,
          label: inv.toolName,
          color: 'bg-slate-50 border-slate-100 text-slate-700',
          iconColor: 'text-slate-400',
        }
        const Icon = meta.icon
        const isDone = inv.state === 'result'
        const isOpen = expanded[inv.toolCallId]

        let query = ''
        if (inv.toolName === 'webSearch') query = inv.args?.query || ''
        if (inv.toolName === 'calculator') query = inv.args?.label || inv.args?.expression || ''
        if (inv.toolName === 'getDateTime') query = inv.args?.timezone || 'UTC'

        return (
          <div
            key={inv.toolCallId}
            className={clsx(
              'rounded-xl border text-xs overflow-hidden',
              meta.color
            )}
          >
            <button
              onClick={() => isDone && toggle(inv.toolCallId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left"
            >
              {isDone ? (
                <CheckCircle className={clsx('w-3.5 h-3.5 flex-shrink-0', meta.iconColor)} />
              ) : (
                <Loader2 className={clsx('w-3.5 h-3.5 flex-shrink-0 animate-spin', meta.iconColor)} />
              )}
              <Icon className={clsx('w-3 h-3 flex-shrink-0', meta.iconColor)} />
              <span className="font-medium">{meta.label}</span>
              {query && (
                <span className="text-opacity-70 truncate flex-1">— {query}</span>
              )}
              {isDone && (
                <span className="ml-auto flex-shrink-0">
                  {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              )}
            </button>

            {isDone && isOpen && inv.result && (
              <div className="px-3 pb-3 pt-1 border-t border-current border-opacity-10">
                {inv.toolName === 'webSearch' && <WebSearchResult result={inv.result} />}
                {inv.toolName === 'calculator' && <CalculatorResult result={inv.result} />}
                {inv.toolName === 'getDateTime' && <DateTimeResult result={inv.result} />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
