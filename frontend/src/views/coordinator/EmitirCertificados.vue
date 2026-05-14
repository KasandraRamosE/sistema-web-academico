<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Emitir certificados</h1>
        <p class="text-sm text-slate-500">
          Revisa qué actividades ya fueron emitidas y cuáles están listas para emitir.
        </p>
      </div>
      <Button variant="outline" size="sm" @click="loadAll">Actualizar</Button>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-4">
        <div class="md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por actividad o docente"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</label>
          <select
            v-model="tipoFiltro"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="CURSO">Curso</option>
            <option value="EVENTO">Evento</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select
            v-model="estadoFiltro"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="LISTO">Listo para emitir</option>
            <option value="NO_EMITIDO">No emitido</option>
            <option value="EMITIDO">Emitido</option>
          </select>
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Actividades de certificados</h3>
          <p class="text-sm text-slate-500">Un solo listado con el estado real de emisión para cursos y eventos.</p>
        </div>
        <Badge variant="primary" size="sm">
          {{ filteredActivities.length }} resultados
        </Badge>
      </div>

      <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
        Cargando actividades...
      </div>
      <div v-else-if="filteredActivities.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay actividades que coincidan con los filtros.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actividad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Detalle</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="item in filteredActivities" :key="item.key" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <p class="text-sm font-semibold text-slate-800">{{ item.nombre }}</p>
                <p class="text-xs text-slate-500">{{ item.carreraNombre || 'Sin carrera' }}</p>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="item.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ item.tipo }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="estadoBadge(item.estado)" size="sm">
                  {{ estadoLabel(item.estado) }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">
                <div v-if="item.tipo === 'CURSO'">
                  <p>Docente: {{ item.nombreDocente || '-' }}</p>
                  <p>Aprobados: {{ item.cantidadAprobados ?? '-' }}</p>
                  <p>Solicitud: {{ item.fechaSolicitud ? formatDatetime(item.fechaSolicitud) : '-' }}</p>
                </div>
                <div v-else>
                  <p>Fecha evento: {{ item.fechaEvento ? formatDatetime(item.fechaEvento) : '-' }}</p>
                  <p>Plantilla: {{ item.templateVigente ? 'Aprobada' : 'Sin aprobar' }}</p>
                  <p>Emitidos: {{ item.certificadosEmitidos ?? 0 }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  v-if="item.canEmit"
                  size="sm"
                  :loading="processingKey === item.key"
                  @click="item.tipo === 'CURSO' ? emitirCurso(item) : emitirEvento(item)"
                >
                  Emitir
                </Button>
                <Button v-else-if="item.estado === 'EMITIDO'" variant="outline" size="sm" disabled>
                  Ya emitido
                </Button>
                <Button v-else variant="outline" size="sm" disabled>
                  No disponible
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
  fechaHora?: string
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
  templateVigente?: boolean
}

interface ActivityRow {
  key: string
  tipo: 'CURSO' | 'EVENTO'
  nombre: string
  carreraNombre: string
  estado: 'LISTO' | 'NO_EMITIDO' | 'EMITIDO'
  canEmit: boolean
  idCurso?: number
  idEvento?: number
  idSolicitud?: number
  codigoParalelo?: string | null
  nombreDocente?: string | null
  cantidadAprobados?: number | null
  fechaSolicitud?: string | null
  fechaEvento?: string | null
  templateVigente?: boolean
  certificadosEmitidos?: number
}

const alertStore = useAlertStore()

const loading = ref(false)
const processingKey = ref<string | null>(null)

const carreras = ref<CarreraDto[]>([])
const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])
const solicitudes = ref<SolicitudDto[]>([])
const plantillasVigentesCursos = ref<Record<number, boolean>>({})
const plantillasVigentesEventos = ref<Record<number, boolean>>({})
const certificados = ref<Array<Record<string, unknown>>>([])

const searchTerm = ref('')
const tipoFiltro = ref('')
const estadoFiltro = ref('')

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
      canEmit: Boolean(isCurso ? curso?.idCurso : evento?.idEvento),
      templateVigente: isCurso
        ? Boolean(curso?.idCurso && plantillasVigentesCursos.value[curso.idCurso])
        : Boolean(evento?.idEvento && plantillasVigentesEventos.value[evento.idEvento])
    }
  })
})

const certificadosEmitidosMap = computed(() => {
  const map = new Map<string, number>()
  certificados.value.forEach((certificado) => {
    if (String(certificado.estadoEmision) !== 'GENERADO') return
    const key = `${String(certificado.tipoActividad || '')}-${String(certificado.nombreActividad || '')}`
    map.set(key, (map.get(key) || 0) + 1)
  })
  return map
})

const solicitudCursoMap = computed(() => {
  const map = new Map<string, SolicitudView>()
  solicitudesView.value
    .filter(item => item.tipoActividad === 'CURSO')
    .forEach((item) => {
      map.set(item.nombreActividad, item)
    })
  return map
})

