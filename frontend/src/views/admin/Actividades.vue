<template>
  <!--
    Vista de Gestión de Actividades - Administrador
    Permite gestionar todos los cursos y eventos del sistema sin filtro de carrera
  -->
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Actividades</h1>
        <p class="text-gray-600">Administrar todos los cursos y eventos del sistema</p>
      </div>
      <Button @click="openCreateModal">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva Actividad
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
          <p class="text-2xl font-bold text-purple-600">{{ estadisticas.cursos }}</p>
          <p class="text-sm text-gray-600">Cursos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ estadisticas.eventos }}</p>
          <p class="text-sm text-gray-600">Eventos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ estadisticas.abiertos }}</p>
          <p class="text-sm text-gray-600">Abiertos</p>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-600">{{ estadisticas.finalizados }}</p>
          <p class="text-sm text-gray-600">Finalizados</p>
        </div>
      </Card>
    </div>

    <!-- Filtros -->
    <Card>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Búsqueda -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            v-model="filtros.busqueda"
            type="text"
            placeholder="Nombre de la actividad..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            v-model="filtros.tipo"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="CURSO">Cursos</option>
            <option value="EVENTO">Eventos</option>
          </select>
        </div>

        <!-- Estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="filtros.estado"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abiertos</option>
            <option value="LLENO">Llenos</option>
            <option value="FINALIZADO">Finalizados</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <!-- Carrera -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
          <select
            v-model="filtros.carrera"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las carreras</option>
            <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>

        <!-- Modalidad -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
          <select
            v-model="filtros.modalidad"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
            <option value="MIXTO">Mixto</option>
          </select>
        </div>

        <!-- Rango de fechas -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            v-model="filtros.fechaDesde"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="flex items-end">
          <Button variant="outline" class="w-full" @click="limpiarFiltros">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpiar
          </Button>
        </div>
      </div>
    </Card>

    <!-- Tabla de actividades -->
    <Card>
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Cargando actividades...</p>
      </div>

      <div v-else-if="actividadesPaginadas.length > 0" class="overflow-x-auto"> <!-- era actividadesFiltradas -->
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actividad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Carrera</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fechas</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Modalidad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Inscritos</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="actividad in actividadesPaginadas" :key="actividad.idActividad" class="hover:bg-gray-50">
              <!-- Nombre -->
              <td class="px-4 py-3">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ actividad.nombre }}</p>
                  <p class="text-xs text-gray-500">{{ actividad.cargaHoraria }} horas</p>
                </div>
              </td>

              <!-- Tipo -->
              <td class="px-4 py-3">
                <Badge :variant="actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ actividad.tipo }}
                </Badge>
              </td>

              <!-- Carrera -->
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ actividad.carrera }}
              </td>

              <!-- Fechas -->
              <td class="px-4 py-3 text-sm text-gray-600">
                <div class="text-xs">
                  <p>{{ formatDate(actividad.fechaInicio) }}</p>
                  <p class="text-gray-500">{{ formatDate(actividad.fechaFin) }}</p>
                </div>
              </td>

              <!-- Modalidad -->
              <td class="px-4 py-3">
                <Badge :variant="getModalidadBadge(actividad.modalidad)" size="sm">
                  {{ actividad.modalidad }}
                </Badge>
              </td>

              <!-- Inscritos -->
              <td class="px-4 py-3 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ actividad.inscritos }}</span>
                  <span class="text-gray-500">/ {{ actividad.cupoMaximo }}</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="getCupoColor(actividad.inscritos, actividad.cupoMaximo)"
                      :style="{ width: `${getCupoPorcentaje(actividad.inscritos, actividad.cupoMaximo)}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Precio -->
              <td class="px-4 py-3 text-sm">
                <div v-if="actividad.esGratuito" class="text-green-600 font-medium">
                  GRATUITO
                </div>
                <div v-else class="text-xs">
                  <p class="text-gray-800">Bs. {{ actividad.costoExterno }}</p>
                  <p class="text-gray-500">Bs. {{ actividad.costoUmsa }} (UMSA)</p>
                </div>
              </td>

              <!-- Estado -->
              <td class="px-4 py-3">
                <Badge :variant="getEstadoBadge(actividad.estado)" size="sm">
                  {{ actividad.estado }}
                </Badge>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" @click="verDetalle(actividad)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="sm" @click="openEditModal(actividad)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-600 hover:text-red-800"
                    @click="eliminarActividad(actividad)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-600">No se encontraron actividades</p>
      </div>
    </Card>

    <!-- Modal Crear/Editar Actividad -->
    <Modal
      :modelValue="showActividadModal"
      @close="closeActividadModal"
      :title="modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'"
      size="lg"
    >
      <form @submit.prevent="submitActividad" class="space-y-4">
        <!-- Tipo de actividad -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Actividad <span class="text-red-600">*</span>
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formActividad.tipo === 'CURSO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formActividad.tipo"
                value="CURSO"
                class="w-4 h-4 text-blue-600"
              />
              <div class="ml-3">
                <p class="font-medium text-gray-800">Curso Complementario</p>
                <p class="text-xs text-gray-600">Requiere calificación</p>
              </div>
            </label>
            <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="formActividad.tipo === 'EVENTO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="formActividad.tipo"
                value="EVENTO"
                class="w-4 h-4 text-blue-600"
              />
              <div class="ml-3">
                <p class="font-medium text-gray-800">Evento Facultativo</p>
                <p class="text-xs text-gray-600">Solo asistencia</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Información básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Nombre -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span class="text-red-600">*</span>
            </label>
            <input
              v-model="formActividad.nombre"
              type="text"
              required
              placeholder="Ej: Introducción a la Psicología Clínica"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Carrera -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Carrera <span class="text-red-600">*</span>
            </label>
            <select
              v-model="formActividad.idCarrera"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar carrera</option>
              <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>

          <!-- Carga horaria -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Carga Horaria <span class="text-red-600">*</span>
            </label>
            <input
              v-model.number="formActividad.cargaHoraria"
              type="number"
              required
              min="1"
              placeholder="Horas académicas"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Modalidad -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Modalidad <span class="text-red-600">*</span>
            </label>
            <select
              v-model="formActividad.modalidad"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>

          <!-- Cupo máximo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Cupo Máximo <span class="text-red-600">*</span>
            </label>
            <input
              v-model.number="formActividad.cupoMaximo"
              type="number"
              required
              min="1"
              placeholder="Número de participantes"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Fechas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio <span class="text-red-600">*</span>
            </label>
            <input
              v-model="formActividad.fechaInicio"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Fin <span class="text-red-600">*</span>
            </label>
            <input
              v-model="formActividad.fechaFin"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            v-model="formActividad.descripcion"
            rows="3"
            placeholder="Describe los objetivos, contenidos y requisitos de la actividad..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Precios -->
        <div>
          <label class="flex items-center mb-3">
            <input
              type="checkbox"
              v-model="formActividad.esGratuito"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm font-medium text-gray-700">Actividad Gratuita</span>
          </label>

          <div v-if="!formActividad.esGratuito" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Precio Externo (Bs.) <span class="text-red-600">*</span>
              </label>
              <input
                v-model.number="formActividad.costoExterno"
                type="number"
                :required="!formActividad.esGratuito"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Precio UMSA (Bs.) <span class="text-red-600">*</span>
              </label>
              <input
                v-model.number="formActividad.costoUmsa"
                type="number"
                :required="!formActividad.esGratuito"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Nota mínima (solo para cursos) -->
        <div v-if="formActividad.tipo === 'CURSO'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nota Mínima de Aprobación <span class="text-red-600">*</span>
          </label>
          <input
            v-model.number="formActividad.notaMinimaAprobacion"
            type="number"
            :required="formActividad.tipo === 'CURSO'"
            min="0"
            max="100"
            placeholder="Sobre 100 puntos"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">Sobre 100 puntos</p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" @click="closeActividadModal">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear') }}
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
import Pagination from '@/components/common/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { api } from '@/utils/api'
// ============================================
// TIPOS
// ============================================

