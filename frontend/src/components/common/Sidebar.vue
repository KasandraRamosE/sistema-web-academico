<template>
  <!--
    Sidebar completo para roles administrativos
    Incluye: Logo, Navegación, Perfil, Selector de Roles, Logout
    ACTUALIZADO: Sidebar fijo (sticky) y rutas del administrador completas
  -->
  <aside class="w-64 bg-white shadow-lg flex flex-col sticky top-0 h-screen">
    <!-- Header del sidebar con logo -->
    <div class="p-6 border-b border-gray-200 flex-shrink-0">
      <router-link to="/" class="flex items-center space-x-3 hover:opacity-80 transition">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-xl">F</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800">FHCE</h2>
          <p class="text-xs text-gray-500">{{ getRoleName() }}</p>
        </div>
      </router-link>
    </div>

    <!-- Navegación principal con scroll -->
    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      <template v-for="item in navigationItems" :key="item.name">
        <router-link
          :to="item.path"
          :class="[
            'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
            isActive(item.path)
              ? 'bg-purple-100 text-purple-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <!-- Icono -->
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          
          <!-- Texto -->
          <span class="flex-1">{{ item.label }}</span>

          <!-- Badge (opcional) -->
          <span
            v-if="item.badge"
            class="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
          >
            {{ item.badge }}
          </span>
        </router-link>
      </template>
    </nav>

    <!-- Perfil del usuario y opciones - Fijo en la parte inferior -->
    <div class="border-t border-gray-200 p-4 space-y-3 flex-shrink-0">
      <!-- Selector de Rol (si tiene múltiples roles) -->
      <div v-if="canChangeRole" class="relative" ref="roleMenuRef">
        <button
          @click="toggleRoleMenu"
          class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
        >
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span class="text-gray-700 font-medium">Cambiar rol</span>
          </div>
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Menú desplegable de roles -->
        <div 
          v-if="showRoleMenu" 
          class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
        >
          <p class="px-3 py-2 text-xs text-gray-500 font-semibold uppercase">
            Roles disponibles
          </p>
          <button
            v-for="role in authStore.availableRoles"
            :key="role"
            @click="handleChangeRole(role)"
            :class="[
              'w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-center justify-between',
              authStore.currentRole === role ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
            ]"
          >
            <span>{{ getRoleNameForOption(role) }}</span>
            <svg 
              v-if="authStore.currentRole === role" 
              class="w-4 h-4 text-purple-600" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Info del usuario -->
      <div class="px-3 py-2 bg-gray-50 rounded-lg">
        <p class="text-sm font-semibold text-gray-800 truncate">
          {{ authStore.fullName }}
        </p>
        <p class="text-xs text-gray-500 truncate">
          {{ authStore.user?.email }}
        </p>
      </div>

      <!-- Botón cerrar sesión -->
      <button
        @click="handleLogout"
        class="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Rol } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

/** Control del menú de roles */
const showRoleMenu = ref(false)

/** Referencia al menú de roles */
const roleMenuRef = ref<HTMLElement | null>(null)

const canChangeRole = computed(() => {
  return authStore.availableRoles.length > 1
})

const IconDashboard = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  `
}

const IconUsers = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  `
}

const IconBook = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  `
}

const IconCalendar = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  `
}

const IconClipboard = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  `
}

const IconAward = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  `
}

const IconInbox = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  `
}

const IconChart = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  `
}

const IconUser = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  `
}

const IconPhoto = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  `
}

const IconCheckCircle = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}

interface NavItem {
  name: string
  label: string
  path: string
  icon: any
  badge?: number | string
}

