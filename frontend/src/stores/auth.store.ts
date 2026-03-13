/**
 * Store de Autenticación (versión simplificada)
 * Compatible con tu implementación actual
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rol, TipoUsuario } from '@/types'

/**
 * Interface del usuario (versión simplificada)
 */
export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  email: string
  roles: Rol[]
  tipo_usuario: TipoUsuario
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
   * Login simulado (MOCK) - para desarrollo
   * TODO: Reemplazar con llamada real al backend
   */
  const loginMock = (rol: Rol) => {
    // Crear usuario mock según el rol
    // Algunos usuarios tienen múltiples roles para probar el cambio de rol
    
    let mockUser: Usuario
    
    if (rol === 'ADMINISTRADOR') {
      // Admin también puede ser Coordinador y Participante
      mockUser = {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Administrador',
        email: 'admin@fhce.umsa.bo',
        roles: ['ADMINISTRADOR', 'COORDINADOR', 'PARTICIPANTE'],
        tipo_usuario: 'INTERNO'
      }
    } else if (rol === 'COORDINADOR') {
      // Coordinador también puede ser Docente y Participante
      mockUser = {
        id: 2,
        nombres: 'María',
        apellidos: 'Coordinadora',
        email: 'coordinador@fhce.umsa.bo',
        roles: ['COORDINADOR', 'DOCENTE', 'PARTICIPANTE'],
        tipo_usuario: 'INTERNO'
      }
    } else if (rol === 'DOCENTE') {
      // Docente también puede ser Participante
      mockUser = {
        id: 3,
        nombres: 'Juan',
        apellidos: 'Docente',
        email: 'docente@fhce.umsa.bo',
        roles: ['DOCENTE', 'PARTICIPANTE'],
        tipo_usuario: 'INTERNO'
      }
    } else if (rol === 'DISENADOR') {
      // DISENADOR también puede ser Participante (caso especial)
      mockUser = {
        id: 4,
        nombres: 'Ana',
        apellidos: 'DISENADORa',
        email: 'disenador@fhce.umsa.bo',
        roles: ['DISENADOR', 'PARTICIPANTE'],
        tipo_usuario: 'INTERNO'
      }
    } else {
      // Participante solo tiene ese rol
      mockUser = {
        id: 5,
        nombres: 'Pedro',
        apellidos: 'Estudiante',
        email: 'estudiante@gmail.com',
        roles: ['PARTICIPANTE'],
        tipo_usuario: 'EXTERNO'
      }
    }

    token.value = `mock-jwt-token-${rol}`
    user.value = mockUser
    currentRole.value = rol

    // Guardar en localStorage
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('token', token.value)
    localStorage.setItem('currentRole', rol)

    console.log('✅ Login mock exitoso:', rol)
    console.log('📋 Roles disponibles:', mockUser.roles)
  }

  /**
   * Login real (para cuando conectes con el backend)
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // TODO: Llamada al backend
      // const response = await api.post('/auth/login', { username, password })
      
      console.log('🚧 Login real aún no implementado')
      console.log('Credenciales:', { username, password })
      
      // Por ahora, simular login de admin
      if (username === 'admin' && password === 'admin123') {
        loginMock('ADMINISTRADOR')
        return true
      }
      
      return false
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
    loginMock,
    login,
    logout,
    changeRole,
    updateUser,  // ← AGREGADO
    initializeAuth
  }
})
