import { useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import clsx from 'clsx'

export default function MessageInput({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  disabled,
}) {
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) onSubmit(e)
    }
  }

  return (
    <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100">
      <div
        className={clsx(
          'flex items-end gap-3 bg-slate-50 border rounded-2xl px-4 py-3 transition',
          disabled
            ? 'border-slate-100 opacity-60'
            : 'border-slate-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100'
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your business…"
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none leading-relaxed max-h-40 scrollbar-thin"
        />

        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center transition"
            title="Stop generating"
          >
            <Square className="w-3.5 h-3.5 text-white fill-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!input.trim() || disabled}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
            title="Send message (Enter)"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>
      <p className="text-center text-xs text-slate-400 mt-2">
        BizPilot can make mistakes. Verify important business decisions.
      </p>
    </div>
  )
}
