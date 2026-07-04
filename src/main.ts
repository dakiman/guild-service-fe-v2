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
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
})

const auth = useAuthStore()
configureClient({
  getToken: () => auth.token,
  onUnauthorized: () => {
    auth.clearSession()
    router.push({ name: 'login' })
  },
})

// Don't block first paint on the auth round-trip. The router guard awaits
// `auth.ready` (resolved in fetchMe's finally, or immediately when there's no
// token), so navigation still waits for resolved auth — only the initial paint
// is unblocked. A brief logged-out flash before resolve is accepted. (F1)
void auth.fetchMe()
app.mount('#app')
