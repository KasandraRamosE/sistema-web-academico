/**
 * Navigation Guards (Protección de Rutas)
 * Controla el acceso a las rutas según autenticación y roles
 */

import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Rol } from '@/types'

/**
 * Configura los guards globales del router
 * @param router - Instancia del router
 */
export function setupRouterGuards(router: Router) {
  /**
   * Guard global que se ejecuta ANTES de cada navegación
   */
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    // Verificar autenticación
    const requiresAuth = to.meta.requiresAuth as boolean
    
    if (requiresAuth && !authStore.isAuthenticated) {
      console.warn('⚠️ Acceso denegado: Se requiere autenticación')
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
    
    // Verificar roles
    const allowedRoles = to.meta.roles as Rol[] | undefined
    
    if (allowedRoles && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.some(rol => authStore.hasRole(rol))
      
      if (!hasPermission) {
        console.warn(`⚠️ Acceso denegado: Se requiere uno de estos roles: ${allowedRoles.join(', ')}`)
        
        // Redirigir al dashboard correspondiente o home
        return next(getDashboardRoute(authStore.currentRole))
      }
    }
    
    console.log(`✅ Navegando a: ${to.path}`)
    next()
  })
}

/**
 * Guard simple para usar directamente en rutas
 */
export function authGuard(to: any, _from: any, next: any) {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as Rol[]
    const hasPermission = allowedRoles.some((rol) => auth.hasRole(rol))

    if (!hasPermission) {
      return next({ name: 'home' })
    }
  }

  next()
}

/**
 * Obtiene la ruta del dashboard según el rol
 */
function getDashboardRoute(role: Rol | null): { name: string } {
  switch (role) {
    case 'ADMINISTRADOR':
      return { name: 'admin-dashboard' }
    case 'COORDINADOR':
      return { name: 'coordinator-dashboard' }
    case 'DOCENTE':
      return { name: 'teacher-dashboard' }
    case 'PARTICIPANTE':
      return { name: 'participant-dashboard' }
    default:
      return { name: 'home' }
  }
}