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

    <!-- Formulario (Mock por ahora) -->
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

      <!-- Divisor -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">O accede como</span>
        </div>
      </div>

      <!-- Botones Mock (solo para desarrollo) -->
      <div class="space-y-2">
        <button
          @click="loginAs('ADMINISTRADOR')"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Admin
        </button>

        <button
          @click="loginAs('COORDINADOR')"
          class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
        >
          Coordinador
        </button>

        <button
          @click="loginAs('DOCENTE')"
          class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          Docente
        </button>

        <button
          @click="loginAs('PARTICIPANTE')"
          class="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
        >
          Participante
        </button>
      </div>

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
import type { Rol } from '@/types'

// ============================================
// ESTADO
// ============================================

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')

// ============================================
// MÉTODOS
// ============================================

/**
 * Maneja el login con credenciales
 */
const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert('Por favor ingrese usuario y contraseña')
    return
  }

  const success = await auth.login(username.value, password.value)
  
  if (success) {
    redirectToDashboard()
  } else {
    alert('Credenciales incorrectas')
  }
}

/**
 * Login rápido con rol específico (SOLO PARA DESARROLLO)
 */
const loginAs = (rol: Rol) => {
  auth.loginMock(rol)
  redirectToDashboard()
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