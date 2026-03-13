<template>
  <!--
    Vista Home - Catálogo Público de Cursos y Eventos
    Muestra todas las actividades disponibles con filtros
  -->
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">
            Cursos Complementarios y Eventos Facultativos
          </h1>
          <p class="text-lg md:text-xl text-purple-100">
            Amplía tus conocimientos con nuestra oferta académica de cursos, talleres y eventos especializados.
          </p>
        </div>
      </div>
    </section>

    <!-- Contenido principal -->
    <section class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Sidebar con filtros (Desktop) -->
        <aside class="hidden lg:block lg:col-span-1">
          <div class="sticky top-24">
            <ActivityFilters 
              v-model="filters" 
              :careers="careers"
            />
          </div>
        </aside>

        <!-- Contenido principal -->
        <main class="lg:col-span-3">
          
          <!-- Botón de filtros (Mobile) -->
          <div class="lg:hidden mb-4">
            <Button 
              variant="outline" 
              @click="showMobileFilters = true"
              class="w-full"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              <Badge v-if="hasActiveFilters" variant="primary" size="sm" class="ml-2">
                {{ activeFiltersCount }}
              </Badge>
            </Button>
          </div>

          <!-- Estadísticas -->
          <div class="mb-6 flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                Mostrando <span class="font-semibold text-gray-800">{{ filteredActivities.length }}</span> 
                {{ filteredActivities.length === 1 ? 'actividad' : 'actividades' }}
              </p>
            </div>
            
            <!-- Ordenamiento -->
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-600">Ordenar por:</label>
              <select
                v-model="sortBy"
                class="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="fecha_inicio">Fecha de inicio</option>
                <option value="nombre">Nombre</option>
                <option value="precio">Precio</option>
                <option value="cupos">Cupos disponibles</option>
              </select>
            </div>
          </div>

          <!-- Grid de actividades -->
          <div v-if="sortedActivities.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityCard
              v-for="activity in sortedActivities"
              :key="activity.id_actividad"
              :activity="activity"
              @view-detail="handleViewDetail"
              @inscribirse="handleInscribirse"
            />
          </div>

          <!-- Estado vacío -->
          <div v-else class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">
              No se encontraron actividades
            </h3>
            <p class="text-gray-600 mb-4">
              Intenta ajustar los filtros para ver más resultados
            </p>
            <Button variant="outline" @click="clearFilters">
              Limpiar filtros
            </Button>
          </div>
        </main>
      </div>
    </section>

    <!-- Modal de filtros (Mobile) -->
    <Modal 
      v-model="showMobileFilters" 
      title="Filtros"
      size="md"
    >
      <ActivityFilters 
        v-model="filters" 
        :careers="careers"
      />
      
      <template #footer>
        <div class="flex space-x-2">
          <Button variant="outline" @click="showMobileFilters = false" class="flex-1">
            Cerrar
          </Button>
          <Button variant="primary" @click="applyMobileFilters" class="flex-1">
            Aplicar filtros
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Modal de detalle de actividad (placeholder) -->
    <Modal 
      v-model="showDetailModal" 
      title="Detalle de Actividad"
      size="lg"
    >
      <div v-if="selectedActivity" class="space-y-4">
        <h2 class="text-2xl font-bold text-gray-800">
          {{ selectedActivity.nombre }}
        </h2>
        <p class="text-gray-600">
          {{ selectedActivity.descripcion }}
        </p>
        <!-- TODO: Agregar más detalles -->
      </div>
      
      <template #footer>
        <div class="flex space-x-2">
          <Button variant="outline" @click="showDetailModal = false" class="flex-1">
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            @click="handleInscribirse(selectedActivity?.id_actividad)"
            class="flex-1"
            :disabled="selectedActivity?.estado === 'LLENO'"
          >
            Inscribirse
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import ActivityCard from '@/components/activities/ActivityCard.vue'
import ActivityFilters from '@/components/activities/ActivityFilters.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import { mockActivities, mockCareers, filterActivities } from '@/utils/mockData'
import type { Actividad, FiltrosActividad } from '@/types'

// ============================================
// COMPOSABLES
// ============================================

const router = useRouter()
const authStore = useAuthStore()

// ============================================
// ESTADO
// ============================================

