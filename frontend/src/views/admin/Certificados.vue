<template>
  <!--
    Vista de Gestión de Certificados - Administrador
    Permite ver solicitudes pendientes, emitir, anular y reemitir certificados
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Certificados</h1>
      <p class="text-gray-600">Solicitudes, emisión y control de certificados</p>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-orange-600">{{ estadisticas.solicitudesPendientes }}</p>
          <p class="text-sm text-gray-600">Solicitudes Pendientes</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.certificadosEmitidos }}</p>
          <p class="text-sm text-gray-600">Emitidos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ estadisticas.certificadosAnulados }}</p>
          <p class="text-sm text-gray-600">Anulados</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.certificadosReemitidos }}</p>
          <p class="text-sm text-gray-600">Reemitidos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.totalCertificados }}</p>
          <p class="text-sm text-gray-600">Total</p>
        </div>
      </Card>
    </div>

    <!-- Tabs de Navegación -->
    <Card>
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="tabActiva = 'solicitudes'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              tabActiva === 'solicitudes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Solicitudes Pendientes
            <Badge v-if="estadisticas.solicitudesPendientes > 0" variant="warning" size="sm" class="ml-2">
              {{ estadisticas.solicitudesPendientes }}
            </Badge>
          </button>
          <button
            @click="tabActiva = 'certificados'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              tabActiva === 'certificados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Todos los Certificados
          </button>
        </nav>
      </div>
    </Card>

    <!-- Tab: Solicitudes Pendientes -->
    <div v-if="tabActiva === 'solicitudes'">
      <Card>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">Solicitudes de Emisión Pendientes</h3>
          </div>

          <!-- Estado de carga -->
          <div v-if="loading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">Cargando solicitudes...</p>
          </div>

          <!-- Tabla de solicitudes -->
          <div v-else-if="solicitudesPendientes.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Docente</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aprobados</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha Solicitud</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="solicitud in solicitudesPendientes" :key="solicitud.idSolicitud" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono text-gray-600">
                    #{{ solicitud.idSolicitud }}
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <p class="text-sm font-medium text-gray-800">{{ solicitud.actividad.nombre }}</p>
                      <p class="text-xs text-gray-500">{{ solicitud.actividad.carrera }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <Badge :variant="solicitud.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                      {{ solicitud.actividad.tipo }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ solicitud.docente }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-lg font-bold text-green-600">{{ solicitud.cantidadAprobados }}</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-600">
                    {{ formatDatetime(solicitud.fechaSolicitud) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center space-x-2">
                      <Button variant="primary" size="sm" @click="verSolicitud(solicitud)">
                        Procesar
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Sin solicitudes -->
          <div v-else class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p class="text-gray-600">¡Genial! No hay solicitudes pendientes</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Tab: Todos los Certificados -->
    <div v-if="tabActiva === 'certificados'">
      <Card>
        <div class="space-y-4">
          <!-- Filtros -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                v-model="filtrosCertificados.busqueda"
                type="text"
                placeholder="Nombre de usuario o actividad..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                v-model="filtrosCertificados.estado"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="GENERADO">Generados</option>
                <option value="ANULADO">Anulados</option>
                <option value="REEMITIDO">Reemitidos</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                v-model="filtrosCertificados.tipo"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="APROBACION">Aprobación</option>
                <option value="PARTICIPACION">Participación</option>
              </select>
            </div>
            <div class="flex items-end">
              <Button variant="outline" class="w-full" @click="limpiarFiltrosCertificados">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar
              </Button>
            </div>
          </div>

          <!-- Tabla de certificados -->
          <div v-if="certificadosPaginados.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Versión</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emisión</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="certificado in certificadosPaginados" :key="certificado.idCertificado" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono text-gray-600">
                    #{{ certificado.idCertificado }}
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <p class="text-sm font-medium text-gray-800">
                        {{ certificado.usuario.nombres }} {{ certificado.usuario.apellidos }}
                      </p>
                      <p class="text-xs text-gray-500">{{ certificado.usuario.email }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <p class="text-sm font-medium text-gray-800">{{ certificado.actividad.nombre }}</p>
                      <p class="text-xs text-gray-500">{{ certificado.actividad.cargaHoraria }} horas</p>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <Badge :variant="certificado.tipo === 'APROBACION' ? 'success' : 'info'" size="sm">
                      {{ certificado.tipo }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-center text-sm">
                    <span v-if="certificado.version > 1" class="text-blue-600 font-medium">
                      v{{ certificado.version }}
                    </span>
                    <span v-else class="text-gray-500">v1</span>
                  </td>
                  <td class="px-4 py-3">
                    <Badge :variant="getEstadoCertificadoBadge(certificado.estadoEmision)">
                      {{ certificado.estadoEmision }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-600">
                    {{ formatDate(certificado.fechaEmision) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" @click="verCertificado(certificado)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      <Button
                        v-if="certificado.estadoEmision === 'GENERADO'"
                        variant="ghost"
                        size="sm"
                        class="text-red-600 hover:text-red-800"
                        @click="anularCertificado(certificado)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </Button>
                      <Button
                        v-if="certificado.estadoEmision === 'ANULADO'"
                        variant="ghost"
                        size="sm"
                        class="text-blue-600 hover:text-blue-800"
                        @click="reemitirCertificado(certificado)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <Pagination
            v-if="totalItems > 0"
            :current-page="currentPage"
            :total-items="totalItems"
            :page-size="pageSize"
            :show-page-size-selector="true"
            @update:current-page="goToPage"
            @update:page-size="setPageSize"
          />
          <!-- Sin certificados -->
          <div v-else class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p class="text-gray-600">No se encontraron certificados</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Modal Procesar Solicitud -->
    <Modal
      :modelValue="showSolicitudModal"
      @close="closeSolicitudModal"
      title="Procesar Solicitud de Certificados"
      size="xl"
    >
      <div v-if="solicitudSeleccionada" class="space-y-6">
        <!-- Info de la solicitud -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-blue-600">Actividad</p>
              <p class="font-medium text-gray-800">{{ solicitudSeleccionada.actividad.nombre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Tipo</p>
              <Badge :variant="solicitudSeleccionada.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'">
                {{ solicitudSeleccionada.actividad.tipo }}
              </Badge>
            </div>
            <div>
              <p class="text-xs text-blue-600">Docente Solicitante</p>
              <p class="font-medium text-gray-800">{{ solicitudSeleccionada.docente }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600">Aprobados/Asistentes</p>
              <p class="text-2xl font-bold text-green-600">{{ solicitudSeleccionada.cantidadAprobados }}</p>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" @click="closeSolicitudModal">
            Cancelar
          </Button>
          <div class="flex space-x-3">
            <Button
              variant="outline"
              @click="actualizarEstadoSolicitud('EN_PROCESO')"
              :disabled="procesando"
            >
              {{ procesando ? 'Actualizando...' : 'Marcar en proceso' }}
            </Button>
            <Button
              @click="actualizarEstadoSolicitud('COMPLETADO')"
              :disabled="procesando"
            >
              {{ procesando ? 'Actualizando...' : 'Marcar completado' }}
            </Button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Modal Anular Certificado -->
    <Modal
      :modelValue="showAnularModal"
      @close="closeAnularModal"
      title="Anular Certificado"
    >
      <div v-if="certificadoSeleccionado" class="space-y-4">
        <!-- Info del certificado -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800 mb-2">
            <strong>Atención:</strong> Esta acción anulará el certificado.
          </p>
          <div class="space-y-2 text-sm">
            <p><strong>Usuario:</strong> {{ certificadoSeleccionado.usuario.nombres }} {{ certificadoSeleccionado.usuario.apellidos }}</p>
            <p><strong>Actividad:</strong> {{ certificadoSeleccionado.actividad.nombre }}</p>
          </div>
        </div>

        <!-- Motivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Motivo de Anulación <span class="text-red-600">*</span>
          </label>
          <textarea
            v-model="motivoAnulacion"
            rows="3"
            required
            placeholder="Describe el motivo de la anulación..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" @click="closeAnularModal">
            Cancelar
          </Button>
          <Button
            variant="danger"
            @click="confirmarAnulacion"
            :disabled="!motivoAnulacion.trim() || procesando"
          >
            {{ procesando ? 'Anulando...' : 'Anular Certificado' }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { api } from '@/utils/api'
// ============================================
// TIPOS
// ============================================

interface Usuario {
  nombres: string
  apellidos: string
  email: string
}

interface Actividad {
  nombre: string
  tipo: 'CURSO' | 'EVENTO'
  carrera: string
  cargaHoraria: number
}

interface SolicitudEmision {
  idSolicitud: number
  actividad: Actividad
  docente: string
  cantidadAprobados: number
  estado?: string
  fechaSolicitud: string
}

interface Certificado {
  idCertificado: number
  usuario: Usuario
  actividad: Actividad
  tipo: 'APROBACION' | 'PARTICIPACION'
  version: number
  estadoEmision: 'GENERADO' | 'ANULADO' | 'REEMITIDO'
  fechaEmision: string
}

// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const procesando = ref(false)

const tabActiva = ref<'solicitudes' | 'certificados'>('solicitudes')

const solicitudesPendientes = ref<SolicitudEmision[]>([])
const certificados = ref<Certificado[]>([])

const estadisticas = ref({
  solicitudesPendientes: 0,
  certificadosEmitidos: 0,
  certificadosAnulados: 0,
  certificadosReemitidos: 0,
  totalCertificados: 0
})

const filtrosCertificados = ref({
  busqueda: '',
  estado: '',
  tipo: ''
})

// Modales
const showSolicitudModal = ref(false)
const showAnularModal = ref(false)
const solicitudSeleccionada = ref<SolicitudEmision | null>(null)
const certificadoSeleccionado = ref<Certificado | null>(null)

// Anulación
const motivoAnulacion = ref('')

// ============================================
// COMPUTED
// ============================================

const certificadosFiltrados = computed(() => {
  let resultado = [...certificados.value]

  if (filtrosCertificados.value.busqueda) {
    const busqueda = filtrosCertificados.value.busqueda.toLowerCase()
    resultado = resultado.filter(c =>
      c.usuario.nombres.toLowerCase().includes(busqueda) ||
      c.usuario.apellidos.toLowerCase().includes(busqueda) ||
      c.actividad.nombre.toLowerCase().includes(busqueda)
    )
  }

  if (filtrosCertificados.value.estado) {
    resultado = resultado.filter(c => c.estadoEmision === filtrosCertificados.value.estado)
  }

  if (filtrosCertificados.value.tipo) {
    resultado = resultado.filter(c => c.tipo === filtrosCertificados.value.tipo)
  }

  return resultado
})
const {
  paginatedData: certificadosPaginados,  // Solo 10 usuarios a la vez
  currentPage,
  pageSize,
  totalItems,
  goToPage,
  setPageSize
} = usePagination(certificadosFiltrados, {
  pageSize: 10,
  initialPage: 1
})
// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================

const cargarDatos = async () => {
  loading.value = true
  try {
    await Promise.all([
      cargarSolicitudes(),
      cargarCertificados()
    ])
    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const cargarSolicitudes = async () => {
  const response = await api.get('/evaluaciones/solicitudes')
  const items = response as Array<Record<string, unknown>>

  solicitudesPendientes.value = items.map(item => ({
    idSolicitud: Number(item.idSolicitud),
    actividad: {
      nombre: String(item.nombreActividad ?? ''),
      tipo: 'CURSO',
      carrera: '-',
      cargaHoraria: 0
    },
    docente: String(item.nombreDocente ?? ''),
    cantidadAprobados: Number(item.cantidadAprobados ?? 0),
    estado: String(item.estado ?? 'PENDIENTE'),
    fechaSolicitud: String(item.fechaSolicitud ?? '')
  }))
}

const cargarCertificados = async () => {
  const response = await api.get('/certificados/admin')
  const items = response as Array<Record<string, unknown>>

  certificados.value = items.map(item => {
    const nombreParticipante = String(item.nombreParticipante ?? '')
    const nombreParts = nombreParticipante.split(' ')
    const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante
    const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : ''

    const tipoActividad = String(item.tipoActividad ?? 'EVENTO') as 'CURSO' | 'EVENTO'

    return {
      idCertificado: Number(item.idCertificado),
      usuario: {
        nombres,
        apellidos,
        email: '-'
      },
      actividad: {
        nombre: String(item.nombreActividad ?? ''),
        tipo: tipoActividad,
        carrera: '-',
        cargaHoraria: Number(item.cargaHoraria ?? 0)
      },
      tipo: tipoActividad === 'CURSO' ? 'APROBACION' : 'PARTICIPACION',
      version: Number(item.version ?? 1),
      estadoEmision: String(item.estadoEmision ?? 'GENERADO') as Certificado['estadoEmision'],
      fechaEmision: String(item.fechaEmision ?? '')
    }
  })
}

const calcularEstadisticas = () => {
  estadisticas.value = {
    solicitudesPendientes: solicitudesPendientes.value.length,
    certificadosEmitidos: certificados.value.filter(c => c.estadoEmision === 'GENERADO').length,
    certificadosAnulados: certificados.value.filter(c => c.estadoEmision === 'ANULADO').length,
    certificadosReemitidos: certificados.value.filter(c => c.estadoEmision === 'REEMITIDO').length,
    totalCertificados: certificados.value.length
  }
}

// ============================================
// MÉTODOS - SOLICITUDES
// ============================================

const verSolicitud = async (solicitud: SolicitudEmision) => {
  solicitudSeleccionada.value = solicitud
  showSolicitudModal.value = true
}

const actualizarEstadoSolicitud = async (estado: 'EN_PROCESO' | 'COMPLETADO') => {
  if (!solicitudSeleccionada.value) return

  procesando.value = true
  try {
    await api.patch(`/evaluaciones/solicitudes/${solicitudSeleccionada.value.idSolicitud}?estado=${estado}`)
    await cargarDatos()
    closeSolicitudModal()
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
  } finally {
    procesando.value = false
  }
}

// ============================================
// MÉTODOS - CERTIFICADOS
// ============================================

const verCertificado = (certificado: Certificado) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const token = localStorage.getItem('token')

  fetch(`${baseUrl}/certificados/${certificado.idCertificado}/descargar`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
    .then(async response => {
      if (!response.ok) {
        const message = response.statusText || 'No se pudo descargar el certificado.'
        throw new Error(message)
      }
      return response.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    })
    .catch(error => {
      console.error('Error al ver certificado:', error)
    })
}

const anularCertificado = (certificado: Certificado) => {
  certificadoSeleccionado.value = certificado
  motivoAnulacion.value = ''
  showAnularModal.value = true
}

const confirmarAnulacion = async () => {
  if (!certificadoSeleccionado.value || !motivoAnulacion.value.trim()) return

  procesando.value = true
  try {
    await api.patch(`/certificados/${certificadoSeleccionado.value.idCertificado}/anular`, {
      motivo: motivoAnulacion.value,
      reemitir: false
    })
    closeAnularModal()
    await cargarDatos()
  } catch (error) {
    console.error('Error al anular certificado:', error)
  } finally {
    procesando.value = false
  }
}

const reemitirCertificado = async (certificado: Certificado) => {
  if (confirm('¿Reemitir este certificado con una nueva versión?')) {
    try {
      await api.patch(`/certificados/${certificado.idCertificado}/anular`, {
        motivo: 'Reemision solicitada por administrador',
        reemitir: true
      })
      await cargarDatos()
    } catch (error) {
      console.error('Error al reemitir certificado:', error)
    }
  }
}

// ============================================
// MÉTODOS - MODALES
// ============================================

const closeSolicitudModal = () => {
  showSolicitudModal.value = false
  solicitudSeleccionada.value = null
}

const closeAnularModal = () => {
  showAnularModal.value = false
  certificadoSeleccionado.value = null
  motivoAnulacion.value = ''
}

// ============================================
// MÉTODOS - UTILIDADES
// ============================================

const limpiarFiltrosCertificados = () => {
  filtrosCertificados.value = {
    busqueda: '',
    estado: '',
    tipo: ''
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDatetime = (datetime: string) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstadoCertificadoBadge = (estado: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
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
  cargarDatos()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>