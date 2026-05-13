<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Reportes</h1>
        <p class="text-sm text-slate-500">Resumen academico e ingresos de tus carreras.</p>
      </div>
      <Button variant="outline" size="sm" :loading="loading" @click="loadReportes">
        Actualizar
      </Button>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-4">
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Desde</label>
          <input
            v-model="filters.desde"
            type="date"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Hasta</label>
          <input
            v-model="filters.hasta"
            type="date"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</label>
          <select
            v-model="filters.tipo"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="CURSO">Curso</option>
            <option value="EVENTO">Evento</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select
            v-model="filters.estado"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Cerrado</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model.number="filters.carreraId"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option :value="null">Todas</option>
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar actividad</label>
          <input
            v-model="filters.buscar"
            type="text"
            placeholder="Buscar por nombre"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div class="flex items-end gap-2">
          <Button variant="outline" class="w-full" @click="clearFilters">Limpiar</Button>
          <Button class="w-full" :loading="loading" @click="loadReportes">Aplicar</Button>
        </div>
      </div>
    </Card>

    <div v-if="errorMessage" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ errorMessage }}
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Actividades</p>
        <p class="text-2xl font-semibold text-slate-900">{{ totalActividades }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Inscritos confirmados</p>
        <p class="text-2xl font-semibold text-slate-900">{{ totalInscritos }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Participantes UMSA</p>
        <p class="text-2xl font-semibold text-slate-900">{{ totalUmsa }}</p>
      </Card>
      <Card>
        <p class="text-xs uppercase tracking-wide text-slate-500">Ingresos</p>
        <p class="text-2xl font-semibold text-emerald-600">Bs. {{ totalIngresosFiltrados.toFixed(2) }}</p>
      </Card>
    </div>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Actividades academicas</h3>
          <p class="text-sm text-slate-500">Cursos y eventos con inscritos confirmados.</p>
        </div>
      </div>
      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">Cargando reportes...</div>
      <div v-else-if="academicosFiltrados.length === 0" class="py-8 text-center text-sm text-slate-500">Sin datos.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Actividad</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">Carrera</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3">Inscritos / Cupo</th>
              <th class="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in academicosPaginados" :key="item.key">
              <td class="px-4 py-3 font-medium text-slate-800">{{ item.nombre }}</td>
              <td class="px-4 py-3">{{ item.tipo }}</td>
              <td class="px-4 py-3">{{ item.carrera }}</td>
              <td class="px-4 py-3">{{ formatDate(item.fecha) }}</td>
              <td class="px-4 py-3">{{ item.estado }}</td>
              <td class="px-4 py-3">{{ formatCupo(item.inscritos, item.cupoMaximo) }}</td>
              <td class="px-4 py-3">
                <Button size="sm" variant="outline" @click="openDetalleModal(item)">Detalle</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="academicosTotalItems > academicosPageSize" class="mt-4">
        <Pagination
          :currentPage="academicosCurrentPage"
          :totalItems="academicosTotalItems"
          :pageSize="academicosPageSize"
          :showPageSizeSelector="true"
          :pageSizeOptions="[10, 25, 50, 100]"
          @update:currentPage="goToAcademicosPage"
          @update:pageSize="setAcademicosPageSize"
        />
      </div>
    </Card>

    <Modal
      :modelValue="showDetalleModal"
      title="Detalle de actividad"
      size="lg"
      @close="closeDetalleModal"
    >
      <div v-if="detalleLoading" class="py-6 text-center text-sm text-slate-500">Cargando detalle...</div>
      <div v-else-if="detalleError" class="py-4 text-sm text-rose-600">{{ detalleError }}</div>
      <div v-else-if="!detalleActividad" class="py-6 text-center text-sm text-slate-500">
        Selecciona una actividad para ver el detalle.
      </div>
      <div v-else class="space-y-4">
        <div class="space-y-1">
          <div class="text-lg font-semibold text-slate-900">{{ detalleActividad.nombre }}</div>
          <div class="text-sm text-slate-500">{{ detalleActividad.carrera }} • {{ detalleActividad.tipo }}</div>
          <div class="text-sm text-slate-500">Estado: {{ detalleActividad.estado }}</div>
        </div>
        <div class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <div class="flex justify-between">
            <span>Inscritos confirmados</span>
            <span class="font-semibold">{{ detalleActividad.inscritosConfirmados }}</span>
          </div>
          <div class="flex justify-between">
            <span>Cupo / Disponibles</span>
            <span class="font-semibold">{{ detalleActividad.cupoMaximo }} / {{ detalleActividad.cuposDisponibles }}</span>
          </div>
          <div class="flex justify-between">
            <span>Participantes UMSA</span>
            <span class="font-semibold">{{ detalleActividad.participantesUmsa }}</span>
          </div>
          <div class="flex justify-between">
            <span>Participantes externos</span>
            <span class="font-semibold">{{ detalleActividad.participantesExterno }}</span>
          </div>
          <div class="flex justify-between">
            <span>Aprobados</span>
            <span class="font-semibold">{{ detalleActividad.aprobados }}</span>
          </div>
          <div class="flex justify-between">
            <span>Asistidos</span>
            <span class="font-semibold">{{ detalleActividad.asistidos }}</span>
          </div>
          <div class="flex justify-between">
            <span>Ingresos UMSA</span>
            <span class="font-semibold">Bs. {{ detalleActividad.ingresosUmsa.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Ingresos externos</span>
            <span class="font-semibold">Bs. {{ detalleActividad.ingresosExterno.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Ingresos totales</span>
            <span class="font-semibold">Bs. {{ detalleActividad.ingresosTotal.toFixed(2) }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" @click="goToInscritos(detalleActividad)">Ver inscritos</Button>
        </div>
      </div>
    </Modal>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Ingresos por actividad</h3>
          <p class="text-sm text-slate-500">Desglose UMSA y externo.</p>
        </div>
      </div>
      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">Cargando reportes...</div>
      <div v-else-if="finanzasFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">Sin datos.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Actividad</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">UMSA</th>
              <th class="px-4 py-3">Externo</th>
              <th class="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in finanzasPaginadas" :key="item.idActividad">
              <td class="px-4 py-3 font-medium text-slate-800">{{ item.nombre }}</td>
              <td class="px-4 py-3">{{ item.tipo }}</td>
              <td class="px-4 py-3">Bs. {{ item.ingresosUmsa.toFixed(2) }}</td>
              <td class="px-4 py-3">Bs. {{ item.ingresosExterno.toFixed(2) }}</td>
              <td class="px-4 py-3 font-semibold">Bs. {{ item.ingresosTotal.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="finanzasFiltradas.length > 0" class="mt-3 flex justify-end text-sm text-slate-700">
        <span class="font-semibold">Total recolectado: Bs. {{ totalIngresosFiltrados.toFixed(2) }}</span>
      </div>
      <div v-if="finanzasTotalItems > finanzasPageSize" class="mt-4">
        <Pagination
          :currentPage="finanzasCurrentPage"
          :totalItems="finanzasTotalItems"
          :pageSize="finanzasPageSize"
          :showPageSizeSelector="true"
          :pageSizeOptions="[10, 25, 50, 100]"
          @update:currentPage="goToFinanzasPage"
          @update:pageSize="setFinanzasPageSize"
        />
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { api } from '@/utils/api'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface ReporteAcademicoCurso {
  idCurso: number
  nombre: string
  carrera: string
  fechaInicio: string
  estado: string
  inscritosConfirmados: number
  cupoMaximo: number
}

interface ReporteAcademicoEvento {
  idEvento: number
  nombre: string
  carrera: string
  fechaHora: string
  estado: string
  inscritosConfirmados: number
  cupoMaximo: number
}

interface ReporteFinancieroActividad {
  tipo: 'CURSO' | 'EVENTO'
  idActividad: number
  nombre: string
  carrera: string
  ingresosUmsa: number
  ingresosExterno: number
  ingresosTotal: number
}

interface ReporteActividadDetalle {
  tipo: 'CURSO' | 'EVENTO'
  idActividad: number
  nombre: string
  carrera: string
  estado: string
  inscritosConfirmados: number
  cupoMaximo: number
  cuposDisponibles: number
  participantesUmsa: number
  participantesExterno: number
  aprobados: number
  asistidos: number
  ingresosUmsa: number
  ingresosExterno: number
  ingresosTotal: number
}

interface ReporteAcademicoResponse {
  cursos: ReporteAcademicoCurso[]
  eventos: ReporteAcademicoEvento[]
}

interface ReporteParticipacionResponse {
  totalUmsa: number
  totalExterno: number
  totalGeneral: number
}

interface ReporteFinancieroResponse {
  cursos: ReporteFinancieroActividad[]
  eventos: ReporteFinancieroActividad[]
  totalUmsa: number
  totalExterno: number
  totalGeneral: number
}


const loading = ref(false)
const errorMessage = ref('')

const carreras = ref<CarreraDto[]>([])

const academicosCursos = ref<ReporteAcademicoCurso[]>([])
const academicosEventos = ref<ReporteAcademicoEvento[]>([])
const totalUmsa = ref(0)

const finanzasResumen = ref<ReporteFinancieroActividad[]>([])
const router = useRouter()

const detalleActividad = ref<ReporteActividadDetalle | null>(null)
const detalleLoading = ref(false)
const detalleError = ref('')
const showDetalleModal = ref(false)

const filters = ref({
  desde: '',
  hasta: '',
  tipo: '',
  estado: '',
  carreraId: null as number | null,
  buscar: ''
})

const clearFilters = () => {
  filters.value = {
    desde: '',
    hasta: '',
    tipo: '',
    estado: '',
    carreraId: null,
    buscar: ''
  }
}

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
}

const buildQueryParams = () => {
  const params = new URLSearchParams()
  if (filters.value.desde) params.set('desde', filters.value.desde)
  if (filters.value.hasta) params.set('hasta', filters.value.hasta)
  if (filters.value.carreraId) params.set('idCarrera', String(filters.value.carreraId))
  return params
}

const academicosFiltrados = computed(() => {
  const entries: Array<{
    key: string
    tipo: 'CURSO' | 'EVENTO'
    nombre: string
    carrera: string
    fecha: string
    estado: string
    inscritos: number
    cupoMaximo: number
    idActividad: number
  }> = []

  academicosCursos.value.forEach((curso) => {
    entries.push({
      key: `CURSO-${curso.idCurso}`,
      tipo: 'CURSO',
      nombre: curso.nombre,
      carrera: curso.carrera,
      fecha: curso.fechaInicio,
      estado: curso.estado,
      inscritos: curso.inscritosConfirmados,
      cupoMaximo: curso.cupoMaximo ?? 0,
      idActividad: curso.idCurso
    })
  })

  academicosEventos.value.forEach((evento) => {
    entries.push({
      key: `EVENTO-${evento.idEvento}`,
      tipo: 'EVENTO',
      nombre: evento.nombre,
      carrera: evento.carrera,
      fecha: evento.fechaHora,
      estado: evento.estado,
      inscritos: evento.inscritosConfirmados,
      cupoMaximo: evento.cupoMaximo ?? 0,
      idActividad: evento.idEvento
    })
  })

  return entries.filter((item) => {
    if (filters.value.tipo && item.tipo !== filters.value.tipo) return false
    if (filters.value.estado && item.estado !== filters.value.estado) return false
    if (filters.value.buscar) {
      const term = filters.value.buscar.trim().toLowerCase()
      if (term && !item.nombre.toLowerCase().includes(term)) return false
    }
    return true
  })
})

const academicosPagination = usePagination(academicosFiltrados, { pageSize: 10 })

const academicosPaginados = computed(() => academicosPagination.paginatedData.value)
const academicosCurrentPage = academicosPagination.currentPage
const academicosPageSize = academicosPagination.pageSize
const academicosTotalItems = academicosPagination.totalItems
const goToAcademicosPage = academicosPagination.goToPage
const setAcademicosPageSize = academicosPagination.setPageSize

const totalActividades = computed(() => academicosFiltrados.value.length)

const totalInscritos = computed(() => academicosFiltrados.value.reduce((sum, item) => sum + item.inscritos, 0))

const finanzasFiltradas = computed(() => {
  return finanzasResumen.value.filter((row) => {
    if (filters.value.tipo && row.tipo !== filters.value.tipo) return false
    return true
  })
})

const totalIngresosFiltrados = computed(() => {
  return finanzasFiltradas.value.reduce((sum, row) => sum + row.ingresosTotal, 0)
})

const finanzasPagination = usePagination(finanzasFiltradas, { pageSize: 10 })

const finanzasPaginadas = computed(() => finanzasPagination.paginatedData.value)
const finanzasCurrentPage = finanzasPagination.currentPage
const finanzasPageSize = finanzasPagination.pageSize
const finanzasTotalItems = finanzasPagination.totalItems
const goToFinanzasPage = finanzasPagination.goToPage
const setFinanzasPageSize = finanzasPagination.setPageSize

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatCupo = (inscritos: number, cupoMaximo: number) => {
  const cupo = cupoMaximo && cupoMaximo > 0 ? String(cupoMaximo) : '-'
  return `${inscritos}/${cupo}`
}

const goToInscritos = (detalle: ReporteActividadDetalle) => {
  router.push(`/coordinador/inscritos?tipo=${detalle.tipo}&idActividad=${detalle.idActividad}`)
}

const closeDetalleModal = () => {
  showDetalleModal.value = false
  detalleActividad.value = null
  detalleError.value = ''
}

const openDetalleModal = async (item: { tipo: 'CURSO' | 'EVENTO'; idActividad: number }) => {
  showDetalleModal.value = true
  detalleLoading.value = true
  detalleError.value = ''
  try {
    const params = new URLSearchParams()
    params.set('tipo', item.tipo)
    params.set('idActividad', String(item.idActividad))
    const response = await api.get(`/reportes/actividad?${params.toString()}`) as ReporteActividadDetalle
    detalleActividad.value = response
  } catch (error) {
    detalleError.value = (error as Error).message || 'No se pudo cargar el detalle.'
  } finally {
    detalleLoading.value = false
  }
}

const loadReportes = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = buildQueryParams()
    const query = params.toString() ? `?${params.toString()}` : ''

    const [academicosResponse, participacionResponse, financieroResponse] = await Promise.all([
      api.get(`/reportes/academicos${query}`) as Promise<ReporteAcademicoResponse>,
      api.get(`/reportes/participacion${query}`) as Promise<ReporteParticipacionResponse>,
      api.get(`/reportes/financieros/coordinador${query}`) as Promise<ReporteFinancieroResponse>
    ])

    academicosCursos.value = academicosResponse.cursos || []
    academicosEventos.value = academicosResponse.eventos || []

    totalUmsa.value = participacionResponse.totalUmsa ?? 0

    const financieros = [...(financieroResponse.cursos || []), ...(financieroResponse.eventos || [])]
    finanzasResumen.value = financieros
  } catch (error) {
    errorMessage.value = (error as Error).message || 'No se pudo cargar el reporte.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCarreras()
  await loadReportes()
})
</script>
