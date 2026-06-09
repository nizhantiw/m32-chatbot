import { create } from 'zustand'
import api from '../api/client.js'

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isLoadingConversations: false,

  fetchConversations: async () => {
    set({ isLoadingConversations: true })
    try {
      const { data } = await api.get('/conversations')
      set({ conversations: data.conversations })
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  createConversation: async () => {
    const { data } = await api.post('/conversations', { title: 'New Conversation' })
    set((s) => ({
      conversations: [data.conversation, ...s.conversations],
      activeConversationId: data.conversation.id,
    }))
    return data.conversation
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  updateTitle: (id, title) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),

  deleteConversation: async (id) => {
    await api.delete(`/conversations/${id}`)
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id)
      const newActive =
        s.activeConversationId === id
          ? (filtered[0]?.id ?? null)
          : s.activeConversationId
      return { conversations: filtered, activeConversationId: newActive }
    })
  },

  bumpConversation: (id, title) =>
    set((s) => {
      const updated = s.conversations.map((c) =>
        c.id === id
          ? { ...c, updatedAt: new Date().toISOString(), title: title || c.title }
          : c
      )
      // Re-sort: most recent first
      updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      return { conversations: updated }
    }),
}))
