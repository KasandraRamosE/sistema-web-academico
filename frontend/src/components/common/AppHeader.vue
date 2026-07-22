<template>
  <!-- El selector de rol no aparece para DISENADOR aunque tenga varios roles -->
  <header class="bg-white shadow-md sticky top-0 z-50">
    <nav class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-3 hover:opacity-80 transition">
          <div class="w-11 h-11 rounded-lg overflow-hidden ring-2 ring-emerald-500/30 bg-white">
            <img :src="logo" alt="Logo FHCE" class="w-full h-full object-cover" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-800 hidden sm:block">
              FHCE - Cursos y Eventos
            </h1>
            <p class="text-xs text-gray-500 hidden md:block">
              Universidad Mayor de San Andrés
            </p>
          </div>
        </router-link>

        <div class="hidden md:flex items-center space-x-6">
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/"
              class="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Inicio
            </router-link>
          </template>

          <template v-if="authStore.isAuthenticated && authStore.currentRole === 'PARTICIPANTE'">
            <router-link 
              to="/participante" 
              class="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Inicio
            </router-link>
            <router-link 
              to="/participante/inscripciones" 
              class="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Mis Inscripciones
            </router-link>
            <router-link 
              to="/participante/certificados" 
              class="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Mis Certificados
            </router-link>
          </template>
          
          <div v-if="!authStore.isAuthenticated" class="flex items-center space-x-3">
            <router-link 
              to="/auth/login" 
              class="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Iniciar Sesión
            </router-link>
            <router-link 
              to="/auth/registro" 
              class="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Registrarse
            </router-link>
          </div>

          <div v-else class="flex items-center space-x-4">
            <div
              v-if="canChangeRole" 
              class="relative"
              ref="roleMenuRef"
            >
              <button
                @click="toggleRoleMenu"
                class="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-sm font-medium text-gray-700">
                  {{ getCurrentRoleName() }}
                </span>
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                v-if="showRoleMenu" 
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
              >
                <p class="px-4 py-2 text-xs text-gray-500 font-semibold uppercase">
                  Cambiar Rol
                </p>
                <button
                  v-for="role in authStore.availableRoles"
                  :key="role"
                  @click="handleChangeRole(role)"
                  :class="[
                    'w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between',
                    authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                  ]"
                >
                  <span>{{ getRoleName(role) }}</span>
                  <svg 
                    v-if="authStore.currentRole === role" 
                    class="w-5 h-5 text-purple-600" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="text-right">
              <p class="text-sm font-semibold text-gray-800">
                {{ authStore.fullName }}
              </p>
            </div>

            <router-link
              v-if="authStore.currentRole === 'PARTICIPANTE'"
              to="/participante/perfil"
              class="text-gray-600 hover:text-purple-600 transition-colors"
              title="Mi perfil"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </router-link>

            <button
              @click="handleLogout"
              class="text-gray-600 hover:text-red-600 transition-colors"
              title="Cerrar sesión"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <button
          @click="toggleMobileMenu"
          class="md:hidden text-gray-700 focus:outline-none"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              v-if="!showMobileMenu"
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M4 6h16M4 12h16M4 18h16" 
            />
            <path 
              v-else
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>

      <div
        v-if="showMobileMenu" 
        class="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3"
      >
        <template v-if="!authStore.isAuthenticated">
          <router-link
            to="/"
            class="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            @click="closeMobileMenu"
          >
            Inicio
          </router-link>
        </template>

        <template v-if="authStore.isAuthenticated && authStore.currentRole === 'PARTICIPANTE'">
          <router-link 
            to="/participante" 
            class="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            @click="closeMobileMenu"
          >
            Inicio
          </router-link>
          <router-link 
            to="/participante/inscripciones" 
            class="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            @click="closeMobileMenu"
          >
            Mis Inscripciones
          </router-link>
          <router-link 
            to="/participante/certificados" 
            class="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            @click="closeMobileMenu"
          >
            Mis Certificados
          </router-link>
          <router-link 
            to="/participante/perfil" 
            class="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            @click="closeMobileMenu"
          >
            Mi Perfil
          </router-link>
        </template>

        <div v-if="!authStore.isAuthenticated" class="space-y-2 pt-2">
          <router-link 
            to="/auth/login" 
            class="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            @click="closeMobileMenu"
          >
            Iniciar Sesión
          </router-link>
          <router-link 
            to="/auth/registro" 
            class="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
            @click="closeMobileMenu"
          >
            Registrarse
          </router-link>
        </div>

        <div v-else class="space-y-3 pt-2 border-t border-gray-200">
          <div class="text-sm">
            <p class="font-semibold text-gray-800">
              {{ authStore.fullName }}
            </p>
          </div>

          <div v-if="canChangeRole" class="space-y-2">
            <p class="text-xs text-gray-500 font-semibold uppercase">Cambiar Rol</p>
            <button
              v-for="role in authStore.availableRoles"
              :key="role"
              @click="handleChangeRole(role)"
              :class="[
                'w-full text-left px-3 py-2 rounded-lg transition-colors',
                authStore.currentRole === role 
                  ? 'bg-purple-100 text-purple-700 font-semibold' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              ]"
            >
              {{ getRoleName(role) }}
            </button>
          </div>

          <button
            @click="handleLogout"
            class="w-full text-center bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import logo from '@/assets/images/logo.jpg'
import type { Rol } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const showMobileMenu = ref(false)
const showRoleMenu = ref(false)
// Para detectar clicks fuera del menú y cerrarlo (ver handleClickOutside)
const roleMenuRef = ref<HTMLElement | null>(null)

const canChangeRole = computed(() => {
  if (!authStore.user) return false
  return authStore.availableRoles.length > 1
})

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (showMobileMenu.value) {
    showRoleMenu.value = false
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const toggleRoleMenu = () => {
  showRoleMenu.value = !showRoleMenu.value
}

const handleChangeRole = (role: Rol) => {
  const success = authStore.changeRole(role)

  if (success) {
    showRoleMenu.value = false
    showMobileMenu.value = false
    redirectToDashboard(role)
  }
}

const redirectToDashboard = (role: Rol) => {
  const routes: Record<Rol, string> = {
    'ADMINISTRADOR': '/admin',
    'COORDINADOR': '/coordinador',
    'DOCENTE': '/docente',
    'PARTICIPANTE': '/participante',
    'AUXILIAR': '/auxiliar/eventos',
    'DISENADOR': '/disenador'
  }
  
  router.push(routes[role] || '/')
}

const getCurrentRoleName = (): string => {
  return getRoleName(authStore.currentRole)
}

const getRoleName = (role: Rol | null): string => {
  if (!role) return ''
  
  const roleNames: Record<Rol, string> = {
    ADMINISTRADOR: 'Administrador',
    COORDINADOR: 'Coordinador',
    DOCENTE: 'Docente',
    PARTICIPANTE: 'Participante',
    AUXILIAR: 'Auxiliar',
    DISENADOR: 'Diseñador Gráfico'
  }
  
  return roleNames[role] || role
}

const handleLogout = () => {
  authStore.logout()
  showMobileMenu.value = false
  showRoleMenu.value = false
  router.push('/')
}

const handleClickOutside = (event: MouseEvent) => {
  if (roleMenuRef.value && !roleMenuRef.value.contains(event.target as Node)) {
    showRoleMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>