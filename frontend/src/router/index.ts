/**
 * Configuración del Router de Vue
 * Define todas las rutas de la aplicación organizadas por módulo
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

// ============================================
// IMPORTAR LAYOUTS
// ============================================
import PublicLayout from '@/layouts/PublicLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ParticipantLayout from '@/layouts/ParticipantLayout.vue'

// ============================================
// IMPORTAR VISTAS
// ============================================

// Vistas públicas
import Home from '@/views/public/Home.vue'

// Vistas de autenticación
import Login from '@/views/auth/Login.vue'

// Vistas de admin
import DashboardAdmin from '@/views/admin/DashboardAdmin.vue'

// Vistas de participante
import ParticipantDashboard from '@/views/participant/Dashboard.vue'

// ============================================
// DEFINICIÓN DE RUTAS
// ============================================

const routes: RouteRecordRaw[] = [
  // ==========================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ==========================================
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: Home,
        meta: {
          title: 'Inicio - FHCE Cursos y Eventos',
          requiresAuth: false
        }
      },
      {
        path: 'cursos',
        name: 'courses',
        component: Home,
        meta: {
          title: 'Cursos Complementarios',
          requiresAuth: false,
          defaultFilter: { tipo: 'CURSO' as const }
        }
      },
      {
        path: 'eventos',
        name: 'events',
        component: Home,
        meta: {
          title: 'Eventos Facultativos',
          requiresAuth: false,
          defaultFilter: { tipo: 'EVENTO' as const }
        }
      },
      {
        path: 'actividad/:id',
        name: 'activity-detail',
        component: () => import('@/views/public/Home.vue'), // TODO: Crear ActivityDetailView
        meta: {
          title: 'Detalle de Actividad',
          requiresAuth: false
        }
      },
      {
        path: 'verificar-certificado/:codigo',
        name: 'verify-certificate',
        component: () => import('@/views/public/Home.vue'), // TODO: Crear VerifyCertificateView
        meta: {
          title: 'Verificar Certificado',
          requiresAuth: false
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE AUTENTICACIÓN
  // ==========================================
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: Login,
        meta: {
          title: 'Iniciar Sesión',
          requiresAuth: false,
          requiresGuest: true
        }
      },
      {
        path: 'registro',
        name: 'register',
        component: () => import('@/views/auth/Login.vue'), // TODO: Crear RegisterView
        meta: {
          title: 'Registrarse',
          requiresAuth: false,
          requiresGuest: true
        }
      },
      {
        path: 'verificar-email',
        name: 'verify-email',
        component: () => import('@/views/auth/Login.vue'), // TODO: Crear VerifyEmailView
        meta: {
          title: 'Verificar Email',
          requiresAuth: false
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE PARTICIPANTE (sin sidebar)
  // ==========================================
  {
    path: '/participante',
    component: ParticipantLayout,
    meta: {
      requiresAuth: true,
      roles: ['PARTICIPANTE']
    },
    children: [
      {
        path: '',
        name: 'participant-home',
        component: Home, // ← Catálogo de actividades
        meta: {
          title: 'Catálogo de Actividades',
          breadcrumb: false
        }
      },
      {
        path: 'cursos',
        name: 'participant-courses',
        component: Home,
        meta: {
          title: 'Cursos Disponibles',
          breadcrumb: 'Cursos',
          defaultFilter: { tipo: 'CURSO' as const }
        }
      },
      {
        path: 'eventos',
        name: 'participant-events',
        component: Home,
        meta: {
          title: 'Eventos Disponibles',
          breadcrumb: 'Eventos',
          defaultFilter: { tipo: 'EVENTO' as const }
        }
      },
      {
        path: 'inscripciones',
        name: 'participant-enrollments',
        component: () => import('@/views/participant/MisInscripciones.vue'),
        meta: {
          title: 'Mis Inscripciones',
          breadcrumb: 'Mis Inscripciones'
        }
      },
      {
        path: 'certificados',
        name: 'participant-certificates',
        component: () => import('@/views/participant/MisCertificados.vue'),
        meta: {
          title: 'Mis Certificados',
          breadcrumb: 'Mis Certificados'
        }
      },
      {
        path: 'perfil',
        name: 'participant-profile',
        component: () => import('@/views/participant/Perfil.vue'),
        meta: {
          title: 'Mi Perfil',
          breadcrumb: 'Mi Perfil'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE ADMINISTRADOR (con sidebar)
  // ==========================================
  {
    path: '/admin',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['ADMINISTRADOR'] // Usa "roles" en array
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: DashboardAdmin,
        meta: {
          title: 'Panel de Administrador',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'usuarios',
        name: 'admin-users',
        component: () => import('@/views/admin/Usuarios.vue'),
        meta: {
          title: 'Gestión de Usuarios',
          breadcrumb: 'Usuarios'
        }
      },
      {
        path: 'carreras',
        name: 'admin-careers',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear CareersView
        meta: {
          title: 'Gestión de Carreras',
          breadcrumb: 'Carreras'
        }
      },
      {
        path: 'actividades',
        name: 'admin-activities',
        component: () => import('@/views/admin/Actividades.vue'),
        meta: {
          title: 'Gestión de Actividades',
          breadcrumb: 'Actividades'
        }
      },
      {
        path: 'inscripciones',
        name: 'admin-enrollments',
        component: () => import('@/views/admin/Inscripciones.vue'),
        meta: {
          title: 'Gestión de Inscripciones',
          breadcrumb: 'Inscripciones'
        }
      },
      {
        path: 'calificaciones',
        name: 'admin-grades',
        component: () => import('@/views/admin/Calificaciones.vue'),
        meta: {
          title: 'Gestión de Calificaciones',
          breadcrumb: 'Calificaciones'
        }
      },
      {
        path: '/admin/asistencias',
        name: 'AdminAsistencias',
        component: () => import('@/views/admin/Asistencias.vue')
      },
      {
        path: 'certificados',
        name: 'admin-certificates',
        component: () => import('@/views/admin/Certificados.vue'),
        meta: {
          title: 'Gestión de Certificados',
          breadcrumb: 'Certificados'
        }
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear RolesView
        meta: {
          title: 'Gestión de Roles',
          breadcrumb: 'Roles'
        }
      },
      {
        path: 'reportes',
        name: 'admin-reports',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear ReportsView
        meta: {
          title: 'Reportes',
          breadcrumb: 'Reportes'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE COORDINADOR (con sidebar)
  // ==========================================
  {
    path: '/coordinador',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['COORDINADOR']
    },
    children: [
      {
        path: '',
        name: 'coordinator-dashboard',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear CoordinatorDashboard
        meta: {
          title: 'Panel de Coordinador',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'actividades',
        name: 'coordinator-activities',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear ActivitiesView
        meta: {
          title: 'Gestión de Actividades',
          breadcrumb: 'Actividades'
        }
      },
      {
        path: 'bandeja',
        name: 'coordinator-inbox',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear InboxView
        meta: {
          title: 'Solicitudes de Certificados',
          breadcrumb: 'Bandeja'
        }
      },
      {
        path: 'emitir',
        name: 'coordinator-emit',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear EmitCertificatesView
        meta: {
          title: 'Emitir Certificados',
          breadcrumb: 'Emitir'
        }
      },
      {
        path: 'reportes',
        name: 'coordinator-reports',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear ReportsView
        meta: {
          title: 'Reportes',
          breadcrumb: 'Reportes'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE DOCENTE (con sidebar)
  // ==========================================
  {
    path: '/docente',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['DOCENTE']
    },
    children: [
      {
        path: '',
        name: 'teacher-dashboard',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear TeacherDashboard
        meta: {
          title: 'Panel de Docente',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'mis-cursos',
        name: 'teacher-courses',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear MyCoursesView
        meta: {
          title: 'Mis Cursos',
          breadcrumb: 'Mis Cursos'
        }
      },
      {
        path: 'calificaciones',
        name: 'teacher-grades',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear GradesView
        meta: {
          title: 'Calificaciones',
          breadcrumb: 'Calificaciones'
        }
      },
      {
        path: 'asistencias',
        name: 'teacher-attendance',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear AttendanceView
        meta: {
          title: 'Asistencias',
          breadcrumb: 'Asistencias'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE AUXILIAR (con sidebar)
  // ==========================================
  {
    path: '/auxiliar',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['AUXILIAR']
    },
    children: [
      {
        path: '',
        name: 'auxiliary-dashboard',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear AuxiliaryDashboard
        meta: {
          title: 'Panel de Auxiliar',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'eventos',
        name: 'auxiliary-events',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear MyEventsView
        meta: {
          title: 'Mis Eventos',
          breadcrumb: 'Mis Eventos'
        }
      },
      {
        path: 'asistencia',
        name: 'auxiliary-attendance',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear RegisterAttendanceView
        meta: {
          title: 'Registrar Asistencia',
          breadcrumb: 'Asistencia'
        }
      }
    ]
  },

  // ==========================================
  // RUTAS DE DISEÑADOR (con sidebar)
  // ==========================================
  {
    path: '/disenador',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ['DISEÑADOR']
    },
    children: [
      {
        path: '',
        name: 'designer-dashboard',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear DesignerDashboard
        meta: {
          title: 'Panel de Diseñador',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'actividades',
        name: 'designer-activities',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear ActivitiesListView
        meta: {
          title: 'Lista de Actividades',
          breadcrumb: 'Actividades'
        }
      },
      {
        path: 'plantillas',
        name: 'designer-templates',
        component: () => import('@/views/admin/DashboardAdmin.vue'), // TODO: Crear UploadTemplateView
        meta: {
          title: 'Gestión de Plantillas',
          breadcrumb: 'Plantillas'
        }
      }
    ]
  },

  // ==========================================
  // RUTA 404 (No encontrada)
  // ==========================================
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/public/Home.vue'), // TODO: Crear NotFoundView
    meta: {
      title: 'Página no encontrada'
    }
  }
]

// ============================================
// CREAR INSTANCIA DEL ROUTER
// ============================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  
  // Scroll al inicio de la página al cambiar de ruta
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// ============================================
// CONFIGURAR GUARDS (protección de rutas)
// ============================================
setupRouterGuards(router)

// ============================================
// ACTUALIZAR TÍTULO DE LA PÁGINA
// ============================================
router.afterEach((to) => {
  const title = to.meta.title as string || 'FHCE - Cursos y Eventos'
  document.title = title
})

export default router