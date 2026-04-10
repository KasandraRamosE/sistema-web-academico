<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Inscritos</h1>
        <p class="text-sm text-slate-500">Consulta inscritos y sus notas o asistencias (solo lectura).</p>
      </div>
    </div>

    <Card>
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model.number="selectedCarreraId"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option v-if="carreras.length === 0" :value="null">Sin carreras</option>
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          class="rounded-full px-4 py-2 text-sm font-medium"
          :class="activeTab === 'cursos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
          @click="activeTab = 'cursos'"
        >
          Cursos
        </button>
        <button
          class="rounded-full px-4 py-2 text-sm font-medium"
          :class="activeTab === 'eventos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
          @click="activeTab = 'eventos'"
        >
          Eventos
        </button>
      </div>
    </Card>

    <Card v-if="activeTab === 'cursos'">
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Cursos - inscritos y notas</h3>
          <p class="text-sm text-slate-500">Selecciona un paralelo para ver las notas registradas.</p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-slate-700 mb-1">Paralelo</label>
            <div class="relative">
              <input
                v-model="searchParalelo"
                type="text"
                placeholder="Escribe para buscar un paralelo"
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
                @focus="showParaleloOptions = true"
                @blur="hideParaleloOptions"
              />
              <div
                v-if="showParaleloOptions && paralelosFiltrados.length > 0"
                class="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto"
              >
                <button
                  v-for="paralelo in paralelosFiltrados"
                  :key="paralelo.idParalelo"
                  class="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  @mousedown.prevent="selectParalelo(paralelo)"
                >
                  {{ paralelo.actividadNombre }} - Paralelo {{ paralelo.codigo }}
                  ({{ paralelo.carreraNombre }}) - {{ paralelo.inscritos }} inscritos
                </button>
              </div>
              <div
                v-else-if="showParaleloOptions && searchParalelo.length > 0"
                class="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                <p class="px-4 py-2 text-sm text-slate-500">Sin coincidencias.</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="paraleloSeleccionado && infoParalelo" class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p class="text-xs text-emerald-600">Curso</p>
              <p class="font-medium text-slate-800">{{ infoParalelo.actividadNombre }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Paralelo</p>
              <p class="font-medium text-slate-800">{{ infoParalelo.codigo }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Carrera</p>
              <p class="font-medium text-slate-800">{{ infoParalelo.carreraNombre }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Nota mínima</p>
              <p class="font-medium text-slate-800">{{ infoParalelo.notaMinima }} / 100</p>
            </div>
          </div>
        </div>

        <div v-if="!paraleloSeleccionado" class="py-8 text-center text-sm text-slate-500">
          Selecciona un paralelo para ver los inscritos.
        </div>
        <div v-else-if="loadingNotas" class="py-8 text-center text-sm text-slate-500">
          Cargando notas...
        </div>
        <div v-else-if="participantesCurso.length === 0" class="py-8 text-center text-sm text-slate-500">
          No hay inscritos para este paralelo.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Participante</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">RU/Username</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Nota</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Registro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="(item, index) in participantesCurso" :key="item.idEvaluacion" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm text-slate-600">{{ index + 1 }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-slate-800">{{ item.nombres }} {{ item.apellidos }}</p>
                    <p class="text-xs text-slate-500">{{ item.email || '-' }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ item.username }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="item.notaFinal !== null"
                    class="text-lg font-semibold"
                    :class="getNotaColor(item.notaFinal, infoParalelo?.notaMinima || 51)"
                  >
                    {{ item.notaFinal }}
                  </span>
                  <span v-else class="text-sm text-slate-400">-</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <Badge v-if="item.estado" :variant="item.estado === 'APROBADO' ? 'success' : 'danger'">
                    {{ item.estado }}
                  </Badge>
                  <Badge v-else variant="warning">PENDIENTE</Badge>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ formatDatetime(item.fechaRegistro) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>

    <Card v-else>
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Eventos - inscritos y asistencia</h3>
          <p class="text-sm text-slate-500">Selecciona un evento para ver asistencia registrada.</p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-slate-700 mb-1">Evento</label>
            <div class="relative">
              <input
                v-model="searchEvento"
                type="text"
                placeholder="Escribe para buscar un evento"
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
                @focus="showEventoOptions = true"
                @blur="hideEventoOptions"
              />
              <div
                v-if="showEventoOptions && eventosFiltrados.length > 0"
                class="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto"
              >
                <button
                  v-for="evento in eventosFiltrados"
                  :key="evento.idEvento"
                  class="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  @mousedown.prevent="selectEvento(evento)"
                >
                  {{ evento.nombre }} ({{ formatDate(evento.fechaInicio) }})
                </button>
              </div>
              <div
                v-else-if="showEventoOptions && searchEvento.length > 0"
                class="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                <p class="px-4 py-2 text-sm text-slate-500">Sin coincidencias.</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="eventoSeleccionado && infoEvento" class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p class="text-xs text-emerald-600">Evento</p>
              <p class="font-medium text-slate-800">{{ infoEvento.nombre }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Fecha</p>
              <p class="font-medium text-slate-800">{{ formatDate(infoEvento.fechaInicio) }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Inscritos</p>
              <p class="font-medium text-slate-800">{{ asistencias.length }}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-600">Asistieron</p>
              <p class="font-medium text-slate-800">{{ asistenciasRegistradas }}</p>
            </div>
          </div>
        </div>

        <div v-if="!eventoSeleccionado" class="py-8 text-center text-sm text-slate-500">
          Selecciona un evento para ver los inscritos.
        </div>
        <div v-else-if="loadingAsistencias" class="py-8 text-center text-sm text-slate-500">
          Cargando asistencias...
        </div>
        <div v-else-if="asistencias.length === 0" class="py-8 text-center text-sm text-slate-500">
          No hay inscritos para este evento.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Participante</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">RU/Username</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Asistencia</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Registro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="(item, index) in asistencias" :key="item.idInscripcion" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm text-slate-600">{{ index + 1 }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-slate-800">{{ item.nombres }} {{ item.apellidos }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ item.username }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ item.email }}</td>
                <td class="px-4 py-3 text-center">
                  <Badge :variant="item.asistio ? 'success' : 'danger'" size="sm">
                    {{ item.asistio ? 'ASISTIO' : 'NO ASISTIO' }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ formatDatetime(item.fechaRegistro) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import { api } from '@/utils/api'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  nombreCarrera?: string
  notaAprobacion?: number
  paralelos?: Array<Record<string, unknown>>
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  fechaInicio?: string
  fechaHora?: string
  inscritos?: number
}

interface ParaleloItem {
  idParalelo: string
  codigo: string
  idCurso: number
  actividadNombre: string
  idCarrera: number
  carreraNombre: string
  inscritos: number
  notaMinima: number
}

interface EvaluacionItem {
  idEvaluacion: number
  idInscripcion: number
  nombres: string
  apellidos: string
  email: string
  username: string
  notaFinal: number | null
  estado: string | null
  fechaRegistro: string
}

interface AsistenciaItem {
  idInscripcion: number
  nombres: string
  apellidos: string
  email: string
  username: string
  asistio: boolean
  fechaRegistro: string
}

const activeTab = ref<'cursos' | 'eventos'>('cursos')

const carreras = ref<CarreraDto[]>([])
const selectedCarreraId = ref<number | null>(null)

const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])

const searchParalelo = ref('')
const showParaleloOptions = ref(false)
const paralelosDisponibles = ref<ParaleloItem[]>([])
const paraleloSeleccionado = ref<string | null>(null)
const infoParalelo = ref<ParaleloItem | null>(null)
const participantesCurso = ref<EvaluacionItem[]>([])
const loadingNotas = ref(false)

const searchEvento = ref('')
const showEventoOptions = ref(false)
const eventoSeleccionado = ref<number | null>(null)
const infoEvento = ref<EventoDto | null>(null)
const asistencias = ref<AsistenciaItem[]>([])
const loadingAsistencias = ref(false)

const hideParaleloOptions = () => {
  setTimeout(() => { showParaleloOptions.value = false }, 150)
}

const hideEventoOptions = () => {
  setTimeout(() => { showEventoOptions.value = false }, 150)
}

const paralelosFiltrados = computed(() => {
  const term = searchParalelo.value.trim().toLowerCase()
  const carreraId = selectedCarreraId.value

  return paralelosDisponibles.value.filter(p => {
    const carreraOk = !carreraId || p.idCarrera === carreraId
    const searchOk = !term
      || p.actividadNombre.toLowerCase().includes(term)
      || p.codigo.toLowerCase().includes(term)
    return carreraOk && searchOk
  })
})

const eventosFiltrados = computed(() => {
  const term = searchEvento.value.trim().toLowerCase()
  const carreraId = selectedCarreraId.value

  return eventos.value.filter(evento => {
    const carreraOk = !carreraId || evento.idCarrera === carreraId
    const searchOk = !term || evento.nombre.toLowerCase().includes(term)
    return carreraOk && searchOk
  })
})

const asistenciasRegistradas = computed(() => {
  return asistencias.value.filter(item => item.asistio).length
})

const selectParalelo = (paralelo: ParaleloItem) => {
  paraleloSeleccionado.value = paralelo.idParalelo
  searchParalelo.value = `${paralelo.actividadNombre} - Paralelo ${paralelo.codigo}`
  showParaleloOptions.value = false
}

const selectEvento = (evento: EventoDto) => {
  eventoSeleccionado.value = evento.idEvento
  searchEvento.value = evento.nombre
  showEventoOptions.value = false
}

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
  selectedCarreraId.value = response[0]?.idCarrera ?? null
}

const loadCursos = async () => {
  const response = await api.get('/cursos/todos') as CursoDto[]
  cursos.value = response
  buildParalelos()
}

const loadEventos = async () => {
  const response = await api.get('/eventos/todos') as EventoDto[]
  eventos.value = response
}

const buildParalelos = () => {
  const term = searchParalelo.value.trim().toLowerCase()
  const carreraId = selectedCarreraId.value
  const selectedId = paraleloSeleccionado.value
  const selectedCursoId = selectedId ? Number(selectedId.split('-')[0]) : null
  const selectedCodigo = selectedId ? selectedId.split('-')[1] : null
  const paralelos: ParaleloItem[] = []

  cursos.value.forEach(curso => {
    const idCurso = Number(curso.idCurso ?? 0)
    const nombreCurso = String(curso.nombre ?? '')
    const idCarrera = Number(curso.idCarrera ?? 0)
    const carreraNombre = String(curso.nombreCarrera ?? '')
    const notaMinima = Number(curso.notaAprobacion ?? 51)

    if (carreraId && idCarrera !== carreraId) return

    const paralelosCurso = Array.isArray(curso.paralelos) ? curso.paralelos : []

    paralelosCurso.forEach(paralelo => {
      const codigo = String(paralelo.codigo ?? '')
      const inscritos = Number(paralelo.inscritos ?? 0)
      const matchTerm = !term
        || nombreCurso.toLowerCase().includes(term)
        || codigo.toLowerCase().includes(term)
      const keepSelected = selectedCursoId === idCurso && selectedCodigo === codigo

      if (!matchTerm && !keepSelected) return

      paralelos.push({
        idParalelo: `${idCurso}-${codigo}`,
        codigo,
        idCurso,
        actividadNombre: nombreCurso,
        idCarrera,
        carreraNombre,
        inscritos,
        notaMinima
      })
    })
  })

  paralelosDisponibles.value = paralelos

  if (paraleloSeleccionado.value) {
    const stillExists = paralelos.some(p => p.idParalelo === paraleloSeleccionado.value)
    if (!stillExists) {
      paraleloSeleccionado.value = null
      participantesCurso.value = []
      infoParalelo.value = null
      searchParalelo.value = ''
    }
  }
}

const loadNotas = async () => {
  if (!paraleloSeleccionado.value) return

  loadingNotas.value = true
  try {
    infoParalelo.value = paralelosDisponibles.value.find(
      p => p.idParalelo === paraleloSeleccionado.value
    ) || null

    if (!infoParalelo.value) return

    const [idCursoStr, codigo] = infoParalelo.value.idParalelo.split('-')
    const idCurso = Number(idCursoStr)

    const response = await api.get(`/evaluaciones/paralelo/${idCurso}/${codigo}`)
    const items = response as Array<Record<string, unknown>>

    participantesCurso.value = items.map(item => {
      const nombreParticipante = String(item.nombreParticipante ?? '')
      const nombreParts = nombreParticipante.split(' ')
      const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante
      const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : ''

      return {
        idEvaluacion: Number(item.idEvaluacion ?? 0),
        idInscripcion: Number(item.idInscripcion ?? 0),
        nombres,
        apellidos,
        email: String(item.email ?? ''),
        username: String(item.username ?? ''),
        notaFinal: item.notaFinal !== undefined && item.notaFinal !== null
          ? Number(item.notaFinal)
          : null,
        estado: item.estado ? String(item.estado) : null,
        fechaRegistro: String(item.fechaRegistro ?? '')
      }
    })
  } finally {
    loadingNotas.value = false
  }
}

const loadAsistencias = async () => {
  if (!eventoSeleccionado.value) return

  loadingAsistencias.value = true
  try {
    infoEvento.value = eventos.value.find(e => e.idEvento === eventoSeleccionado.value) || null

    const response = await api.get(`/asistencias/evento/${eventoSeleccionado.value}/detalle`)
    const items = response as Array<Record<string, unknown>>

    asistencias.value = items.map(item => {
      const nombreParticipante = String(item.nombreParticipante ?? '')
      const nombreParts = nombreParticipante.split(' ')
      const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante
      const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : ''

      return {
        idInscripcion: Number(item.idInscripcion ?? 0),
        nombres,
        apellidos,
        email: String(item.email ?? ''),
        username: String(item.username ?? ''),
        asistio: Boolean(item.asistio),
        fechaRegistro: String(item.fechaRegistro ?? '')
      }
    })
  } finally {
    loadingAsistencias.value = false
  }
}

const loadAll = async () => {
  await Promise.all([loadCarreras(), loadCursos(), loadEventos()])
}

const getNotaColor = (nota: number | null, notaMinima: number) => {
  if (nota === null) return 'text-slate-400'
  return nota >= notaMinima ? 'text-emerald-600' : 'text-rose-600'
}

const formatDate = (date: string | undefined) => {
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

watch(selectedCarreraId, () => {
  buildParalelos()
})

watch(searchParalelo, () => {
  buildParalelos()
  if (searchParalelo.value.length > 0) {
    showParaleloOptions.value = true
  }
})

watch(paraleloSeleccionado, value => {
  if (value) loadNotas()
})

watch(eventoSeleccionado, value => {
  if (value) loadAsistencias()
})

watch(activeTab, tab => {
  if (tab === 'cursos') {
    eventoSeleccionado.value = null
    asistencias.value = []
    searchEvento.value = ''
    showEventoOptions.value = false
  } else {
    paraleloSeleccionado.value = null
    participantesCurso.value = []
    infoParalelo.value = null
    searchParalelo.value = ''
    showParaleloOptions.value = false
  }
})

onMounted(() => {
  loadAll()
})
</script>