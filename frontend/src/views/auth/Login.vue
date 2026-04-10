<template>
        <!-- 
    Vista de Login
    Permite login con diferentes roles (MOCK para desarrollo)
  -->
  <div class="relative">
    <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-300/30 via-transparent to-emerald-300/30 blur-2xl"></div>
    <div class="relative bg-white/95 border border-white/60 rounded-3xl shadow-2xl p-8 backdrop-blur">
      <!-- Logo/Titulo -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
          <span class="text-white font-bold text-2xl">FH</span>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-amber-600">FHCE Cursos</p>
          <h2 class="text-2xl font-bold text-slate-900">Iniciar Sesion</h2>
          <p class="text-sm text-slate-500">Accede a tu espacio de cursos</p>
        </div>
      </div>

      <!-- Formulario -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="Tu usuario"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contrasena</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Tu contrasena"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:shadow-xl transition"
        >
          Entrar
        </button>

        <p v-if="errorMessage" class="text-sm text-red-600" role="status">
          {{ errorMessage }}
        </p>

        <div class="text-center pt-2">
          <router-link
            to="/auth/registro"
            class="text-sm text-amber-700 hover:text-amber-800"
          >
            ¿No tienes cuenta? Crea una ahora
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import type { Rol } from '@/types'

// ============================================
// ESTADO
// ============================================

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')

// ============================================
// MÉTODOS
// ============================================

/**
 * Maneja el login con credenciales
 */
const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Por favor ingrese usuario y contraseña'
    return
  }

  const success = await auth.login(username.value, password.value)
  
  if (success) {
    errorMessage.value = ''
    redirectToDashboard()
  } else {
    errorMessage.value = 'Credenciales incorrectas'
  }
}

/**
 * Redirige al dashboard según el rol
 */
const redirectToDashboard = () => {
  const currentRole = auth.currentRole
  
  const routes: Record<Rol, string> = {
    'ADMINISTRADOR': '/admin',
    'COORDINADOR': '/coordinador',
    'DOCENTE': '/docente',
    'PARTICIPANTE': '/participante',
    'AUXILIAR': '/auxiliar',
    'DISENADOR': '/disenador'
  }
  
  const route = currentRole ? routes[currentRole] : '/'
  router.push(route)
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>