const navigationItems = computed((): NavItem[] => {
  const role = authStore.currentRole

  switch (role) {
    case 'ADMINISTRADOR':
      return [
        { name: 'dashboard', label: 'Dashboard', path: '/admin', icon: IconDashboard },
        { name: 'users', label: 'Usuarios', path: '/admin/usuarios', icon: IconUsers },
        { name: 'activities', label: 'Actividades', path: '/admin/actividades', icon: IconCalendar },
        { name: 'inscriptions', label: 'Inscripciones', path: '/admin/inscripciones', icon: IconClipboard },
        { name: 'grades', label: 'Calificaciones', path: '/admin/calificaciones', icon: IconCheckCircle },
        { name: 'attendance', label: 'Asistencias', path: '/admin/asistencias', icon: IconCheckCircle },
        { name: 'certificates', label: 'Certificados', path: '/admin/certificados', icon: IconAward },
      ]

    case 'COORDINADOR':
      return [
        { name: 'dashboard', label: 'Dashboard', path: '/coordinador', icon: IconDashboard },
        { name: 'activities', label: 'Actividades', path: '/coordinador/actividades', icon: IconCalendar },
        { name: 'inbox', label: 'Bandeja', path: '/coordinador/bandeja', icon: IconInbox, badge: 5 },
        { name: 'emit', label: 'Emitir Certificados', path: '/coordinador/emitir', icon: IconAward },
        { name: 'reports', label: 'Reportes', path: '/coordinador/reportes', icon: IconChart }
      ]

    case 'DOCENTE':
      return [
        { name: 'dashboard', label: 'Dashboard', path: '/docente', icon: IconDashboard },
        { name: 'courses', label: 'Mis Cursos', path: '/docente/mis-cursos', icon: IconBook },
        { name: 'grades', label: 'Calificaciones', path: '/docente/calificaciones', icon: IconClipboard },
        { name: 'attendance', label: 'Asistencias', path: '/docente/asistencias', icon: IconCheckCircle }
      ]

    case 'AUXILIAR':
      return [
        { name: 'dashboard', label: 'Dashboard', path: '/auxiliar', icon: IconDashboard },
        { name: 'events', label: 'Mis Eventos', path: '/auxiliar/eventos', icon: IconCalendar },
        { name: 'attendance', label: 'Registrar Asistencia', path: '/auxiliar/asistencia', icon: IconCheckCircle }
      ]

    case 'DISENADOR':
      return [
        { name: 'dashboard', label: 'Dashboard', path: '/disenador', icon: IconDashboard },
        { name: 'activities', label: 'Actividades', path: '/disenador/actividades', icon: IconCalendar },
        { name: 'templates', label: 'Plantillas', path: '/disenador/plantillas', icon: IconPhoto }
      ]

    default:
      return []
  }
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Verifica si la ruta está activa
 */
const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/')
}

/**
 * Obtiene el nombre del rol actual
 */
const getRoleName = (): string => {
  const role = authStore.currentRole
  
  const roleNames: Record<Rol, string> = {
    ADMINISTRADOR: 'Administrador',
    COORDINADOR: 'Coordinador',
    DOCENTE: 'Docente',
    PARTICIPANTE: 'Participante',
    AUXILIAR: 'Auxiliar',
    DISENADOR: 'Diseñador'
  }
  
  return role ? roleNames[role] : 'Usuario'
}

/**
 * Obtiene el nombre de un rol para el selector
 */
const getRoleNameForOption = (role: Rol): string => {
  const roleNames: Record<Rol, string> = {
    ADMINISTRADOR: 'Administrador',
    COORDINADOR: 'Coordinador',
    DOCENTE: 'Docente',
    PARTICIPANTE: 'Participante',
    AUXILIAR: 'Auxiliar',
    DISENADOR: 'Diseñador'
  }
  
  return roleNames[role]
}

/**
 * Abre/cierra el menú de roles
 */
const toggleRoleMenu = () => {
  showRoleMenu.value = !showRoleMenu.value
}

const handleChangeRole = (role: Rol) => {
  const success = authStore.changeRole(role)
  
  if (success) {
    showRoleMenu.value = false
    
    // Redirigir al dashboard correspondiente
    const routes: Record<Rol, string> = {
      'ADMINISTRADOR': '/admin',
      'COORDINADOR': '/coordinador',
      'DOCENTE': '/docente',
      'PARTICIPANTE': '/participante',
      'AUXILIAR': '/auxiliar',
      'DISENADOR': '/disenador'
    }
    
    router.push(routes[role] || '/')
  }
}

const handleLogout = () => {
  authStore.logout()
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

<style scoped>
/* Scroll personalizado para la navegación */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>