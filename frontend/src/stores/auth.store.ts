import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rol } from '@/types'
import { api } from '@/utils/api'

export interface Usuario {
  idUsuario: number
  username: string
  ci?: string
  nombres: string
  apellidos: string
  roles: Rol[]
  tipoParticipante?: 'UMSA' | 'EXTERNO' | null
}

interface LoginResponse {
  token: string
  tipo: string
  // El refresh token ya no viaja en el body — el backend lo setea como
  // cookie HttpOnly directamente en la respuesta de /auth/login.
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  tipoParticipante?: 'UMSA' | 'EXTERNO' | null
  roles: string[]
}

interface RefreshResponse {
  token: string
  tipo: string
}

interface MensajeResponse {
  mensaje: string
}

// Fuera del store: se comparte entre todos los llamadores (main.ts, guard
// del router) sin importar cuántas veces se pida el store con useAuthStore().
let initializeAuthPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  // ============================================
  // ESTADO
  // ============================================
  
  const user = ref<Usuario | null>(null)
  // Access token: solo en memoria (este ref), nunca en localStorage — así
  // un XSS no puede leerlo de un storage persistente. Se pierde en cada
  // recarga de página a propósito; initializeAuth() lo repone pidiéndolo
  // de nuevo con la cookie HttpOnly del refresh token.
  const token = ref<string | null>(null)
  const currentRole = ref<Rol | null>(null)
  const loginError = ref('')

  // ============================================
  // GETTERS
  // ============================================
  
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  const hasRole = (rol: Rol): boolean => {
    return user.value?.roles.includes(rol) || false
  }

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.nombres} ${user.value.apellidos}`
  })

  // El DISENADOR sí puede tener otros roles a la vez (ej: PARTICIPANTE + DISENADOR)
  const availableRoles = computed((): Rol[] => {
    if (!user.value) return []
    return user.value.roles
  })

  // ============================================
  // ACTIONS
  // ============================================

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      loginError.value = ''
      const response = await api.post('/auth/login', { username, password }) as LoginResponse
      const roles = normalizeRoles(response.roles)

      token.value = response.token
      user.value = {
        idUsuario: response.idUsuario,
        username: response.username,
        nombres: response.nombres,
        apellidos: response.apellidos,
        roles,
        tipoParticipante: response.tipoParticipante ?? null
      }

      try {
        const perfil = await api.get('/usuarios/me') as Record<string, unknown>
        const emailVerificado = perfil.emailVerificado ?? perfil.email_verificado
        const verificado = emailVerificado === true || emailVerificado === 1 || emailVerificado === 'true'
        if (!verificado) {
          loginError.value = 'Debes verificar tu correo antes de iniciar sesion.'
          logout()
          return false
        }

        const rawRoles = Array.isArray(perfil.roles)
          ? perfil.roles
          : (Array.isArray(perfil.rolesAsignados) ? perfil.rolesAsignados : [])
        if (rawRoles.length > 0) {
          const roleNames = rawRoles.map((role) => {
            if (role && typeof role === 'object' && 'nombre' in role) {
              return String((role as { nombre?: unknown }).nombre ?? '')
            }
            return String(role)
          })
          const normalizedPerfilRoles = normalizeRoles(roleNames)
          user.value = {
            ...user.value,
            roles: normalizedPerfilRoles
          }
          localStorage.setItem('user', JSON.stringify(user.value))
        }
      } catch (error) {
        loginError.value = 'No se pudo validar el estado del correo. Intenta de nuevo.'
        console.warn('No se pudo validar el email verificado:', error)
        logout()
        return false
      }

      const storedRole = localStorage.getItem('currentRole')
      const normalizedStoredRole = storedRole ? normalizeRoles([storedRole])[0] : null
      const effectiveRoles = user.value?.roles ?? roles
      if (effectiveRoles.includes('PARTICIPANTE')) {
        currentRole.value = 'PARTICIPANTE'
      } else if (normalizedStoredRole && effectiveRoles.includes(normalizedStoredRole)) {
        currentRole.value = normalizedStoredRole
      } else {
        currentRole.value = effectiveRoles[0] || null
      }

      localStorage.setItem('user', JSON.stringify(user.value))
      if (currentRole.value) {
        localStorage.setItem('currentRole', currentRole.value)
      }

      return true
    } catch (error) {
      loginError.value = (error as Error).message || 'Error al iniciar sesion'
      console.error('❌ Error en login:', error)
      return false
    }
  }

  const register = async (payload: {
    username: string
    ci: string
    nombres: string
    apellidos: string
    email: string
    password: string
    tipoParticipante: 'UMSA' | 'EXTERNO'
  }): Promise<string> => {
    const response = await api.post('/auth/registro', payload) as MensajeResponse
    return response.mensaje
  }

  const verifyEmail = async (payload: {
    username: string
    codigo: string
  }): Promise<string> => {
    const response = await api.post('/auth/verificar-email', payload) as MensajeResponse
    return response.mensaje
  }

  const resendCode = async (username: string): Promise<string> => {
    const response = await api.post(`/auth/reenviar-codigo?username=${encodeURIComponent(username)}`) as MensajeResponse
    return response.mensaje
  }

  // ============================================
  // RESET PASSWORD - 3 pasos
  // ============================================

  const solicitarResetPassword = async (username: string): Promise<string> => {
    const response = await api.post('/auth/solicitar-reset-password', {
      username
    }) as MensajeResponse
    return response.mensaje
  }

  const verificarCodigoReset = async (username: string, codigo: string): Promise<string> => {
    const response = await api.post('/auth/verificar-codigo-reset', {
      username,
      codigo
    }) as MensajeResponse
    return response.mensaje
  }

  const cambiarPassword = async (username: string, codigo: string, newPassword: string): Promise<string> => {
    const response = await api.post('/auth/cambiar-password', {
      username,
      codigo,
      newPassword
    }) as MensajeResponse
    return response.mensaje
  }

  const logout = () => {
    // El refresh token va en la cookie HttpOnly — el backend la lee solo,
    // no hace falta (ni se puede) mandarla en el body.
    api.post('/auth/logout').catch(() => {
      console.warn('No se pudo revocar el refresh token en el backend')
    })

    clearLocalSession()
  }

  /**
   * Limpia el estado en memoria y localStorage SIN llamar al backend.
   * Usado por logout() (que sí llama al backend) y por api.ts cuando
   * detecta una sesión inválida (401 tras intentar refrescar).
   */
  const clearLocalSession = () => {
    user.value = null
    token.value = null
    currentRole.value = null

    localStorage.removeItem('user')
    localStorage.removeItem('currentRole')
    // Compatibilidad: limpia claves de versiones anteriores que guardaban
    // el token/refreshToken en localStorage.
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  const changeRole = (newRole: Rol): boolean => {
    if (!user.value) {
      console.error('❌ No hay usuario autenticado')
      return false
    }

    if (!user.value.roles.includes(newRole)) {
      console.error(`❌ El usuario no tiene el rol: ${newRole}`)
      return false
    }

    currentRole.value = newRole
    localStorage.setItem('currentRole', newRole)

    return true
  }

  const updateUser = (updatedUser: Usuario) => {
    if (!user.value) {
      console.error('❌ No hay usuario autenticado')
      return
    }

    user.value = updatedUser
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  /**
   * Restaurar sesión al arrancar la app.
   * Ya no hay token en localStorage: se le pide uno nuevo al backend usando
   * la cookie HttpOnly del refresh token (si existe y sigue siendo válida).
   *
   * Memoizada: tanto main.ts (antes de montar la app) como el guard global
   * del router (antes de la primera navegación) llaman a esto — sin
   * memoizar, dispararían dos refresh en paralelo y además el guard podría
   * evaluar "no autenticado" mientras la restauración todavía está en
   * vuelo, mandando al usuario al login con una sesión en realidad válida.
   */
  const initializeAuth = (): Promise<void> => {
    if (!initializeAuthPromise) {
      initializeAuthPromise = doInitializeAuth()
    }
    return initializeAuthPromise
  }

  const doInitializeAuth = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedRole = localStorage.getItem('currentRole')

      if (!savedUser) {
        return
      }

      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        // No hay cookie válida (expiró, se cerró sesión en otro lado, etc.)
        clearLocalSession()
        return
      }

      const parsedUser = JSON.parse(savedUser) as Usuario
      const normalizedRoles = normalizeRoles(parsedUser.roles as unknown as string[])
      user.value = {
        ...parsedUser,
        roles: normalizedRoles
      }

      const validRoles: Rol[] = ['ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'PARTICIPANTE', 'AUXILIAR', 'DISENADOR']
      const normalizedSavedRole = savedRole ? normalizeRoles([savedRole])[0] : null
      if (normalizedSavedRole && validRoles.includes(normalizedSavedRole)) {
        currentRole.value = normalizedSavedRole
      } else {
        currentRole.value = user.value?.roles[0] || null
      }
    } catch (error) {
      console.error('❌ Error al restaurar sesión:', error)
      clearLocalSession()
    }
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      // Sin body: el refresh token viaja en la cookie HttpOnly, el
      // navegador la manda solo gracias a credentials:'include' en api.ts.
      const response = await api.post('/auth/refresh') as RefreshResponse
      token.value = response.token
      return true
    } catch (error) {
      console.warn('No se pudo refrescar el token:', error)
      return false
    }
  }

  const normalizeRoles = (roles: string[]): Rol[] => {
    return roles.map((role) => {
      const cleaned = role.replace('ROLE_', '').replace('DISEÑADOR', 'DISENADOR')
      return cleaned as Rol
    })
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    user,
    token,
    currentRole,
    loginError,

    isAuthenticated,
    hasRole,
    fullName,
    availableRoles,

    login,
    register,
    verifyEmail,
    resendCode,
    solicitarResetPassword,
    verificarCodigoReset,
    cambiarPassword,
    logout,
    clearLocalSession,
    refreshAccessToken,
    changeRole,
    updateUser,
    initializeAuth
  }
})
