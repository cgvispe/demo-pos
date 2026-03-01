import { defineStore } from 'pinia'
import { useThemeStore } from './theme'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] // { id, code, name, price, emoji, imageUrl, qty }
  }),

  getters: {
    total: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
    isEmpty: (state) => state.items.length === 0,

    formattedTotal() {
      const theme = useThemeStore()
      return theme.formatCurrency(this.total)
    }
  },

  actions: {
    addItem(product) {
      const existing = this.items.find(i => i.id === product.id)
      if (existing) {
        existing.qty++
      } else {
        this.items.push({ ...product, qty: 1 })
      }
    },

    removeItem(id) {
      const idx = this.items.findIndex(i => i.id === id)
      if (idx !== -1) this.items.splice(idx, 1)
    },

    increaseQty(id) {
      const item = this.items.find(i => i.id === id)
      if (item) item.qty++
    },

    decreaseQty(id) {
      const item = this.items.find(i => i.id === id)
      if (!item) return
      if (item.qty <= 1) {
        this.removeItem(id)
      } else {
        item.qty--
      }
    },

    clear() {
      this.items = []
    }
  }
})
