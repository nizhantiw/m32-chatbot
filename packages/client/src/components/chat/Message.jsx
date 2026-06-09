import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import ToolCallDisplay from './ToolCallDisplay.jsx'

export default function Message({ message, isStreaming }) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content && !message.toolInvocations?.length

  return (
    <div
      className={clsx(
        'flex gap-3 animate-slide-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={clsx('max-w-[80%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        {/* Tool calls */}
        {!isUser && message.toolInvocations?.length > 0 && (
          <ToolCallDisplay toolInvocations={message.toolInvocations} />
        )}

        {/* Message bubble */}
        {(message.content || (isStreaming && isEmpty)) && (
          <div
            className={clsx(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isUser
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className={clsx('chat-prose', isStreaming && !message.content && 'cursor-blink')}>
                {message.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  isStreaming && <span className="text-slate-400 text-xs">Thinking</span>
                )}
                {isStreaming && message.content && (
                  <span className="cursor-blink" aria-hidden />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold text-slate-600">
          You
        </div>
      )}
    </div>
  )
}