interface Actividad {
  idActividad: number
  tipo: 'CURSO' | 'EVENTO'
  nombre: string
  descripcion: string
  cargaHoraria: number
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO'
  fechaInicio: string
  fechaFin: string
  cupoMaximo: number
  costoExterno: number
  costoUmsa: number
  esGratuito: boolean
  notaMinimaAprobacion: number | null
  estado: 'ABIERTO' | 'LLENO' | 'FINALIZADO'
  idCarrera: number | null
  carrera: string
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

const actividades = ref<Actividad[]>([])
const carreras = ref<Carrera[]>([])

const estadisticas = ref({
  total: 0,
  cursos: 0,
  eventos: 0,
  abiertos: 0,
  finalizados: 0
})

const filtros = ref({
  busqueda: '',
  tipo: '',
  estado: '',
  carrera: '',
  modalidad: '',
  fechaDesde: ''
})

const showActividadModal = ref(false)
const modoEdicion = ref(false)

const formActividad = ref({
  tipo: 'CURSO',
  nombre: '',
  descripcion: '',
  cargaHoraria: 0,
  modalidad: '',
  fechaInicio: '',
  fechaFin: '',
  cupoMaximo: 0,
  costoExterno: 0,
  costoUmsa: 0,
  esGratuito: false,
  notaMinimaAprobacion: 51,
  idCarrera: ''
})

// ============================================
// COMPUTED
// ============================================

const actividadesFiltradas = computed(() => {
  let resultado = [...actividades.value]

  if (filtros.value.busqueda) {
    const busqueda = filtros.value.busqueda.toLowerCase()
    resultado = resultado.filter(a =>
      a.nombre.toLowerCase().includes(busqueda)
    )
  }

  if (filtros.value.tipo) {
    resultado = resultado.filter(a => a.tipo === filtros.value.tipo)
  }

  if (filtros.value.estado) {
    resultado = resultado.filter(a => a.estado === filtros.value.estado)
  }

  if (filtros.value.carrera) {
    resultado = resultado.filter(a => a.idCarrera === Number(filtros.value.carrera))
  }

  if (filtros.value.modalidad) {
    resultado = resultado.filter(a => a.modalidad === filtros.value.modalidad)
  }

  return resultado
})

const {
  paginatedData: actividadesPaginadas, // ← Los datos que mostraremos en la tabla (10 items por defecto)
  currentPage,                       // ← Página actual (reactivo)
  pageSize,                          // ← Tamaño de página (reactivo)
  totalPages,                        // ← Total de páginas (calculado automáticamente)
  totalItems,                        // ← Total de items después de filtrar
  goToPage,                          // ← Método para ir a una página específica
  setPageSize                        // ← Método para cambiar el tamaño de página
} = usePagination(actividadesFiltradas, {
  pageSize: 10,      
  initialPage: 1     
})

// ============================================
// MÉTODOS
// ============================================

const cargarDatos = async () => {
  loading.value = true
  try {
    const [carrerasResponse, cursosResponse, eventosResponse] = await Promise.all([
      api.get('/carreras/todas'),
      api.get('/cursos/todos'),
      api.get('/eventos/todos')
    ])

    carreras.value = (carrerasResponse as Carrera[])

    const cursos = (cursosResponse as Array<Record<string, unknown>>).map(curso => {
      const costoExterno = Number(curso.costoExterno ?? 0)
      const costoUmsa = Number(curso.costoUmsa ?? 0)
      const paralelos = Array.isArray(curso.paralelos)
        ? (curso.paralelos as Array<Record<string, unknown>>)
        : []
      const inscritos = paralelos.reduce((sum, p) => sum + Number(p.inscritos ?? 0), 0)
      const cupoMaximo = paralelos.reduce((sum, p) => sum + Number(p.cupoMaximo ?? 0), 0)

      return {
        idActividad: Number(curso.idCurso),
        tipo: 'CURSO' as const,
        nombre: String(curso.nombre ?? ''),
        descripcion: String(curso.descripcion ?? ''),
        cargaHoraria: Number(curso.cargaHoraria ?? 0),
        modalidad: 'PRESENCIAL' as const,
        fechaInicio: String(curso.fechaInicio ?? ''),
        fechaFin: String(curso.fechaInicio ?? ''),
        cupoMaximo,
        costoExterno,
        costoUmsa,
        esGratuito: costoExterno === 0 && costoUmsa === 0,
        notaMinimaAprobacion: curso.notaAprobacion !== undefined ? Number(curso.notaAprobacion) : null,
        estado: String(curso.estado ?? 'ABIERTO') as Actividad['estado'],
        idCarrera: curso.idCarrera !== undefined ? Number(curso.idCarrera) : null,
        carrera: String(curso.nombreCarrera ?? ''),
        inscritos
      }
    })

    const eventos = (eventosResponse as Array<Record<string, unknown>>).map(evento => {
      const costoExterno = Number(evento.costoExterno ?? 0)
      const costoUmsa = Number(evento.costoUmsa ?? 0)
      const fechaHora = evento.fechaHora ? String(evento.fechaHora) : ''

      return {
        idActividad: Number(evento.idEvento),
        tipo: 'EVENTO' as const,
        nombre: String(evento.nombre ?? ''),
        descripcion: String(evento.descripcion ?? ''),
        cargaHoraria: Number(evento.cargaHoraria ?? 0),
        modalidad: String(evento.modalidad ?? 'PRESENCIAL') as Actividad['modalidad'],
        fechaInicio: fechaHora,
        fechaFin: fechaHora,
        cupoMaximo: Number(evento.cupoMaximo ?? 0),
        costoExterno,
        costoUmsa,
        esGratuito: costoExterno === 0 && costoUmsa === 0,
        notaMinimaAprobacion: null,
        estado: String(evento.estado ?? 'ABIERTO') as Actividad['estado'],
        idCarrera: evento.idCarrera !== undefined ? Number(evento.idCarrera) : null,
        carrera: String(evento.nombreCarrera ?? ''),
        inscritos: Number(evento.inscritos ?? 0)
      }
    })

    actividades.value = [...cursos, ...eventos]

    calcularEstadisticas()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const calcularEstadisticas = () => {
  estadisticas.value = {
    total: actividades.value.length,
    cursos: actividades.value.filter(a => a.tipo === 'CURSO').length,
    eventos: actividades.value.filter(a => a.tipo === 'EVENTO').length,
    abiertos: actividades.value.filter(a => a.estado === 'ABIERTO').length,
    finalizados: actividades.value.filter(a => a.estado === 'FINALIZADO').length
  }
}

const submitActividad = async () => {
  saving.value = true
  try {
    console.log('Guardando actividad:', formActividad.value)
    closeActividadModal()
    await cargarDatos()
  } catch (error) {
    console.error('Error al guardar actividad:', error)
  } finally {
    saving.value = false
  }
}

const eliminarActividad = async (actividad: Actividad) => {
  if (confirm(`¿Estás seguro de eliminar "${actividad.nombre}"?`)) {
    try {
      console.log('Eliminando:', actividad.idActividad)
      await cargarDatos()
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }
}

const openCreateModal = () => {
  modoEdicion.value = false
  formActividad.value = {
    tipo: 'CURSO',
    nombre: '',
    descripcion: '',
    cargaHoraria: 0,
    modalidad: '',
    fechaInicio: '',
    fechaFin: '',
    cupoMaximo: 0,
    costoExterno: 0,
    costoUmsa: 0,
    esGratuito: false,
    notaMinimaAprobacion: 51,
    idCarrera: ''
  }
  showActividadModal.value = true
}

const openEditModal = (actividad: Actividad) => {
  modoEdicion.value = true
  // TODO: Cargar datos de la actividad
  showActividadModal.value = true
}

const closeActividadModal = () => {
  showActividadModal.value = false
}

const verDetalle = (actividad: Actividad) => {
  console.log('Ver detalle:', actividad)
}

const limpiarFiltros = () => {
  filtros.value = {
    busqueda: '',
    tipo: '',
    estado: '',
    carrera: '',
    modalidad: '',
    fechaDesde: ''
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

const getEstadoBadge = (estado: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'ABIERTO': 'success',
    'LLENO': 'warning',
    'FINALIZADO': 'gray'
  }
  return variants[estado] || 'info'
}

const getModalidadBadge = (modalidad: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    'PRESENCIAL': 'info',
    'VIRTUAL': 'secondary',
    'MIXTO': 'primary'
  }
  return variants[modalidad] || 'gray'
}

const getCupoColor = (inscritos: number, maximo: number) => {
  if (!maximo || maximo <= 0) return 'bg-gray-400'
  const porcentaje = (inscritos / maximo) * 100
  if (porcentaje >= 90) return 'bg-red-600'
  if (porcentaje >= 70) return 'bg-yellow-600'
  return 'bg-green-600'
}

const getCupoPorcentaje = (inscritos: number, maximo: number) => {
  if (!maximo || maximo <= 0) return 0
  return Math.min(100, (inscritos / maximo) * 100)
}

onMounted(() => {
  cargarDatos()
})
</script>