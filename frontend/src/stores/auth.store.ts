/**
 * Store de Autenticación (versión simplificada)
 * Compatible con tu implementación actual
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rol } from '@/types'
import { api } from '@/utils/api'

/**
 * Interface del usuario (versión simplificada)
 */
export interface Usuario {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: Rol[]
}

interface LoginResponse {
  token: string
  tipo: string
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

/**
 * Store de autenticación con Composition API
 */
export const useAuthStore = defineStore('auth', () => {
  // ============================================
  // ESTADO
  // ============================================
  
  const user = ref<Usuario | null>(null)
  const token = ref<string | null>(null)
  const currentRole = ref<Rol | null>(null)

  // ============================================
  // GETTERS
  // ============================================
  
  /**
   * Verifica si el usuario está autenticado
   */
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (rol: Rol): boolean => {
    return user.value?.roles.includes(rol) || false
  }

  /**
   * Nombre completo del usuario
   */
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.nombres} ${user.value.apellidos}`
  })

  /**
   * Roles disponibles para el usuario
   * NOTA: El DISENADOR SÍ puede tener otros roles (ej: PARTICIPANTE + DISENADOR)
   */
  const availableRoles = computed((): Rol[] => {
    if (!user.value) return []
    return user.value.roles
  })

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Login real (para cuando conectes con el backend)
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { username, password }) as LoginResponse
      const roles = normalizeRoles(response.roles)

      token.value = response.token
      user.value = {
        idUsuario: response.idUsuario,
        username: response.username,
        nombres: response.nombres,
        apellidos: response.apellidos,
        roles
      }

      currentRole.value = roles[0] || null

      localStorage.setItem('user', JSON.stringify(user.value))
      localStorage.setItem('token', token.value)
      if (currentRole.value) {
        localStorage.setItem('currentRole', currentRole.value)
      }

      return true
    } catch (error) {
      console.error('❌ Error en login:', error)
      return false
    }
  }

  /**
   * Cerrar sesión
   */
  const logout = () => {
    user.value = null
    token.value = null
    currentRole.value = null

    // Limpiar localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('currentRole')

    console.log('✅ Sesión cerrada')
  }

  /**
   * Cambiar el rol activo
   */
  const changeRole = (newRole: Rol): boolean => {
    if (!user.value) {
      console.error('❌ No hay usuario autenticado')
      return false
    }

    if (!user.value.roles.includes(newRole)) {
      console.error(`❌ El usuario no tiene el rol: ${newRole}`)
      return false
    }

    // No permitir cambiar si es DISENADOR
    if (currentRole.value === 'DISENADOR' || newRole === 'DISENADOR') {
      console.warn('⚠️ El rol DISENADOR es fijo')
      return false
    }

    currentRole.value = newRole
    localStorage.setItem('currentRole', newRole)
    
    console.log(`✅ Rol cambiado a: ${newRole}`)
    return true
  }

  /**
   * Actualizar datos del usuario
   */
  const updateUser = (updatedUser: Usuario) => {
    if (!user.value) {
      console.error('❌ No hay usuario autenticado')
      return
    }

    user.value = updatedUser

    // Actualizar en localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser))

    console.log('✅ Datos del usuario actualizados')
  }

  /**
   * Restaurar sesión desde localStorage
   */
  const initializeAuth = () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('token')
      const savedRole = localStorage.getItem('currentRole')

      if (savedUser && savedToken) {
        user.value = JSON.parse(savedUser)
        token.value = savedToken
        
        // Validar que el rol sea válido
        const validRoles: Rol[] = ['ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'PARTICIPANTE', 'AUXILIAR', 'DISENADOR']
        if (savedRole && validRoles.includes(savedRole as Rol)) {
          currentRole.value = savedRole as Rol
        } else {
          // Verificar que user.value no sea null antes de acceder a roles
          currentRole.value = user.value?.roles[0] || null
        }

        console.log('✅ Sesión restaurada desde localStorage')
      }
    } catch (error) {
      console.error('❌ Error al restaurar sesión:', error)
      logout()
    }
  }

  const normalizeRoles = (roles: string[]): Rol[] => {
    return roles.map(role => role.replace('ROLE_', '') as Rol)
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    // Estado
    user,
    token,
    currentRole,

    // Getters
    isAuthenticated,
    hasRole,
    fullName,
    availableRoles,

    // Actions
    login,
    logout,
    changeRole,
    updateUser,  // ← AGREGADO
    initializeAuth
  }
})
