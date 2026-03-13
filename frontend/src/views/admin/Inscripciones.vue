<template>
  <!--
    Vista de Gestión de Inscripciones - Administrador
    Permite buscar, visualizar y modificar todas las inscripciones del sistema
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Inscripciones</h1>
        <p class="text-gray-600">Ver y modificar todas las inscripciones del sistema</p>
      </div>
      <Button @click="exportarInscripciones" variant="outline">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar Excel
      </Button>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-800">{{ estadisticas.total }}</p>
          <p class="text-sm text-gray-600">Total</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.confirmadas }}</p>
          <p class="text-sm text-gray-600">Confirmadas</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-600">{{ estadisticas.pendientes }}</p>
          <p class="text-sm text-gray-600">Pendientes</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ estadisticas.canceladas }}</p>
          <p class="text-sm text-gray-600">Canceladas</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">Bs. {{ estadisticas.totalIngresos.toFixed(2) }}</p>
          <p class="text-sm text-gray-600">Ingresos</p>
        </div>
      </Card>
    </div>

    <!-- Filtros -->
    <Card>
      <div class="space-y-4">
        <!-- Primera fila de filtros -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Búsqueda por usuario -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar Usuario</label>
            <input
              v-model="filtros.busquedaUsuario"
              type="text"
              placeholder="Nombre, apellido, email o RU del usuario..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Búsqueda por actividad -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar Actividad</label>
            <input
              v-model="filtros.busquedaActividad"
              type="text"
              placeholder="Nombre de la actividad..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Segunda fila de filtros -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Estado -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              v-model="filtros.estado"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>

          <!-- Tipo de actividad -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              v-model="filtros.tipoActividad"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="CURSO">Cursos</option>
              <option value="EVENTO">Eventos</option>
            </select>
          </div>

          <!-- Tipo de precio -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <select
              v-model="filtros.tipoPrecio"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="UMSA">UMSA</option>
              <option value="EXTERNO">Externos</option>
              <option value="GRATUITO">Gratuitos</option>
            </select>
          </div>

          <!-- Carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <select
              v-model="filtros.carrera"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Botón limpiar -->
          <div class="flex items-end">
            <Button variant="outline" class="w-full" @click="limpiarFiltros">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Tabla de inscripciones -->
    <Card>
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Cargando inscripciones...</p>
      </div>

      <div v-else-if="inscripcionesPaginadas.length > 0">
        <!-- Contador de resultados -->
        <div class="mb-4 text-sm text-gray-600">
          Mostrando <strong>{{ inscripcionesPaginadas.length }}</strong> inscripciones
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paralelo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Monto</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="inscripcion in inscripcionesPaginadas" :key="inscripcion.idInscripcion" class="hover:bg-gray-50">
                <!-- ID -->
                <td class="px-4 py-3 text-sm font-mono text-gray-600">
                  #{{ inscripcion.idInscripcion }}
                </td>

                <!-- Usuario -->
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">
                      {{ inscripcion.usuario.nombres }} {{ inscripcion.usuario.apellidos }}
                    </p>
                    <p class="text-xs text-gray-500">{{ inscripcion.usuario.email }}</p>
                    <Badge :variant="inscripcion.usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'" size="sm" class="mt-1">
                      {{ inscripcion.usuario.tipoUsuario }}
                    </Badge>
                  </div>
                </td>

                <!-- Actividad -->
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ inscripcion.actividad.nombre }}</p>
                    <p class="text-xs text-gray-500">{{ inscripcion.actividad.carreraNombre || 'Sin carrera' }}</p>
                  </div>
                </td>

                <!-- Tipo de actividad -->
                <td class="px-4 py-3">
                  <Badge :variant="inscripcion.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                    {{ inscripcion.actividad.tipo }}
                  </Badge>
                </td>

                <!-- Paralelo -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ inscripcion.paralelo || '-' }}
                </td>

                <!-- Tipo de precio -->
                <td class="px-4 py-3">
                  <Badge
                    v-if="inscripcion.montoPagado === 0"
                    variant="success"
                    size="sm"
                  >
                    GRATUITO
                  </Badge>
                  <Badge
                    v-else
                    :variant="inscripcion.tipoPrecio === 'UMSA' ? 'info' : 'warning'"
                    size="sm"
                  >
                    {{ inscripcion.tipoPrecio }}
                  </Badge>
                </td>

                <!-- Monto -->
                <td class="px-4 py-3 text-sm">
                  <span v-if="inscripcion.montoPagado === 0" class="text-green-600 font-medium">
                    GRATUITO
                  </span>
                  <span v-else class="font-medium text-gray-800">
                    Bs. {{ inscripcion.montoPagado.toFixed(2) }}
                  </span>
                </td>

                <!-- Fecha -->
                <td class="px-4 py-3 text-xs text-gray-600">
                  {{ formatDate(inscripcion.fechaInscripcion) }}
                </td>

                <!-- Estado -->
                <td class="px-4 py-3">
                  <Badge :variant="getEstadoBadge(inscripcion.estado)" size="sm">
                    {{ inscripcion.estado }}
                  </Badge>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" @click="verDetalle(inscripcion)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                    <Button
                      v-if="inscripcion.estado !== 'CONFIRMADA'"
                      variant="ghost"
                      size="sm"
                      class="text-green-600 hover:text-green-800"
                      @click="cambiarEstado(inscripcion, 'CONFIRMADA')"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                    <Button
                      v-if="inscripcion.estado !== 'CANCELADA'"
                      variant="ghost"
                      size="sm"
                      class="text-red-600 hover:text-red-800"
                      @click="cambiarEstado(inscripcion, 'CANCELADA')"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-gray-600">No se encontraron inscripciones</p>
      </div>
    </Card>

    <!-- Modal Detalle de Inscripción -->
    <Modal
      :modelValue="showDetalleModal"
      @close="closeDetalleModal"
      title="Detalle de Inscripción"
      size="lg"
    >
      <div v-if="inscripcionSeleccionada" class="space-y-6">
        <!-- Información del Usuario -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Información del Usuario</h3>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-600">Nombre Completo</p>
                <p class="font-medium text-gray-800">
                  {{ inscripcionSeleccionada.usuario.nombres }} {{ inscripcionSeleccionada.usuario.apellidos }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Tipo de Usuario</p>
                <Badge :variant="inscripcionSeleccionada.usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'">
                  {{ inscripcionSeleccionada.usuario.tipoUsuario }}
                </Badge>
              </div>
              <div>
                <p class="text-xs text-gray-600">Email</p>
                <p class="font-medium text-gray-800">{{ inscripcionSeleccionada.usuario.email }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">RU/Username</p>
                <p class="font-medium text-gray-800">{{ inscripcionSeleccionada.usuario.username }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Información de la Actividad -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Información de la Actividad</h3>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-600">Nombre</p>
                <p class="font-medium text-gray-800">{{ inscripcionSeleccionada.actividad.nombre }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Tipo</p>
                <Badge :variant="inscripcionSeleccionada.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'">
                  {{ inscripcionSeleccionada.actividad.tipo }}
                </Badge>
              </div>
              <div>
                <p class="text-xs text-gray-600">Carrera</p>
                <p class="font-medium text-gray-800">{{ inscripcionSeleccionada.actividad.carreraNombre }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Modalidad</p>
                <p class="font-medium text-gray-800">{{ inscripcionSeleccionada.actividad.modalidad }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Carga Horaria</p>
                <p class="font-medium text-gray-800">{{ inscripcionSeleccionada.actividad.cargaHoraria }} horas</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Fechas</p>
                <p class="text-sm text-gray-800">
                  {{ formatDate(inscripcionSeleccionada.actividad.fechaInicio) }} - 
                  {{ formatDate(inscripcionSeleccionada.actividad.fechaFin) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Pago -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Información del Pago</h3>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-600">Tipo de Precio</p>
                <Badge :variant="inscripcionSeleccionada.tipoPrecio === 'UMSA' ? 'info' : 'warning'">
                  {{ inscripcionSeleccionada.tipoPrecio }}
                </Badge>
              </div>
              <div>
                <p class="text-xs text-gray-600">Monto Pagado</p>
                <p class="text-lg font-bold text-gray-800">
                  Bs. {{ inscripcionSeleccionada.montoPagado.toFixed(2) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Estado de Pago</p>
                <Badge variant="success">APROBADO</Badge>
              </div>
              <div>
                <p class="text-xs text-gray-600">Fecha de Inscripción</p>
                <p class="font-medium text-gray-800">{{ formatDatetime(inscripcionSeleccionada.fechaInscripcion) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado de la Inscripción -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Estado de la Inscripción</h3>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-600 mb-1">Estado Actual</p>
                <Badge :variant="getEstadoBadge(inscripcionSeleccionada.estado)" size="lg">
                  {{ inscripcionSeleccionada.estado }}
                </Badge>
              </div>
              <div class="flex space-x-2">
                <Button
                  v-if="inscripcionSeleccionada.estado !== 'CONFIRMADA'"
                  @click="cambiarEstado(inscripcionSeleccionada, 'CONFIRMADA')"
                  size="sm"
                >
                  Confirmar
                </Button>
                <Button
                  v-if="inscripcionSeleccionada.estado !== 'CANCELADA'"
                  @click="cambiarEstado(inscripcionSeleccionada, 'CANCELADA')"
                  variant="danger"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón cerrar -->
        <div class="flex justify-end pt-4 border-t">
          <Button variant="outline" @click="closeDetalleModal">
            Cerrar
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

// ============================================
// TIPOS CORREGIDOS
// ============================================

interface Usuario {
  idUsuario: number  // ← Agregar
  nombres: string
  apellidos: string
  email: string
  username: string
  tipoUsuario: 'INTERNO' | 'EXTERNO'
}

interface Actividad {
  idActividad: number
  nombre: string
  tipo: 'CURSO' | 'EVENTO'
  idCarrera: number | null
  carreraNombre?: string  // Para mostrar en UI
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO'
  cargaHoraria: number
  fechaInicio: string
  fechaFin: string
}

interface Inscripcion {
  idInscripcion: number
  usuario: Usuario
  actividad: Actividad
  paralelo: string | null
  tipoPrecio: 'UMSA' | 'EXTERNO'
  montoPagado: number
  fechaInscripcion: string
  estado: 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA'
}

interface Carrera {
  id: number
  nombre: string
}

// ============================================
// COMPUTED CORREGIDO
// ============================================

const inscripcionesFiltradas = computed(() => {
  let resultado = [...inscripciones.value]

  // Filtro por usuario
  if (filtros.value.busquedaUsuario) {
    const busqueda = filtros.value.busquedaUsuario.toLowerCase()
    resultado = resultado.filter(i =>
      i.usuario.nombres.toLowerCase().includes(busqueda) ||
      i.usuario.apellidos.toLowerCase().includes(busqueda) ||
      i.usuario.email.toLowerCase().includes(busqueda) ||
      i.usuario.username.toLowerCase().includes(busqueda)
    )
  }

  // Filtro por actividad
  if (filtros.value.busquedaActividad) {
    const busqueda = filtros.value.busquedaActividad.toLowerCase()
    resultado = resultado.filter(i =>
      i.actividad.nombre.toLowerCase().includes(busqueda)
    )
  }

  // Filtro por estado
  if (filtros.value.estado) {
    resultado = resultado.filter(i => i.estado === filtros.value.estado)
  }

  // Filtro por tipo de actividad
  if (filtros.value.tipoActividad) {
    resultado = resultado.filter(i => i.actividad.tipo === filtros.value.tipoActividad)
  }

  // Filtro por tipo de precio
  if (filtros.value.tipoPrecio) {
    if (filtros.value.tipoPrecio === 'GRATUITO') {
      resultado = resultado.filter(i => i.montoPagado === 0)
    } else {
      resultado = resultado.filter(i => i.tipoPrecio === filtros.value.tipoPrecio && i.montoPagado > 0)
    }
  }

  // ✅ FILTRO POR CARRERA CORREGIDO
  if (filtros.value.carrera) {
    resultado = resultado.filter(i => 
      i.actividad.idCarrera === Number(filtros.value.carrera)
    )
  }

  return resultado
})

// ============================================
// MOCK DATA CORREGIDO
// ============================================

const cargarDatos = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    carreras.value = [
      { id: 1, nombre: 'Psicología' },
      { id: 2, nombre: 'Filosofía' },
      { id: 3, nombre: 'Ciencias de la Educación' },
      { id: 4, nombre: 'Lingüística' }
    ]

    // ✅ MOCK DATA CORREGIDO
    inscripciones.value = [
      {
        idInscripcion: 1,
        usuario: {
          idUsuario: 1,
          nombres: 'Juan Carlos',
          apellidos: 'Pérez López',
          email: 'juan.perez@umsa.bo',
          username: '202012345',
          tipoUsuario: 'INTERNO'
        },
        actividad: {
          idActividad: 1,
          nombre: 'Introducción a la Psicología Clínica',
          tipo: 'CURSO',
          idCarrera: 1,  // ← ID numérico
          carreraNombre: 'Psicología',  // ← Nombre para mostrar
          modalidad: 'PRESENCIAL',
          cargaHoraria: 40,
          fechaInicio: '2024-03-01',
          fechaFin: '2024-04-30'
        },
        paralelo: 'A',
        tipoPrecio: 'UMSA',
        montoPagado: 300,
        fechaInscripcion: '2024-02-15T10:30:00',
        estado: 'CONFIRMADA'
      },
      {
        idInscripcion: 2,
        usuario: {
          idUsuario: 2,
          nombres: 'María Elena',
          apellidos: 'García Sánchez',
          email: 'maria.garcia@gmail.com',
          username: 'mgarcia',
          tipoUsuario: 'EXTERNO'
        },
        actividad: {
          idActividad: 2,
          nombre: 'Congreso Internacional de Psicología',
          tipo: 'EVENTO',
          idCarrera: 1,  // ← ID numérico
          carreraNombre: 'Psicología',  // ← Nombre para mostrar
          modalidad: 'MIXTO',
          cargaHoraria: 20,
          fechaInicio: '2024-05-10',
          fechaFin: '2024-05-12'
        },
        paralelo: null,
        tipoPrecio: 'EXTERNO',
        montoPagado: 150,
        fechaInscripcion: '2024-04-20T14:15:00',
        estado: 'CONFIRMADA'
      },
      {
        idInscripcion: 3,
        usuario: {
          idUsuario: 3,
          nombres: 'Pedro',
          apellidos: 'Mamani Quispe',
          email: 'pedro.mamani@umsa.bo',
          username: '202098765',
          tipoUsuario: 'INTERNO'
        },
        actividad: {
          idActividad: 3,
          nombre: 'Taller de Escritura Creativa',
          tipo: 'EVENTO',
          idCarrera: 4,  // ← ID numérico (Lingüística)
          carreraNombre: 'Lingüística',  // ← Nombre para mostrar
          modalidad: 'VIRTUAL',
          cargaHoraria: 12,
          fechaInicio: '2024-03-15',
          fechaFin: '2024-03-17'
        },
        paralelo: null,
        tipoPrecio: 'UMSA',
        montoPagado: 0,
        fechaInscripcion: '2024-03-10T09:00:00',
        estado: 'PENDIENTE'
      }
    ]

    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}


// ============================================
// ESTADO
// ============================================

const loading = ref(false)
const inscripciones = ref<Inscripcion[]>([])
const carreras = ref<Carrera[]>([])

const estadisticas = ref({
  total: 0,
  confirmadas: 0,
  pendientes: 0,
  canceladas: 0,
  totalIngresos: 0
})

const filtros = ref({
  busquedaUsuario: '',
  busquedaActividad: '',
  estado: '',
  tipoActividad: '',
  tipoPrecio: '',
  carrera: ''
})

const showDetalleModal = ref(false)
const inscripcionSeleccionada = ref<Inscripcion | null>(null)



// Para Actividades.vue
const {
  paginatedData: inscripcionesPaginadas,  // ← Cambiar nombre según tu vista
  currentPage,
  pageSize,
  totalItems,
  goToPage,
  setPageSize
} = usePagination(inscripcionesFiltradas, { // ← Usar TU computed filtrado
  pageSize: 10,
  initialPage: 1
})


const calcularEstadisticas = () => {
  estadisticas.value = {
    total: inscripciones.value.length,
    confirmadas: inscripciones.value.filter(i => i.estado === 'CONFIRMADA').length,
    pendientes: inscripciones.value.filter(i => i.estado === 'PENDIENTE').length,
    canceladas: inscripciones.value.filter(i => i.estado === 'CANCELADA').length,
    totalIngresos: inscripciones.value
      .filter(i => i.estado === 'CONFIRMADA')
      .reduce((sum, i) => sum + i.montoPagado, 0)
  }
}

const cambiarEstado = async (inscripcion: Inscripcion, nuevoEstado: 'CONFIRMADA' | 'CANCELADA') => {
  const mensaje = nuevoEstado === 'CONFIRMADA' 
    ? '¿Confirmar esta inscripción?' 
    : '¿Cancelar esta inscripción?'

  if (confirm(mensaje)) {
    try {
      // TODO: Implementar llamada a API
      console.log(`Cambiando estado de inscripción ${inscripcion.idInscripcion} a ${nuevoEstado}`)
      inscripcion.estado = nuevoEstado
      calcularEstadisticas()
      closeDetalleModal()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
    }
  }
}

const exportarInscripciones = () => {
  // TODO: Implementar exportación a Excel
  console.log('Exportando inscripciones a Excel...')
  alert('Funcionalidad de exportación en desarrollo')
}

// ============================================
// MÉTODOS - MODALES
// ============================================

const verDetalle = (inscripcion: Inscripcion) => {
  inscripcionSeleccionada.value = inscripcion
  showDetalleModal.value = true
}

const closeDetalleModal = () => {
  showDetalleModal.value = false
  inscripcionSeleccionada.value = null
}

// ============================================
// MÉTODOS - UTILIDADES
// ============================================

const limpiarFiltros = () => {
  filtros.value = {
    busquedaUsuario: '',
    busquedaActividad: '',
    estado: '',
    tipoActividad: '',
    tipoPrecio: '',
    carrera: ''
  }
}

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

const getEstadoBadge = (estado: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'CONFIRMADA': 'success',
    'PENDIENTE': 'warning',
    'CANCELADA': 'danger'
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