const activities = computed((): ActivityRow[] => {
  const cursosRows = cursos.value.map((curso) => {
    const solicitud = solicitudCursoMap.value.get(curso.nombre)
    const key = `CURSO-${curso.nombre}`
    const emittedCount = certificadosEmitidosMap.value.get(key) || 0
    const templateVigente = Boolean(plantillasVigentesCursos.value[curso.idCurso])
    const estado: ActivityRow['estado'] = emittedCount > 0
      ? 'EMITIDO'
      : solicitud && templateVigente
        ? 'LISTO'
        : 'NO_EMITIDO'

    return {
      key,
      tipo: 'CURSO' as const,
      nombre: curso.nombre,
      carreraNombre: curso.nombreCarrera || 'Sin carrera',
      estado,
      canEmit: estado === 'LISTO',
      idCurso: curso.idCurso,
      idEvento: undefined,
      idSolicitud: solicitud?.idSolicitud,
      codigoParalelo: solicitud?.codigoParalelo ?? null,
      nombreDocente: solicitud?.nombreDocente ?? null,
      cantidadAprobados: solicitud?.cantidadAprobados ?? null,
      fechaSolicitud: solicitud?.fechaSolicitud ?? null,
      fechaEvento: undefined,
      templateVigente,
      certificadosEmitidos: emittedCount
    }
  })

  const eventosRows = eventos.value.map(evento => {
    const key = `EVENTO-${evento.nombre}`
    const emittedCount = certificadosEmitidosMap.value.get(key) || 0
    const templateVigente = Boolean(plantillasVigentesEventos.value[evento.idEvento])
    const fechaPasada = evento.fechaHora ? new Date(evento.fechaHora) <= new Date() : false
    const estado: ActivityRow['estado'] = emittedCount > 0
      ? 'EMITIDO'
      : templateVigente && fechaPasada
        ? 'LISTO'
        : 'NO_EMITIDO'

    return {
      key,
      tipo: 'EVENTO' as const,
      nombre: evento.nombre,
      carreraNombre: evento.nombreCarrera || 'Sin carrera',
      estado,
      canEmit: estado === 'LISTO',
      idCurso: undefined,
      idEvento: evento.idEvento,
      idSolicitud: undefined,
      codigoParalelo: undefined,
      nombreDocente: undefined,
      cantidadAprobados: undefined,
      fechaSolicitud: undefined,
      fechaEvento: evento.fechaHora,
      templateVigente,
      certificadosEmitidos: emittedCount
    }
  })

  return [...cursosRows, ...eventosRows]
})

const filteredActivities = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  return activities.value.filter(item => {
    const searchOk = !term
      || item.nombre.toLowerCase().includes(term)
      || (item.nombreDocente ?? '').toLowerCase().includes(term)
      || item.carreraNombre.toLowerCase().includes(term)
    const tipoOk = !tipoFiltro.value || item.tipo === tipoFiltro.value
    const estadoOk = !estadoFiltro.value || item.estado === estadoFiltro.value
    return searchOk && tipoOk && estadoOk
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

const loadCertificados = async () => {
  const response = await api.get('/certificados/admin') as Array<Record<string, unknown>>
  certificados.value = response
}

const loadPlantillasVigentes = async () => {
  const cursoPairs = await Promise.all(cursos.value.map(async curso => {
    try {
      const historial = await api.get(`/plantillas/historial?idCurso=${curso.idCurso}`) as Array<Record<string, unknown>>
      return [curso.idCurso, historial.some(item => String(item.estado) === 'VIGENTE')] as const
    } catch {
      return [curso.idCurso, false] as const
    }
  }))

  const eventoPairs = await Promise.all(eventos.value.map(async evento => {
    try {
      const historial = await api.get(`/plantillas/historial?idEvento=${evento.idEvento}`) as Array<Record<string, unknown>>
      return [evento.idEvento, historial.some(item => String(item.estado) === 'VIGENTE')] as const
    } catch {
      return [evento.idEvento, false] as const
    }
  }))

  plantillasVigentesCursos.value = Object.fromEntries(cursoPairs)
  plantillasVigentesEventos.value = Object.fromEntries(eventoPairs)
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes(), loadCertificados()])
    await loadPlantillasVigentes()
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

const emitirCurso = async (item: ActivityRow) => {
  if (!item || !item.canEmit || item.tipo !== 'CURSO') {
    alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' })
    return
  }

  processingKey.value = item.key
  try {
    await ensurePlantillaVigente({ idCurso: item.idCurso, idEvento: item.idEvento })

    await api.post('/certificados/lote', {
      idCurso: item.idCurso,
      codigoParalelo: item.codigoParalelo
    })

    if (item.idSolicitud) {
      await api.patch(`/evaluaciones/solicitudes/${item.idSolicitud}?estado=COMPLETADO`)
    }

    alertStore.push({
      type: 'success',
      message: 'Emision completada. Los certificados se generaron en lote.'
    })

    await loadAll()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo emitir el lote.'
    })
  } finally {
    processingKey.value = null
  }
}

const emitirEvento = async (item: ActivityRow) => {
  if (!item || !item.canEmit || item.tipo !== 'EVENTO' || !item.idEvento) {
    alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' })
    return
  }

  processingKey.value = item.key
  try {
    const solicitud = await api.post(`/evaluaciones/solicitudes/evento/${item.idEvento}`, {
      notas: 'Generada desde el panel de emisión'
    }) as { idSolicitud: number }

    await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`)

    alertStore.push({
      type: 'success',
      message: `Certificados de ${item.nombre} emitidos correctamente.`
    })

    await loadAll()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo emitir el evento.'
    })
  } finally {
    processingKey.value = null
  }
}

const estadoLabel = (estado: ActivityRow['estado']) => {
  switch (estado) {
    case 'LISTO':
      return 'Listo para emitir'
    case 'EMITIDO':
      return 'Emitido'
    case 'NO_EMITIDO':
      return 'No emitido'
    default:
      return estado
  }
}

const estadoBadge = (estado: ActivityRow['estado']) => {
  switch (estado) {
    case 'LISTO':
      return 'warning'
    case 'EMITIDO':
      return 'success'
    case 'NO_EMITIDO':
      return 'gray'
    default:
      return 'gray'
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
