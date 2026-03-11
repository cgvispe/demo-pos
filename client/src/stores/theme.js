import { defineStore } from 'pinia'
import api from '@/api'

const FONT_MAP = {
  'Neue Haas Unica': "'Neue Haas Unica', 'Inter', Arial, sans-serif",  // woff2 needed in /public/fonts/
  'Inter':           "'Inter', sans-serif",
  'Poppins':         "'Poppins', sans-serif",
  'Roboto':          "'Roboto', sans-serif",
  'Arial':           "Arial, sans-serif",
}

const FONT_SIZE_MAP = {
  'small':  '13px',
  'normal': '15px',
  'large':  '17px',
}

// ── Sesami Dark palette — brand guidelines §3.2 ─────────────────────────────
// Gray scale: #19191F → #25252D → #36363E → #3F3F46
// Aqua: #5CE5DB (primary), #00A699 (darker shade)
const DARK_PALETTE = {
  bg:       '#19191F',   // Gray 1
  surface:  '#25252D',   // Gray 2
  surface2: '#36363E',   // Gray 3
  surface3: '#3F3F46',   // Gray 4
  border:   '#3F3F46',   // Gray 4
  text:     '#F6F6F7',   // Gray 10 (near white)
  text2:    '#929296',   // Gray 7
  text3:    '#66666C',   // Gray 5
}

// ── Sesami Light palette — brand guidelines §3.1 ────────────────────────────
// White / Light Gray / near-white surfaces
const LIGHT_PALETTE = {
  bg:       '#EEEEEE',   // Light Gray
  surface:  '#FFFFFF',   // White
  surface2: '#F6F6F7',   // Gray 10
  surface3: '#EEEEEE',   // Light Gray
  border:   '#D3D3D5',   // Gray 8
  text:     '#19191F',   // Gray 1 (near black)
  text2:    '#3F3F46',   // Gray 4
  text3:    '#7C7C81',   // Gray 6
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode:         'dark',
    primaryColor: '#5CE5DB',   // Sesami Aqua
    fontFamily:   'Neue Haas Unica',
    fontSize:     'normal',    // small | normal | large
    logoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAwADgDASIAAhEBAxEB/8QAGwABAQEAAgMAAAAAAAAAAAAAAAcGBQgCAwn/xAA0EAAABQIBCAgGAwAAAAAAAAAAAQIDBAUGEQcIEhYYIVVzMTQ2OFNWk9GSlbGytNITYnH/xAAaAQABBQEAAAAAAAAAAAAAAAACAAEDBAUH/8QAKhEAAQQBAAYLAAAAAAAAAAAAAQACAwQRBQYSMUFxITIzNDVhcoGywdH/2gAMAwEAAhEDEQA/AO5YD0T5TMKG7LkGZNNJ0lGRYnh/g4XXKheM96KgbY3O3BVZ71au7ZleGnzOFoQGe1yoXjPeioZu+Ms9iWa3EXXJk1pMtS0tfxQ1uYmkiM8cC3dJBzE8DJCCLSNSZ4ZHICTwBCooCKbUOSTiVU+WO+wbUOSTiVU+WO+wDBV1WsBw1kXNSbxtaFctDcddp01KlMqcbNtRklRpPFJ7y3pMAyS87x7MT+Uf1EoFXvHsxP5R/USgaNPqHmufa3d6Z6fsoIbnadTtrmyPtQLkIbnadTtrmyPtQJp+zKzdXvEY/f4lQMAAZy6ivoRmm93u1eU/+Q6AZpvd7tXlP/kOgIjvRKlVWGioU5+EtakJeTompPSQzOocLiEn4U+w14A2SvYMNKo2tG1bbg+ZmSOjishqHC4hJ+FPsMblOyCUW+2qe3MuCpwyhKcUk2UNnpaZJI8cS/qLCAczyOGCVHBoilXkEkceHDn+rrRsgWv5yrvpM/qGyBa/nKu+kz+o7LgI9orSWbyZWjFsSxqbakOY/MYp6VpQ88REtektS9+ju6VYANIAZJf/2Q==',
    businessName:   'Demo POS Store',
    currency:       'EUR',
    currencySymbol: '€',
    locale:         'es-ES'
  }),

  actions: {
    async loadFromServer() {
      try {
        const res = await api.get('/settings')
        const s = res.data
        this.businessName   = s.businessName   || 'Demo POS Store'
        this.currency       = s.currency       || 'EUR'
        this.currencySymbol = s.currencySymbol || '€'
        this.locale         = s.locale         || 'es-ES'
        if (s.theme) {
          this.mode         = s.theme.mode         || 'dark'
          this.primaryColor = s.theme.primaryColor || '#5CE5DB'
          this.fontFamily   = s.theme.fontFamily   || 'Neue Haas Unica'
          this.fontSize     = s.theme.fontSize     || 'normal'
          this.logoUrl      = s.theme.logoUrl      || this.logoUrl
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
      root.style.setProperty('--color-primary-alpha', this.primaryColor + '33')

      // Sesami brand accent colors always available as variables
      root.style.setProperty('--color-aqua',    '#5CE5DB')
      root.style.setProperty('--color-purple',  '#A6A6FF')
      root.style.setProperty('--color-yellow',  '#E7F218')

      root.style.setProperty('--color-success',       '#5CE5DB')
      root.style.setProperty('--color-success-alpha', '#5CE5DB22')
      root.style.setProperty('--color-danger',        '#f05252')
      root.style.setProperty('--color-danger-alpha',  '#f0525222')
      root.style.setProperty('--color-warning',       '#E7F218')
      root.style.setProperty('--color-warning-alpha', '#E7F21822')
      root.style.setProperty('--color-info',          '#A6A6FF')

      if (this.mode === 'dark') {
        root.style.setProperty('--shadow-sm', '0 1px 4px rgba(0,0,0,0.6)')
        root.style.setProperty('--shadow-md', '0 4px 20px rgba(0,0,0,0.75)')
        root.style.setProperty('--shadow-lg', '0 8px 40px rgba(0,0,0,0.85)')
      } else {
        root.style.setProperty('--shadow-sm', '0 1px 3px rgba(25,25,31,0.10)')
        root.style.setProperty('--shadow-md', '0 4px 16px rgba(25,25,31,0.15)')
        root.style.setProperty('--shadow-lg', '0 8px 32px rgba(25,25,31,0.20)')
      }

      root.style.setProperty('--font-family', FONT_MAP[this.fontFamily] || FONT_MAP['Neue Haas Unica'])
      root.style.setProperty('--font-size-base', FONT_SIZE_MAP[this.fontSize] || '15px')
      document.documentElement.style.fontSize = FONT_SIZE_MAP[this.fontSize] || '15px'
      document.body.setAttribute('data-theme', this.mode)
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat(this.locale, {
        style:    'currency',
        currency: this.currency
      }).format(amount)
    }
  }
})
