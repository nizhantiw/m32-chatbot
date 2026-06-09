import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  TrendingUp,
  MessageSquare,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { useChatStore } from '../../store/chatStore.js'
import { useAuthStore } from '../../store/authStore.js'

export default function Sidebar({ onConversationSelect }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const {
    conversations,
    activeConversationId,
    isLoadingConversations,
    fetchConversations,
    createConversation,
    deleteConversation,
    setActiveConversation,
  } = useChatStore()

  const [deletingId, setDeletingId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleNew = async () => {
    try {
      const conv = await createConversation()
      onConversationSelect?.(conv.id)
    } catch {
      toast.error('Could not start a new conversation.')
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteConversation(id)
    } catch {
      toast.error('Could not delete conversation.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-none">BizPilot</p>
            <p className="text-xs text-slate-400 mt-0.5">AI Business Co-Pilot</p>
          </div>
        </div>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 h-9 px-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        {isLoadingConversations ? (
          <div className="space-y-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No conversations yet</p>
            <p className="text-xs text-slate-400">Click "New conversation" to start</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversation(conv.id)
                  onConversationSelect?.(conv.id)
                }}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-xl transition group flex items-center gap-2',
                  activeConversationId === conv.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'hover:bg-slate-50 text-slate-700'
                )}
              >
                <MessageSquare
                  className={clsx(
                    'w-3.5 h-3.5 flex-shrink-0',
                    activeConversationId === conv.id ? 'text-brand-500' : 'text-slate-400'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-none mb-0.5">
                    {conv.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                {(hoveredId === conv.id || deletingId === conv.id) && (
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    disabled={deletingId === conv.id}
                    className="flex-shrink-0 text-slate-300 hover:text-red-400 transition p-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-700">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-300 hover:text-red-400 transition p-1 rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
