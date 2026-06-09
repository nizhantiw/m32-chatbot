import { useEffect, useRef, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { toast } from 'react-hot-toast'
import { Edit2, Check, X } from 'lucide-react'
import api from '../../api/client.js'
import { useChatStore } from '../../store/chatStore.js'
import Message from './Message.jsx'
import MessageInput from './MessageInput.jsx'
import EmptyState from './EmptyState.jsx'

export default function ChatWindow({ conversationId }) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [conversationTitle, setConversationTitle] = useState('New Conversation')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const bottomRef = useRef(null)
  const { updateTitle, bumpConversation } = useChatStore()

  // Get current access token on each request (handles refresh)
  const getAuthHeader = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
  }), [])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    isLoading,
    setInput,
    setMessages,
  } = useChat({
    api: `/api/chat/${conversationId}/message`,
    headers: getAuthHeader(),
    onFinish: () => {
      bumpConversation(conversationId)
      // Refresh title if it was auto-generated
      api.get(`/conversations/${conversationId}/messages`)
        .then(({ data }) => {
          const t = data.conversation?.title
          if (t && t !== 'New Conversation') {
            setConversationTitle(t)
            updateTitle(conversationId, t)
          }
        })
        .catch(() => {})
    },
    onError: (err) => {
      console.error('[chat error]', err)
      toast.error('Something went wrong. Please try again.')
    },
  })

  // Load history from DB on mount / conversation change
  useEffect(() => {
    if (!conversationId) return
    setIsLoadingHistory(true)
    setMessages([]) // clear while loading

    api.get(`/conversations/${conversationId}/messages`)
      .then(({ data }) => {
        setConversationTitle(data.conversation?.title || 'New Conversation')
        const formatted = (data.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolInvocations: m.tool_calls || m.toolCalls
            ? (() => {
                try {
                  const raw = JSON.parse(m.tool_calls || m.toolCalls || '[]')
                  return raw.map((tc) => ({ ...tc, state: 'result' }))
                } catch { return undefined }
              })()
            : undefined,
        }))
        setMessages(formatted)
      })
      .catch(() => toast.error('Failed to load conversation.'))
      .finally(() => setIsLoadingHistory(false))
  }, [conversationId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSuggestion = (text) => {
    setInput(text)
    setTimeout(() => document.querySelector('textarea')?.focus(), 50)
  }

  const saveTitle = async () => {
    if (!titleInput.trim()) return
    try {
      await api.patch(`/conversations/${conversationId}`, { title: titleInput.trim() })
      setConversationTitle(titleInput.trim())
      updateTitle(conversationId, titleInput.trim())
      setEditingTitle(false)
    } catch {
      toast.error('Could not rename conversation.')
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Select a conversation or create a new one.
      </div>
    )
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50">
      {/* Header */}
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') setEditingTitle(false)
              }}
              autoFocus
              className="flex-1 text-sm font-medium text-slate-900 bg-slate-50 border border-brand-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button onClick={saveTitle} className="text-brand-600 hover:text-brand-700">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingTitle(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0 group">
            <h1 className="text-sm font-semibold text-slate-800 truncate">
              {conversationTitle}
            </h1>
            <button
              onClick={() => { setTitleInput(conversationTitle); setEditingTitle(true) }}
              className="opacity-0 group-hover:opacity-100 transition text-slate-300 hover:text-slate-500"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Gemini
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 min-h-0">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading conversation…
            </div>
          </div>
        ) : !hasMessages ? (
          <EmptyState onSuggestion={handleSuggestion} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <Message
                key={msg.id || i}
                message={msg}
                isStreaming={
                  isLoading &&
                  i === messages.length - 1 &&
                  msg.role === 'assistant'
                }
              />
            ))}
            {/* "Thinking" bubble when AI hasn't started responding yet */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-400 animate-pulse-soft">Thinking…</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onStop={stop}
        isLoading={isLoading}
        disabled={isLoadingHistory}
      />
    </div>
  )
}
