<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">Plantillas</h1>
      <p class="text-sm text-slate-500">Sube plantillas PDF y solicita revision automaticamente.</p>
    </div>

    <Card>
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Subir plantilla</h3>
          <p class="text-sm text-slate-500">La plantilla queda en estado pendiente para revision.</p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de actividad</label>
            <select
              v-model="tipoActividad"
              class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            >
              <option value="CURSO">Curso</option>
              <option value="EVENTO">Evento</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">Buscar actividad</label>
            <input
              v-model="busquedaActividad"
              type="text"
              placeholder="Nombre de la actividad"
              class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Actividad</label>
          <select
            v-model.number="actividadSeleccionada"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option :value="null">Seleccionar actividad</option>
            <option v-for="actividad in actividadesFiltradas" :key="actividad.id" :value="actividad.id">
              {{ actividad.nombre }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Archivo PDF</label>
          <input
            type="file"
            accept="application/pdf"
            @change="handleFileChange"
            class="block w-full text-sm text-slate-600"
          />
          <p v-if="archivoNombre" class="text-xs text-slate-500 mt-1">{{ archivoNombre }}</p>
        </div>

        <div class="flex justify-end">
          <Button :loading="subiendo" @click="subirPlantilla">
            Subir plantilla
          </Button>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'

interface ActividadItem {
  id: number
  nombre: string
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
}

const alertStore = useAlertStore()

const tipoActividad = ref<'CURSO' | 'EVENTO'>('CURSO')
const busquedaActividad = ref('')
const actividadSeleccionada = ref<number | null>(null)
const archivo = ref<File | null>(null)
const subiendo = ref(false)

const cursos = ref<ActividadItem[]>([])
const eventos = ref<ActividadItem[]>([])
const plantillas = ref<PlantillaDto[]>([])
const cargandoPlantillas = ref(false)

const STATUS_STORAGE_KEY = 'plantillas_status_cache'

const actividadesFiltradas = computed(() => {
  const term = busquedaActividad.value.trim().toLowerCase()
  const base = tipoActividad.value === 'CURSO' ? cursos.value : eventos.value
  if (!term) return base
  return base.filter(item => item.nombre.toLowerCase().includes(term))
})

const archivoNombre = computed(() => archivo.value?.name || '')

const plantillasRevisadas = computed(() => {
  return plantillas.value.filter((item) => item.estado !== 'PENDIENTE')
})

const cargarActividades = async () => {
  const [cursosResponse, eventosResponse] = await Promise.all([
    api.get('/cursos/todos'),
    api.get('/eventos/todos')
  ])

  cursos.value = (cursosResponse as Array<Record<string, unknown>>).map(curso => ({
    id: Number(curso.idCurso),
    nombre: String(curso.nombre ?? '')
  }))

  eventos.value = (eventosResponse as Array<Record<string, unknown>>).map(evento => ({
    id: Number(evento.idEvento),
    nombre: String(evento.nombre ?? '')
  }))
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
}

const subirPlantilla = async () => {
  if (!actividadSeleccionada.value) {
    alertStore.push({ type: 'warning', message: 'Selecciona una actividad.' })
    return
  }
  if (!archivo.value) {
    alertStore.push({ type: 'warning', message: 'Selecciona un archivo PDF.' })
    return
  }

  subiendo.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', archivo.value)
    if (tipoActividad.value === 'CURSO') {
      formData.append('idCurso', String(actividadSeleccionada.value))
    } else {
      formData.append('idEvento', String(actividadSeleccionada.value))
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
    actividadSeleccionada.value = null
    busquedaActividad.value = ''
    await cargarPlantillas()
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

onMounted(async () => {
  await cargarActividades()
  await cargarPlantillas()
})
</script>
