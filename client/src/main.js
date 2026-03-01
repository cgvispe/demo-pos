import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth and theme before mounting
const auth = useAuthStore()
const theme = useThemeStore()

Promise.all([
  auth.fetchMe(),
  theme.loadFromServer()
]).finally(() => {
  app.mount('#app')
})
