<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Emitir certificados</h1>
        <p class="text-sm text-slate-500">
          Emision por lote para solicitudes pendientes con plantilla aprobada.
        </p>
      </div>
      <Button variant="outline" size="sm" @click="loadAll">Actualizar</Button>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model.number="selectedCarreraId"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todas</option>
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por actividad o docente"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Solicitudes pendientes</h3>
          <p class="text-sm text-slate-500">Solo se emite si la plantilla esta aprobada.</p>
        </div>
        <Badge v-if="filteredSolicitudes.length > 0" variant="warning" size="sm">
          {{ filteredSolicitudes.length }} pendientes
        </Badge>
      </div>

      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
        Cargando solicitudes...
      </div>
      <div v-else-if="filteredSolicitudes.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay solicitudes pendientes.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actividad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Docente</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Aprobados</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Solicitud</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="solicitud in filteredSolicitudes" :key="solicitud.idSolicitud" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ solicitud.nombreActividad }}</p>
                  <p v-if="solicitud.codigoParalelo" class="text-xs text-slate-500">
                    Paralelo {{ solicitud.codigoParalelo }}
                  </p>
                  <p class="text-xs text-slate-500">{{ solicitud.carreraNombre || 'Sin carrera' }}</p>
                </div>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="solicitud.tipoActividad === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ solicitud.tipoActividad }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ solicitud.nombreDocente || '-' }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ solicitud.cantidadAprobados }}</td>
              <td class="px-4 py-3 text-xs text-slate-500">{{ formatDatetime(solicitud.fechaSolicitud) }}</td>
              <td class="px-4 py-3 text-right">
                <Button
                  size="sm"
                  :loading="processingId === solicitud.idSolicitud"
                  :disabled="!solicitud.canEmit"
                  @click="emitirSolicitud(solicitud)"
                >
                  Emitir lote
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
  paralelos?: Array<Record<string, unknown>>
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
}

interface SolicitudDto {
  idSolicitud: number
  nombreActividad: string
  codigoParalelo: string | null
  nombreDocente: string | null
  cantidadAprobados: number
  estado: string
  fechaSolicitud: string
}

interface SolicitudView extends SolicitudDto {
  tipoActividad: 'CURSO' | 'EVENTO'
  idCurso?: number
  idEvento?: number
  carreraId?: number
  carreraNombre?: string
  canEmit: boolean
}

const alertStore = useAlertStore()

const loading = ref(false)
const processingId = ref<number | null>(null)

const carreras = ref<CarreraDto[]>([])
const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])
const solicitudes = ref<SolicitudDto[]>([])

const selectedCarreraId = ref<number | ''>('')
const searchTerm = ref('')

const solicitudesView = computed((): SolicitudView[] => {
  const cursosByName = new Map(cursos.value.map(c => [c.nombre, c]))
  const eventosByName = new Map(eventos.value.map(e => [e.nombre, e]))

  return solicitudes.value.map(item => {
    const isCurso = Boolean(item.codigoParalelo)
    const curso = isCurso ? cursosByName.get(item.nombreActividad) : undefined
    const evento = !isCurso ? eventosByName.get(item.nombreActividad) : undefined

    const carreraId = isCurso ? curso?.idCarrera : evento?.idCarrera
    const carreraNombre = isCurso
      ? (curso?.nombreCarrera || '')
      : (evento?.nombreCarrera || '')

    return {
      ...item,
      tipoActividad: isCurso ? 'CURSO' : 'EVENTO',
      idCurso: curso?.idCurso,
      idEvento: evento?.idEvento,
      carreraId,
      carreraNombre,
      canEmit: Boolean(isCurso ? curso?.idCurso : evento?.idEvento)
    }
  })
})

const filteredSolicitudes = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  return solicitudesView.value.filter(item => {
    const carreraOk = !selectedCarreraId.value || item.carreraId === selectedCarreraId.value
    const searchOk = !term
      || item.nombreActividad.toLowerCase().includes(term)
      || (item.nombreDocente ?? '').toLowerCase().includes(term)
    return carreraOk && searchOk
  })
})

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
}

const loadCursos = async () => {
  const response = await api.get('/cursos/todos') as CursoDto[]
  cursos.value = response
}

const loadEventos = async () => {
  const response = await api.get('/eventos/todos') as EventoDto[]
  eventos.value = response
}

const loadSolicitudes = async () => {
  const response = await api.get('/evaluaciones/solicitudes') as SolicitudDto[]
  solicitudes.value = response
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes()])
  } finally {
    loading.value = false
  }
}

const ensurePlantillaVigente = async (payload: { idCurso?: number; idEvento?: number }) => {
  if (payload.idCurso) {
    const historial = await api.get(`/plantillas/historial?idCurso=${payload.idCurso}`) as Array<Record<string, unknown>>
    const vigente = historial.some(item => String(item.estado) === 'VIGENTE')
    if (!vigente) {
      throw new Error('No hay plantilla aprobada para este curso.')
    }
    return
  }

  if (payload.idEvento) {
    const historial = await api.get(`/plantillas/historial?idEvento=${payload.idEvento}`) as Array<Record<string, unknown>>
    const vigente = historial.some(item => String(item.estado) === 'VIGENTE')
    if (!vigente) {
      throw new Error('No hay plantilla aprobada para este evento.')
    }
    return
  }

  throw new Error('No se encontro la actividad para emitir.')
}

const emitirSolicitud = async (solicitud: SolicitudView) => {
  if (!solicitud.canEmit) {
    alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' })
    return
  }

  processingId.value = solicitud.idSolicitud
  try {
    await ensurePlantillaVigente({ idCurso: solicitud.idCurso, idEvento: solicitud.idEvento })

    if (solicitud.tipoActividad === 'CURSO') {
      await api.post('/certificados/lote', {
        idCurso: solicitud.idCurso,
        codigoParalelo: solicitud.codigoParalelo
      })
    }

    await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`)

    alertStore.push({
      type: 'success',
      message: 'Emision completada. Los certificados se generaron en lote.'
    })

    solicitudes.value = solicitudes.value.filter(item => item.idSolicitud !== solicitud.idSolicitud)
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo emitir el lote.'
    })
  } finally {
    processingId.value = null
  }
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

onMounted(() => {
  loadAll()
})
</script>
