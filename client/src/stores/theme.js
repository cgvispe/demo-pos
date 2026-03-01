import { defineStore } from 'pinia'
import api from '@/api'

const FONT_MAP = {
  'Inter': "'Inter', sans-serif",
  'Poppins': "'Poppins', sans-serif",
  'Roboto': "'Roboto', sans-serif"
}

// Sesami dark palette — near-black backgrounds, subtle surface steps, teal accent
const DARK_PALETTE = {
  bg:       '#090b0f',
  surface:  '#0f1117',
  surface2: '#15181f',
  surface3: '#1c2028',
  border:   '#1e2330',
  text:     '#e8edf2',
  text2:    '#8896a8',
  text3:    '#4d5a6b',
}

const LIGHT_PALETTE = {
  bg:       '#f0f4f8',
  surface:  '#ffffff',
  surface2: '#f8fafc',
  surface3: '#edf0f5',
  border:   '#dde3ec',
  text:     '#0d1117',
  text2:    '#4a5568',
  text3:    '#94a3b8',
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'dark',
    primaryColor: '#00c4b3',   // Sesami teal
    fontFamily: 'Inter',
    logoUrl: null,
    businessName: 'Demo POS Store',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'es-ES'
  }),

  actions: {
    async loadFromServer() {
      try {
        const res = await api.get('/settings')
        const s = res.data
        this.businessName = s.businessName || 'Demo POS Store'
        this.currency = s.currency || 'EUR'
        this.currencySymbol = s.currencySymbol || '€'
        this.locale = s.locale || 'es-ES'
        if (s.theme) {
          this.mode = s.theme.mode || 'dark'
          this.primaryColor = s.theme.primaryColor || '#00c4b3'
          this.fontFamily = s.theme.fontFamily || 'Inter'
          this.logoUrl = s.theme.logoUrl || null
        }
        this.apply()
      } catch (e) {
        this.apply()
      }
    },

    apply() {
      const root = document.documentElement
      const p = this.mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE

      root.style.setProperty('--color-bg',        p.bg)
      root.style.setProperty('--color-surface',   p.surface)
      root.style.setProperty('--color-surface-2', p.surface2)
      root.style.setProperty('--color-surface-3', p.surface3)
      root.style.setProperty('--color-border',    p.border)
      root.style.setProperty('--color-text',      p.text)
      root.style.setProperty('--color-text-2',    p.text2)
      root.style.setProperty('--color-text-3',    p.text3)

      root.style.setProperty('--color-primary',       this.primaryColor)
      root.style.setProperty('--color-primary-alpha', this.primaryColor + '22')

      root.style.setProperty('--color-success',       '#00c4b3')
      root.style.setProperty('--color-success-alpha', '#00c4b322')
      root.style.setProperty('--color-danger',        '#f05252')
      root.style.setProperty('--color-danger-alpha',  '#f0525222')
      root.style.setProperty('--color-warning',       '#f0a500')
      root.style.setProperty('--color-warning-alpha', '#f0a50022')
      root.style.setProperty('--color-info',          '#3b9eff')

      if (this.mode === 'dark') {
        root.style.setProperty('--shadow-sm', '0 1px 4px rgba(0,0,0,0.5)')
        root.style.setProperty('--shadow-md', '0 4px 20px rgba(0,0,0,0.65)')
        root.style.setProperty('--shadow-lg', '0 8px 40px rgba(0,0,0,0.8)')
      } else {
        root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.1)')
        root.style.setProperty('--shadow-md', '0 4px 16px rgba(0,0,0,0.15)')
        root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0,0,0,0.2)')
      }

      root.style.setProperty('--font-family', FONT_MAP[this.fontFamily] || FONT_MAP['Inter'])
      document.body.setAttribute('data-theme', this.mode)
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency: this.currency
      }).format(amount)
    }
  }
})
