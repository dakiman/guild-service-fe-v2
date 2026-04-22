import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { configureClient } from './api/client'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(VueQueryPlugin)

const auth = useAuthStore()
configureClient({
  getToken: () => auth.token,
  onUnauthorized: () => {
    auth.clearSession()
    router.push({ name: 'login' })
  },
})

auth.fetchMe().finally(() => {
  app.mount('#app')
})
