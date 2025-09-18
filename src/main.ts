import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from './router'
import '@/main.css'

const app = createApp(App)

Sentry.init({
  app,
  dsn: 'https://fc5e84020ff3efe66cc8d61008908f04@sentry.teritorio.xyz/21',
  integrations: [],
})

app.use(router)
app.mount('#app')
