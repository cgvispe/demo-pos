import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('pos_token') || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isManager: (state) => state.user?.role === 'manager',
    isCashier: (state) => state.user?.role === 'cashier' || state.user?.role === 'manager'
  },

  actions: {
    async login(username, password) {
      const res = await api.post('/auth/login', { username, password })
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('pos_token', this.token)
      return res.data.user
    },

    async fetchMe() {
      if (!this.token) return
      try {
        const res = await api.get('/auth/me')
        this.user = res.data
      } catch {
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('pos_token')
    }
  }
})
