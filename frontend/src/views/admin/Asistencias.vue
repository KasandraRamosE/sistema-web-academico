<template>
  <!--
    Vista de Gestión de Asistencias - Administrador
    Permite ver y editar asistencias de eventos, con control de certificados
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Asistencias</h1>
      <p class="text-gray-600">Ver y modificar asistencias de eventos facultativos</p>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.totalEventos }}</p>
          <p class="text-sm text-gray-600">Eventos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.totalAsistencias }}</p>
          <p class="text-sm text-gray-600">Asistencias</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.conCertificado }}</p>
          <p class="text-sm text-gray-600">Con Certificado</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-orange-600">{{ estadisticas.sinCertificado }}</p>
          <p class="text-sm text-gray-600">Sin Certificado</p>
        </div>
      </Card>
    </div>

    <!-- Selección de Evento -->
    <Card>
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Seleccionar Evento</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <select
              v-model="filtros.carrera"
              @change="cargarEventos"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las carreras</option>
              <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Evento -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Evento</label>
            <select
              v-model="eventoSeleccionado"
              @change="cargarAsistencias"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null">Seleccionar evento</option>
              <option v-for="evento in eventosDisponibles" :key="evento.id" :value="evento.id">
                {{ evento.nombre }} ({{ evento.fechaInicio }})
              </option>
            </select>
          </div>
        </div>

        <!-- Información del evento seleccionado -->
        <div v-if="eventoSeleccionado && infoEvento" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-blue-600">Evento</p>
              <p class="font-medium text-gray-800">{{ infoEvento.nombre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Fecha</p>
              <p class="font-medium text-gray-800">{{ formatDate(infoEvento.fechaInicio) }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Inscritos</p>
              <p class="font-medium text-gray-800">{{ infoEvento.inscritos }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Asistencias Registradas</p>
              <p class="font-medium text-gray-800">{{ asistenciasRegistradas }} / {{ infoEvento.inscritos }}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Tabla de Asistencias -->
    <Card v-if="eventoSeleccionado">
      <div class="space-y-4">
        <!-- Encabezado de la tabla -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">
            Asistencias - {{ infoEvento?.nombre }}
          </h3>
          <div class="flex space-x-2">
            <Button @click="exportarAsistencias" variant="outline" size="sm">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar
            </Button>
          </div>
        </div>

        <!-- Estado de carga -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-600">Cargando asistencias...</p>
        </div>

        <!-- Tabla -->
        <div v-else-if="asistencias.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Participante</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Asistencia</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Certificado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registrado Por</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(asistencia, index) in asistencias" :key="asistencia.idAsistencia" class="hover:bg-gray-50">
                <!-- Número -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ index + 1 }}
                </td>

                <!-- Participante -->
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">
                      {{ asistencia.participante.nombres }} {{ asistencia.participante.apellidos }}
                    </p>
                    <p class="text-xs text-gray-500">RU: {{ asistencia.participante.username }}</p>
                  </div>
                </td>

                <!-- Email -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ asistencia.participante.email }}
                </td>

                <!-- Asistencia -->
                <td class="px-4 py-3 text-center">
                  <Badge :variant="asistencia.asistio ? 'success' : 'danger'" size="sm">
                    {{ asistencia.asistio ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ' }}
                  </Badge>
                </td>

                <!-- Certificado -->
                <td class="px-4 py-3 text-center">
                  <div v-if="asistencia.certificado">
                    <Badge :variant="getCertificadoBadge(asistencia.certificado.estado)" size="sm">
                      {{ asistencia.certificado.estado }}
                    </Badge>
                    <p class="text-xs text-gray-500 mt-1">
                      #{{ asistencia.certificado.id }}
                    </p>
                  </div>
                  <span v-else class="text-xs text-gray-400">Sin certificado</span>
                </td>

                <!-- Registrado Por -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div v-if="asistencia.registradoPor">
                    <p class="text-sm">{{ asistencia.registradoPor.nombre }}</p>
                    <p class="text-xs text-gray-500">
                      {{ formatDatetime(asistencia.fechaRegistro) }}
                    </p>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <Button variant="ghost" size="sm" @click="editarAsistencia(asistencia)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" @click="verDetalle(asistencia)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sin asistencias -->
        <div v-else class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p class="text-gray-600">No hay asistencias registradas para este evento</p>
        </div>
      </div>
    </Card>

    <!-- Mensaje inicial -->
    <Card v-else class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-600 mb-2">Selecciona un evento para ver las asistencias</p>
      <p class="text-sm text-gray-500">Usa los filtros de arriba para seleccionar una carrera y evento</p>
    </Card>

    <!-- Modal Editar Asistencia -->
    <Modal
      :modelValue="showEditModal"
      @close="closeEditModal"
      title="Editar Asistencia"
    >
      <form v-if="asistenciaSeleccionada" @submit.prevent="guardarAsistencia" class="space-y-4">
        <!-- Info del participante -->
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">Participante</p>
          <p class="font-semibold text-gray-800">
            {{ asistenciaSeleccionada.participante.nombres }} {{ asistenciaSeleccionada.participante.apellidos }}
          </p>
          <p class="text-xs text-gray-500">{{ asistenciaSeleccionada.participante.email }}</p>
        </div>

        <!-- Estado actual de asistencia -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800 mb-2">Estado Actual</p>
          <Badge :variant="asistenciaSeleccionada.asistio ? 'success' : 'danger'">
            {{ asistenciaSeleccionada.asistio ? 'SÍ ASISTIÓ' : 'NO ASISTIÓ' }}
          </Badge>
        </div>

        <!-- Nuevo estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nuevo Estado de Asistencia <span class="text-red-600">*</span>
          </label>
          <div class="space-y-2">
            <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formAsistencia.asistio === true ? 'border-green-500 bg-green-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formAsistencia.asistio"
                :value="true"
                class="w-4 h-4 text-green-600"
              />
              <span class="ml-3 font-medium text-gray-800">SÍ ASISTIÓ</span>
            </label>
            <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formAsistencia.asistio === false ? 'border-red-500 bg-red-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formAsistencia.asistio"
                :value="false"
                class="w-4 h-4 text-red-600"
              />
              <span class="ml-3 font-medium text-gray-800">NO ASISTIÓ</span>
            </label>
          </div>
        </div>

        <!-- Advertencia si tiene certificado -->
        <div v-if="asistenciaSeleccionada.certificado && formAsistencia.asistio !== asistenciaSeleccionada.asistio" 
             class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-semibold text-red-800">Advertencia: Certificado Emitido</p>
              <p class="text-sm text-red-700 mt-1">
                Este participante tiene el certificado <strong>#{{ asistenciaSeleccionada.certificado.id }}</strong> 
                en estado <strong>{{ asistenciaSeleccionada.certificado.estado }}</strong>.
              </p>
              <p v-if="!formAsistencia.asistio" class="text-sm text-red-700 mt-2">
                ⚠️ <strong>Al cambiar a "NO ASISTIÓ", el certificado será ANULADO automáticamente.</strong>
              </p>
            </div>
          </div>
        </div>

        <!-- Motivo (obligatorio si tiene certificado) -->
        <div v-if="asistenciaSeleccionada.certificado && formAsistencia.asistio !== asistenciaSeleccionada.asistio">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Motivo del Cambio <span class="text-red-600">*</span>
          </label>
          <textarea
            v-model="formAsistencia.motivo"
            rows="3"
            required
            placeholder="Explica el motivo de la corrección (obligatorio cuando hay certificado emitido)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Observaciones (opcional) -->
        <div v-else>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (Opcional)
          </label>
          <textarea
            v-model="formAsistencia.observaciones"
            rows="2"
            placeholder="Notas adicionales sobre el cambio..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeEditModal">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'

// ============================================
// TIPOS
// ============================================

interface Participante {
  nombres: string
  apellidos: string
  email: string
  username: string
}

interface Certificado {
  id: number
  estado: 'GENERADO' | 'ANULADO' | 'REEMITIDO'
}

interface RegistradoPor {
  nombre: string
  rol: string
}

interface Asistencia {
  idAsistencia: number
  participante: Participante
  asistio: boolean
  certificado: Certificado | null
  registradoPor: RegistradoPor | null
  fechaRegistro: string
  observaciones: string | null
}

interface Evento {
  id: number
  nombre: string
  fechaInicio: string
  inscritos: number
}

interface Carrera {
  id: number
  nombre: string
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const saving = ref(false)

const carreras = ref<Carrera[]>([])
const eventosDisponibles = ref<Evento[]>([])
const asistencias = ref<Asistencia[]>([])

const estadisticas = ref({
  totalEventos: 0,
  totalAsistencias: 0,
  conCertificado: 0,
  sinCertificado: 0
})

const filtros = ref({
  carrera: ''
})

const eventoSeleccionado = ref<number | null>(null)
const infoEvento = ref<Evento | null>(null)

const showEditModal = ref(false)
const asistenciaSeleccionada = ref<Asistencia | null>(null)

const formAsistencia = ref({
  asistio: null as boolean | null,
  motivo: '',
  observaciones: ''
})

// ============================================
// COMPUTED
// ============================================

const asistenciasRegistradas = computed(() => {
  return asistencias.value.filter(a => a.asistio !== null).length
})

// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================

const cargarCarreras = async () => {
  try {
    // TODO: Implementar llamada a API
    carreras.value = [
      { id: 1, nombre: 'Psicología' },
      { id: 2, nombre: 'Filosofía' },
      { id: 3, nombre: 'Ciencias de la Educación' }
    ]
  } catch (error) {
    console.error('Error al cargar carreras:', error)
  }
}

const cargarEventos = async () => {
  try {
    // TODO: Implementar llamada a API filtrada por carrera
    eventosDisponibles.value = [
      {
        id: 1,
        nombre: 'Congreso Internacional de Psicología',
        fechaInicio: '2024-05-10',
        inscritos: 85
      },
      {
        id: 2,
        nombre: 'Taller de Escritura Creativa',
        fechaInicio: '2024-03-15',
        inscritos: 25
      }
    ]

    eventoSeleccionado.value = null
    asistencias.value = []
    infoEvento.value = null
  } catch (error) {
    console.error('Error al cargar eventos:', error)
  }
}

const cargarAsistencias = async () => {
  if (!eventoSeleccionado.value) return

  loading.value = true
  try {
    infoEvento.value = eventosDisponibles.value.find(e => e.id === eventoSeleccionado.value) || null

    // TODO: Implementar llamada a API
    await new Promise(resolve => setTimeout(resolve, 500))

    asistencias.value = [
      {
        idAsistencia: 1,
        participante: {
          nombres: 'Juan',
          apellidos: 'Pérez López',
          email: 'juan.perez@umsa.bo',
          username: '202012345'
        },
        asistio: true,
        certificado: {
          id: 123,
          estado: 'GENERADO'
        },
        registradoPor: {
          nombre: 'María García',
          rol: 'Auxiliar'
        },
        fechaRegistro: '2024-05-10T14:30:00',
        observaciones: null
      },
      {
        idAsistencia: 2,
        participante: {
          nombres: 'Ana',
          apellidos: 'Silva Rojas',
          email: 'ana.silva@gmail.com',
          username: 'asilva'
        },
        asistio: false,
        certificado: null,
        registradoPor: {
          nombre: 'María García',
          rol: 'Auxiliar'
        },
        fechaRegistro: '2024-05-10T14:32:00',
        observaciones: null
      }
    ]

    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar asistencias:', error)
  } finally {
    loading.value = false
  }
}

const calcularEstadisticas = () => {
  estadisticas.value = {
    totalEventos: eventosDisponibles.value.length,
    totalAsistencias: asistencias.value.filter(a => a.asistio).length,
    conCertificado: asistencias.value.filter(a => a.certificado !== null).length,
    sinCertificado: asistencias.value.filter(a => a.asistio && a.certificado === null).length
  }
}

// ============================================
// MÉTODOS - CRUD
// ============================================

const editarAsistencia = (asistencia: Asistencia) => {
  asistenciaSeleccionada.value = asistencia
  formAsistencia.value = {
    asistio: asistencia.asistio,
    motivo: '',
    observaciones: asistencia.observaciones || ''
  }
  showEditModal.value = true
}

const guardarAsistencia = async () => {
  if (!asistenciaSeleccionada.value) return

  saving.value = true
  try {
    // TODO: Implementar llamada a API
    console.log('Guardando asistencia:', formAsistencia.value)
    
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Actualizar en la lista
    asistenciaSeleccionada.value.asistio = formAsistencia.value.asistio!
    asistenciaSeleccionada.value.observaciones = formAsistencia.value.observaciones || formAsistencia.value.motivo

    // Si cambió a NO ASISTIÓ y tenía certificado, anularlo
    if (!formAsistencia.value.asistio && asistenciaSeleccionada.value.certificado) {
      asistenciaSeleccionada.value.certificado.estado = 'ANULADO'
    }

    calcularEstadisticas()
    closeEditModal()
  } catch (error) {
    console.error('Error al guardar asistencia:', error)
  } finally {
    saving.value = false
  }
}

const exportarAsistencias = () => {
  // TODO: Implementar exportación
  console.log('Exportando asistencias...')
  alert('Funcionalidad de exportación en desarrollo')
}

// ============================================
// MÉTODOS - MODALES
// ============================================

const verDetalle = (asistencia: Asistencia) => {
  // TODO: Abrir modal de detalle
  console.log('Ver detalle:', asistencia)
}

const closeEditModal = () => {
  showEditModal.value = false
  asistenciaSeleccionada.value = null
  formAsistencia.value = {
    asistio: null,
    motivo: '',
    observaciones: ''
  }
}

// ============================================
// MÉTODOS - UTILIDADES
// ============================================

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDatetime = (datetime: string) => {
  return new Date(datetime).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCertificadoBadge = (estado: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'GENERADO': 'success',
    'ANULADO': 'danger',
    'REEMITIDO': 'info'
  }
  return variants[estado] || 'gray'
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarCarreras()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>