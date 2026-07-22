import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/tailwind.css'
import { useAuthStore } from '@/stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializar autenticación — se espera antes de montar para que los
// guards del router ya tengan el estado final (logueado o no) en la
// primera navegación, en vez de decidir con datos a medio cargar.
const authStore = useAuthStore()
authStore.initializeAuth().finally(() => {
  app.mount('#app')
})