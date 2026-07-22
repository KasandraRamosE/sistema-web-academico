import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Rol } from '@/types'

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Espera a que termine de restaurar la sesión (initializeAuth pide un
    // access token nuevo usando la cookie del refresh token). Memoizada:
    // en la primera navegación espera la restauración real; en las
    // siguientes, el await es instantáneo porque ya se resolvió antes.
    // Sin esto, la primera navegación podía evaluar "no autenticado"
    // mientras la sesión todavía se estaba restaurando.
    await authStore.initializeAuth()

    // to.matched incluye las rutas padre — así una ruta anidada hereda
    // requiresAuth/roles definidos en su layout, no solo en la hoja.
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    if (requiresAuth && !authStore.isAuthenticated) {
      console.warn('⚠️ Acceso denegado: Se requiere autenticación')
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)
    if (requiresGuest && authStore.isAuthenticated) {
      return next(getDashboardRoute(authStore, authStore.currentRole || authStore.user?.roles?.[0] || null))
    }

    // Toma el primer meta.roles definido en la cadena to.matched (de la
    // ruta más específica a la más general)
    const allowedRoles = to.matched
      .map((record) => record.meta.roles as Rol[] | undefined)
      .find((roles) => roles && roles.length > 0)

    if (allowedRoles && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.some((rol) => authStore.hasRole(rol))

      if (!hasPermission) {
        console.warn(`⚠️ Acceso denegado: Se requiere uno de estos roles: ${allowedRoles.join(', ')}`)
        return next(getDashboardRoute(authStore, authStore.currentRole || authStore.user?.roles?.[0] || null))
      }
    }

    console.log(`✅ Navegando a: ${to.path}`)
    next()
  })
}

function getDashboardRoute(authStore: ReturnType<typeof useAuthStore>, role: Rol | null): { name: string } {
  switch (role) {
    case 'ADMINISTRADOR':
      return { name: 'admin-dashboard' }
    case 'COORDINADOR':
      return { name: 'coordinator-dashboard' }
    case 'DOCENTE':
      return { name: 'teacher-dashboard' }
    case 'AUXILIAR':
      return authStore.hasRole('PARTICIPANTE')
        ? { name: 'participant-home' }
        : { name: 'auxiliary-events' }
   case 'DISENADOR':
     return { name: 'designer-templates' }
    case 'PARTICIPANTE':
      return { name: 'participant-home' }
    default:
      return { name: 'home' }
  }
}