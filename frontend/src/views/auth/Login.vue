<template>
        <!-- 
    Vista de Login
    Permite login con diferentes roles (MOCK para desarrollo)
  -->
  <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
    <!-- Logo/Título -->
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span class="text-white font-bold text-2xl">F</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">
        Iniciar Sesión
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Sistema de Cursos y Eventos - FHCE
      </p>
    </div>

    <!-- Formulario -->
    <div class="space-y-4">
      <!-- Usuario -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Usuario
        </label>
        <input
          v-model="username"
          type="text"
          placeholder="Ingrese su usuario"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <!-- Contraseña -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          v-model="password"
          type="password"
          placeholder="Ingrese su contraseña"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <!-- Botón de login -->
      <button
        @click="handleLogin"
        class="w-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white py-2 rounded-lg hover:shadow-lg transition-all font-medium"
      >
        Iniciar Sesión
      </button>

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <!-- Link de registro -->
      <div class="text-center mt-4">
        <router-link 
          to="/auth/registro" 
          class="text-sm text-primary-600 hover:text-primary-700"
        >
          ¿No tienes cuenta? Regístrate aquí
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

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
    'AUXILIAR': '/participante',
    'DISENADOR': '/participante'
  }
  
  const route = currentRole ? routes[currentRole] : '/'
  router.push(route)
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>