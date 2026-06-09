import { create } from 'zustand'
import api from '../api/client.js'

const loadFromStorage = () => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })(),
})

export const useAuthStore = create((set, get) => ({
  ...loadFromStorage(),
  isInitializing: true,

  // Called on app mount to validate stored token
  init: async () => {
    const { accessToken } = get()
    if (!accessToken) {
      set({ isInitializing: false })
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, isInitializing: false })
    } catch {
      get().logout()
      set({ isInitializing: false })
    }
  },

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, accessToken, refreshToken })
  },

  logout: () => {
    const { refreshToken } = get()
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {})
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ user: null, accessToken: null, refreshToken: null })
  },

  get isAuthenticated() {
    return Boolean(get().user && get().accessToken)
  },
}))
