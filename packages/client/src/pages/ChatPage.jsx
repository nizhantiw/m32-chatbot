import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChatStore } from '../store/chatStore.js'
import Sidebar from '../components/chat/Sidebar.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'

export default function ChatPage() {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { activeConversationId, setActiveConversation, conversations, createConversation } =
    useChatStore()

  // Sync URL param → store
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId)
    }
  }, [conversationId])

  // If no conversation in URL, go to most recent or create one
  useEffect(() => {
    if (!conversationId) {
      if (conversations.length > 0) {
        navigate(`/chat/${conversations[0].id}`, { replace: true })
      } else {
        // We'll wait for conversations to load
        const timeout = setTimeout(async () => {
          if (conversations.length === 0) {
            const conv = await createConversation()
            navigate(`/chat/${conv.id}`, { replace: true })
          } else {
            navigate(`/chat/${conversations[0].id}`, { replace: true })
          }
        }, 500)
        return () => clearTimeout(timeout)
      }
    }
  }, [conversationId, conversations])

  const handleConversationSelect = (id) => {
    navigate(`/chat/${id}`)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onConversationSelect={handleConversationSelect} />
      <ChatWindow
        conversationId={conversationId || activeConversationId}
        key={conversationId || activeConversationId}
      />
    </div>
  )
}