/** Actividades disponibles */
const activities = ref<Actividad[]>(mockActivities)

/** Carreras disponibles */
const careers = ref(mockCareers)

/** Filtros activos */
const filters = ref<FiltrosActividad>({
  tipo: undefined,
  modalidad: undefined,
  carrera_id: undefined,
  busqueda: '',
  solo_gratuitos: false,
  solo_disponibles: false
})

/** Ordenamiento seleccionado */
const sortBy = ref<'fecha_inicio' | 'nombre' | 'precio' | 'cupos'>('fecha_inicio')

/** Control del modal mobile de filtros */
const showMobileFilters = ref(false)

/** Control del modal de detalle */
const showDetailModal = ref(false)

/** Actividad seleccionada */
const selectedActivity = ref<Actividad | null>(null)

// ============================================
// COMPUTED
// ============================================

/**
 * Actividades filtradas según los filtros activos
 */
const filteredActivities = computed(() => {
  return filterActivities(activities.value, filters.value)
})

/**
 * Actividades filtradas y ordenadas
 */
const sortedActivities = computed(() => {
  const filtered = [...filteredActivities.value]
  
  switch (sortBy.value) {
    case 'nombre':
      return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre))
    
    case 'precio':
      return filtered.sort((a, b) => {
        const precioA = a.es_gratuito ? 0 : a.costo_externo
        const precioB = b.es_gratuito ? 0 : b.costo_externo
        return precioA - precioB
      })
    
    case 'cupos':
      return filtered.sort((a, b) => b.cupos_disponibles - a.cupos_disponibles)
    
    case 'fecha_inicio':
    default:
      return filtered.sort((a, b) => {
        return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
      })
  }
})

/**
 * Verifica si hay filtros activos
 */
const hasActiveFilters = computed(() => {
  return (
    filters.value.tipo !== undefined ||
    filters.value.modalidad !== undefined ||
    filters.value.carrera_id !== undefined ||
    (filters.value.busqueda && filters.value.busqueda.length > 0) ||
    filters.value.solo_gratuitos === true ||
    filters.value.solo_disponibles === true
  )
})

/**
 * Cuenta los filtros activos
 */
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.tipo) count++
  if (filters.value.modalidad) count++
  if (filters.value.carrera_id) count++
  if (filters.value.busqueda && filters.value.busqueda.length > 0) count++
  if (filters.value.solo_gratuitos) count++
  if (filters.value.solo_disponibles) count++
  return count
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Maneja el click en "Ver detalle"
 */
const handleViewDetail = (activityId: number) => {
  selectedActivity.value = activities.value.find(a => a.id_actividad === activityId) || null
  showDetailModal.value = true
}

/**
 * Maneja el click en "Inscribirse"
 */
const handleInscribirse = (activityId?: number) => {
  if (!activityId) return
  
  // Verificar si el usuario está autenticado
  if (!authStore.isAuthenticated) {
    // Redirigir al login
    router.push({ 
      name: 'login', 
      query: { redirect: `/actividad/${activityId}` } 
    })
    return
  }
  
  // Si está autenticado, verificar que esté en rol PARTICIPANTE
  if (authStore.currentRole !== 'PARTICIPANTE') {
    // Cambiar a rol participante automáticamente
    const success = authStore.changeRole('PARTICIPANTE')
    if (success) {
      router.push(`/participante/inscripciones/nueva/${activityId}`)
    }
  } else {
    // Ya está como participante, ir a inscripción
    router.push(`/participante/inscripciones/nueva/${activityId}`)
  }
}

/**
 * Limpia todos los filtros
 */
const clearFilters = () => {
  filters.value = {
    tipo: undefined,
    modalidad: undefined,
    carrera_id: undefined,
    busqueda: '',
    solo_gratuitos: false,
    solo_disponibles: false
  }
}

/**
 * Aplica filtros y cierra modal mobile
 */
const applyMobileFilters = () => {
  showMobileFilters.value = false
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  console.log('✅ Home cargado con', activities.value.length, 'actividades')
  
  // Aplicar filtro predeterminado de la ruta (si existe)
  const defaultFilter = router.currentRoute.value.meta.defaultFilter as FiltrosActividad | undefined
  if (defaultFilter) {
    filters.value = { ...filters.value, ...defaultFilter }
  }
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>