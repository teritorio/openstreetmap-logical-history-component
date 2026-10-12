import { createToaster } from '@ark-ui/vue'
import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from './router'
import '@/main.css'

const app = createApp(App)
const toaster = createToaster({ placement: 'top' })

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
})

app.use(router)
app.provide('toaster', toaster)
app.mount('#app')
