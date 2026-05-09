<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Plantillas</h1>
      <p class="text-sm text-slate-500">Sube plantillas PDF y solicita revision automaticamente.</p>
    </div>

    <Card>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Mis actividades asignadas</h3>
          <p class="text-sm text-slate-500">Estado de tus plantillas por actividad.</p>
        </div>
        <Badge v-if="actividadesAsignadasFiltradas.length > 0" variant="primary" size="sm">
          {{ actividadesAsignadasFiltradas.length }} actividades
        </Badge>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <div class="md:col-span-2">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="actividadSearch"
            type="text"
            placeholder="Buscar por nombre"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Estado de plantilla</label>
          <select
            v-model="estadoPlantillaFiltro"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="SIN_PLANTILLA">Sin plantilla</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>
      </div>

      <div v-if="loadingActividades" class="py-8 text-center text-sm text-slate-500">
        Cargando actividades...
      </div>
      <div v-else-if="actividadesAsignadasFiltradas.length === 0" class="py-8 text-center text-sm text-slate-500">
        No tienes actividades asignadas.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Actividad</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">Estado actividad</th>
              <th class="px-4 py-3">Estado plantilla</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="actividad in actividadesAsignadasFiltradas" :key="actividad.key" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ actividad.nombre }}</p>
                <p class="text-xs text-slate-500">{{ actividad.carrera }}</p>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="actividad.tipo === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                  {{ actividad.tipo }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="actividad.estadoActividad === 'ABIERTO' ? 'success' : 'gray'" size="sm">
                  {{ actividad.estadoActividad }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="estadoPlantillaBadge(actividad.estadoPlantilla)" size="sm">
                  {{ estadoPlantillaLabel(actividad.estadoPlantilla) }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-right">
                <Button variant="outline" size="sm" @click="openActividadModal(actividad)">
                  Detalle
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>


    <Card>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Mis plantillas</h3>
            <p class="text-sm text-slate-500">Revisa el estado de tus envios.</p>
          </div>
          <Button variant="outline" size="sm" @click="cargarPlantillas">Actualizar</Button>
        </div>

        <div v-if="plantillasRevisadas.length > 0" class="grid gap-3 md:grid-cols-2">
          <div
            v-for="item in plantillasRevisadas"
            :key="item.idPlantilla"
            class="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-800">{{ item.nombreActividad }}</p>
              <Badge :variant="item.estado === 'APROBADA' ? 'success' : 'danger'" size="sm">
                {{ item.estado }}
              </Badge>
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ item.tipoActividad }} · v{{ item.version }}</p>
            <p class="text-xs text-slate-600 mt-2">
              {{ item.ultimaObservacion || 'Sin observaciones.' }}
            </p>
          </div>
        </div>

        <div v-if="cargandoPlantillas" class="py-8 text-center text-sm text-slate-500">
          Cargando plantillas...
        </div>
        <div v-else-if="plantillas.length === 0" class="py-8 text-center text-sm text-slate-500">
          No tienes plantillas registradas.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actividad</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Version</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Observacion</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="plantilla in plantillas" :key="plantilla.idPlantilla" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-sm text-slate-700">{{ plantilla.nombreActividad }}</td>
                <td class="px-4 py-3">
                  <Badge :variant="plantilla.tipoActividad === 'CURSO' ? 'primary' : 'secondary'" size="sm">
                    {{ plantilla.tipoActividad }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">v{{ plantilla.version }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ plantilla.estado }}</td>
                <td class="px-4 py-3 text-xs text-slate-500">
                  {{ plantilla.ultimaObservacion || '-' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" @click="verPlantilla(plantilla)">
                    Ver PDF
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>

    <Modal
      :modelValue="showActividadModal"
      title="Detalle de actividad"
      size="lg"
      @close="closeActividadModal"
    >
      <div v-if="selectedActividad" class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-slate-500">Actividad</p>
          <p class="text-sm font-semibold text-slate-900">{{ selectedActividad.nombre }}</p>
          <p class="text-xs text-slate-500">{{ selectedActividad.tipo }} · {{ selectedActividad.carrera }}</p>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Estado actividad</p>
            <p class="text-sm font-semibold text-slate-900">{{ selectedActividad.estadoActividad }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Estado plantilla</p>
            <p class="text-sm font-semibold text-slate-900">{{ estadoPlantillaLabel(selectedActividad.estadoPlantilla) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Version</p>
            <p class="text-sm text-slate-600">{{ selectedActividad.version ?? '-' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Fecha subida</p>
            <p class="text-sm text-slate-600">{{ formatDateTime(selectedActividad.fechaSubida) }}</p>
          </div>
        </div>

        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">Observaciones</p>
          <p class="text-sm text-slate-600">
            {{ selectedActividad.ultimaObservacion || 'Sin observaciones.' }}
          </p>
        </div>

        <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-emerald-700">Siguiente accion</p>
          <p class="text-sm text-emerald-800">{{ estadoPlantillaHint(selectedActividad.estadoPlantilla) }}</p>
        </div>

        <div v-if="selectedActividad.estadoPlantilla === 'RECHAZADA'" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-rose-700">Correcciones pendientes</p>
          <p class="text-sm text-rose-800">
            {{ selectedActividad.ultimaObservacion || 'Se requieren ajustes en la plantilla.' }}
          </p>
        </div>

        <div class="space-y-3 rounded-lg border border-slate-200 px-4 py-4">
          <div>
            <p class="text-sm font-semibold text-slate-900">Subir plantilla</p>
            <p class="text-xs text-slate-500">
              La plantilla queda en estado pendiente para revision.
            </p>
          </div>

          <div v-if="canUpload">
            <label class="block text-sm font-medium text-slate-700 mb-1">Archivo PDF</label>
            <input
              ref="fileInputRef"
              type="file"
              accept="application/pdf"
              @change="handleFileChange"
              class="hidden"
            />
            <Button variant="outline" size="sm" @click="triggerFilePicker">
              Seleccionar PDF
            </Button>
            <p v-if="archivoNombre" class="text-xs text-slate-500 mt-1">{{ archivoNombre }}</p>
            <p v-if="uploadError" class="text-xs text-rose-600 mt-1">{{ uploadError }}</p>
          </div>
          <div v-else class="text-xs text-slate-500">
            Solo puedes subir una nueva version cuando la plantilla este sin cargar o rechazada.
          </div>

          <div class="flex justify-end">
            <Button :loading="subiendo" :disabled="!canUpload" @click="handleUploadClick">
              Subir plantilla
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'
import { useAuthStore } from '@/stores/auth.store'

interface ActividadItem {
  id: number
  nombre: string
  idDisenador?: number | null
  estado?: string
  carrera?: string
  fecha?: string
}

interface ActividadAsignada {
  key: string
  tipo: 'CURSO' | 'EVENTO'
  id: number
  nombre: string
  estadoActividad: string
  carrera: string
  fecha: string
  estadoPlantilla: 'SIN_PLANTILLA' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  version: number | null
  fechaSubida: string | null
  ultimaObservacion: string | null
}

interface PlantillaDto {
  idPlantilla: number
  idCurso: number | null
  idEvento: number | null
  nombreActividad: string
  tipoActividad: 'CURSO' | 'EVENTO'
  version: number
  estado: string
  ultimaObservacion: string | null
  fechaSubida?: string
}

const alertStore = useAlertStore()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.idUsuario ?? null)

const archivo = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const subiendo = ref(false)

const cursos = ref<ActividadItem[]>([])
const eventos = ref<ActividadItem[]>([])
const plantillas = ref<PlantillaDto[]>([])
const cargandoPlantillas = ref(false)
const loadingActividades = ref(false)

const actividadSearch = ref('')
const estadoPlantillaFiltro = ref('')
const showActividadModal = ref(false)
const selectedActividad = ref<ActividadAsignada | null>(null)

const STATUS_STORAGE_KEY = 'plantillas_status_cache'

const canUpload = computed(() => {
  if (!selectedActividad.value) return false
  return ['SIN_PLANTILLA', 'RECHAZADA'].includes(selectedActividad.value.estadoPlantilla)
})

const uploadError = ref('')

const plantillaMap = computed(() => {
  const map = new Map<string, PlantillaDto>()
  plantillas.value.forEach(plantilla => {
    const key = plantilla.idCurso
      ? `CURSO-${plantilla.idCurso}`
      : plantilla.idEvento
        ? `EVENTO-${plantilla.idEvento}`
        : ''
    if (!key) return

    const existing = map.get(key)
    if (!existing || (plantilla.version ?? 0) > (existing.version ?? 0)) {
      map.set(key, plantilla)
    }
  })
  return map
})

const actividadesAsignadas = computed((): ActividadAsignada[] => {
  const cursosItems = cursos.value.map(curso => buildActividadAsignada('CURSO', curso))
  const eventosItems = eventos.value.map(evento => buildActividadAsignada('EVENTO', evento))
  return [...cursosItems, ...eventosItems]
})

const actividadesAsignadasFiltradas = computed(() => {
  const term = actividadSearch.value.trim().toLowerCase()
  return actividadesAsignadas.value.filter(item => {
    const searchOk = !term || item.nombre.toLowerCase().includes(term)
    const estadoOk = !estadoPlantillaFiltro.value || item.estadoPlantilla === estadoPlantillaFiltro.value
    return searchOk && estadoOk
  })
})

const archivoNombre = computed(() => archivo.value?.name || '')

const plantillasRevisadas = computed(() => {
  return plantillas.value.filter((item) => item.estado !== 'PENDIENTE')
})

const cargarActividades = async () => {
  loadingActividades.value = true
  try {
    const [cursosResponse, eventosResponse] = await Promise.all([
      api.get('/cursos/disenador'),
      api.get('/eventos/disenador')
    ])

    cursos.value = (cursosResponse as Array<Record<string, unknown>>).map(curso => ({
      id: Number(curso.idCurso),
      nombre: String(curso.nombre ?? ''),
      idDisenador: curso.idDisenador ? Number(curso.idDisenador) : null,
      estado: String(curso.estado ?? ''),
      carrera: String(curso.nombreCarrera ?? ''),
      fecha: String(curso.fechaInicio ?? '')
    }))

    eventos.value = (eventosResponse as Array<Record<string, unknown>>).map(evento => ({
      id: Number(evento.idEvento),
      nombre: String(evento.nombre ?? ''),
      idDisenador: evento.idDisenador ? Number(evento.idDisenador) : null,
      estado: String(evento.estado ?? ''),
      carrera: String(evento.nombreCarrera ?? ''),
      fecha: String(evento.fechaHora ?? '')
    }))
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo cargar las actividades.'
    })
    cursos.value = []
    eventos.value = []
  } finally {
    loadingActividades.value = false
  }
}

const cargarPlantillas = async () => {
  cargandoPlantillas.value = true
  try {
    const response = await api.get('/plantillas/mis-plantillas') as PlantillaDto[]
    plantillas.value = response
    notificarCambiosEstado(response)
  } finally {
    cargandoPlantillas.value = false
  }
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  archivo.value = input.files && input.files.length > 0 ? input.files[0] : null
  uploadError.value = ''
}

const triggerFilePicker = () => {
  if (!canUpload.value) return
  fileInputRef.value?.click()
}

const handleUploadClick = () => {
  if (!archivo.value) {
    triggerFilePicker()
    return
  }
  void subirPlantilla()
}

const subirPlantilla = async () => {
  if (!selectedActividad.value) {
    uploadError.value = 'Selecciona una actividad.'
    alertStore.push({ type: 'warning', message: 'Selecciona una actividad.' })
    return
  }
  if (!archivo.value) {
    uploadError.value = 'Selecciona un archivo PDF.'
    alertStore.push({ type: 'warning', message: 'Selecciona un archivo PDF.' })
    return
  }

  subiendo.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', archivo.value)
    if (selectedActividad.value.tipo === 'CURSO') {
      formData.append('idCurso', String(selectedActividad.value.id))
    } else {
      formData.append('idEvento', String(selectedActividad.value.id))
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    const token = localStorage.getItem('token')

    const response = await fetch(`${baseUrl}/plantillas`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const message = data?.message || response.statusText || 'No se pudo subir la plantilla.'
      throw new Error(message)
    }

    alertStore.push({ type: 'success', message: 'Plantilla enviada a revision.' })
    archivo.value = null
    uploadError.value = ''
    await Promise.all([cargarPlantillas(), cargarActividades()])
    const updated = selectedActividad.value
      ? actividadesAsignadas.value.find(item => item.key === selectedActividad.value?.key)
      : null
    if (updated) {
      selectedActividad.value = updated
    }
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo subir la plantilla.' })
  } finally {
    subiendo.value = false
  }
}

const verPlantilla = async (plantilla: PlantillaDto) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    const token = localStorage.getItem('token')

    const response = await fetch(`${baseUrl}/plantillas/${plantilla.idPlantilla}/descargar`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })

    if (!response.ok) {
      throw new Error('No se pudo descargar la plantilla')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo abrir la plantilla.' })
  }
}

const notificarCambiosEstado = (items: PlantillaDto[]) => {
  const cacheRaw = localStorage.getItem(STATUS_STORAGE_KEY)
  const cache = cacheRaw ? JSON.parse(cacheRaw) as Record<string, { estado: string; observacion: string | null }> : {}
  let huboCambio = false

  items.forEach((item) => {
    const key = String(item.idPlantilla)
    const previous = cache[key]
    const current = { estado: item.estado, observacion: item.ultimaObservacion || null }

    if (previous && previous.estado !== current.estado && current.estado !== 'PENDIENTE') {
      const mensaje = current.estado === 'APROBADA'
        ? `Plantilla aprobada: ${item.nombreActividad}.`
        : `Plantilla rechazada: ${item.nombreActividad}. ${current.observacion || 'Revisa las observaciones.'}`
      alertStore.push({ type: current.estado === 'APROBADA' ? 'success' : 'warning', message: mensaje })
      huboCambio = true
    }

    cache[key] = current
  })

  if (huboCambio || !cacheRaw) {
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(cache))
  }
}

const estadoPlantillaLabel = (estado: ActividadAsignada['estadoPlantilla']) => {
  switch (estado) {
    case 'SIN_PLANTILLA':
      return 'Sin plantilla'
    case 'PENDIENTE':
      return 'Pendiente'
    case 'APROBADA':
      return 'Aprobada'
    case 'RECHAZADA':
      return 'Rechazada'
    default:
      return estado
  }
}

const estadoPlantillaBadge = (estado: ActividadAsignada['estadoPlantilla']) => {
  switch (estado) {
    case 'SIN_PLANTILLA':
      return 'warning'
    case 'PENDIENTE':
      return 'secondary'
    case 'APROBADA':
      return 'success'
    case 'RECHAZADA':
      return 'danger'
    default:
      return 'gray'
  }
}

const estadoPlantillaHint = (estado: ActividadAsignada['estadoPlantilla']) => {
  switch (estado) {
    case 'SIN_PLANTILLA':
      return 'Debes subir la primera plantilla.'
    case 'PENDIENTE':
      return 'La plantilla esta en revision.'
    case 'APROBADA':
      return 'La plantilla esta aprobada. No requiere accion.'
    case 'RECHAZADA':
      return 'Revisa las observaciones y sube una nueva version.'
    default:
      return ''
  }
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const buildActividadAsignada = (tipo: 'CURSO' | 'EVENTO', item: ActividadItem): ActividadAsignada => {
  const key = `${tipo}-${item.id}`
  const plantilla = plantillaMap.value.get(key)

  return {
    key,
    tipo,
    id: item.id,
    nombre: item.nombre,
    estadoActividad: item.estado || '-',
    carrera: item.carrera || '-',
    fecha: item.fecha || '',
    estadoPlantilla: (plantilla?.estado as ActividadAsignada['estadoPlantilla']) ?? 'SIN_PLANTILLA',
    version: plantilla?.version ?? null,
    fechaSubida: plantilla?.fechaSubida ?? null,
    ultimaObservacion: plantilla?.ultimaObservacion ?? null
  }
}

const openActividadModal = (actividad: ActividadAsignada) => {
  selectedActividad.value = actividad
  archivo.value = null
  uploadError.value = ''
  showActividadModal.value = true
}

const closeActividadModal = () => {
  selectedActividad.value = null
  showActividadModal.value = false
}

onMounted(async () => {
  await Promise.all([cargarActividades(), cargarPlantillas()])
})
</script>
