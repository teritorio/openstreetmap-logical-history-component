import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from './router'
import '@/main.css'

const app = createApp(App)

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [],
})

app.use(router)
app.mount('#app')
