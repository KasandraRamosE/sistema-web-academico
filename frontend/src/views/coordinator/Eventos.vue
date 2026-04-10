<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Eventos</h1>
        <p class="text-sm text-slate-500">Gestiona eventos y asigna auxiliares.</p>
      </div>
      <Button variant="outline" @click="openCreateEvento">Nuevo evento</Button>
    </div>

    <Card>
      <div class="mb-4 grid gap-3 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Nombre del evento..."
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
          <select
            v-model="estadoFiltro"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div v-if="carreras.length > 1">
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Carrera</label>
          <select
            v-model.number="selectedCarreraId"
            class="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-slate-500">
        Cargando eventos...
      </div>
      <div v-else-if="eventosFiltrados.length === 0" class="py-10 text-center text-sm text-slate-500">
        No hay eventos para esta carrera.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Evento</th>
              <th class="px-4 py-3">Carrera</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="evento in eventosFiltrados" :key="evento.idEvento">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ evento.nombre }}</p>
                <p class="text-xs text-slate-500">{{ evento.cargaHoraria }} horas · {{ evento.modalidad }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ evento.nombreCarrera }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatFecha(evento.fechaHora) }}</td>
              <td class="px-4 py-3">
                <Badge :variant="evento.estado === 'ABIERTO' ? 'success' : 'gray'" size="sm">
                  {{ evento.estado }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" @click="openAuxiliares(evento)">Auxiliares</Button>
                  <Button variant="ghost" size="sm" @click="openEditEvento(evento)">Editar</Button>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:text-rose-700" @click="confirmDeleteEvento(evento)">
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Modal
      :modelValue="showEventoModal"
      :title="editingEvento ? 'Editar evento' : 'Nuevo evento'"
      size="lg"
      @close="closeEventoModal"
    >
      <form class="space-y-4" @submit.prevent="saveEvento">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            v-model="formEvento.nombre"
            type="text"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
          <textarea
            v-model="formEvento.descripcion"
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          ></textarea>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Carrera</label>
            <select
              v-model.number="formEvento.idCarrera"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            >
              <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
            <input
              v-model="formEvento.fechaHora"
              type="datetime-local"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Carga horaria</label>
            <input
              v-model.number="formEvento.cargaHoraria"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Modalidad</label>
            <select
              v-model="formEvento.modalidad"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Cupo maximo</label>
            <input
              v-model.number="formEvento.cupoMaximo"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Costo externo</label>
            <input
              v-model.number="formEvento.costoExterno"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Costo UMSA</label>
            <input
              v-model.number="formEvento.costoUmsa"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Link</label>
          <input
            v-model="formEvento.link"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Estado</label>
          <select
            v-model="formEvento.estado"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" type="button" @click="closeEventoModal">Cancelar</Button>
          <Button type="submit" :loading="saving">Guardar</Button>
        </div>
      </form>
    </Modal>

    <Modal
      :modelValue="showAuxiliaresModal"
      title="Asignar auxiliares"
      size="lg"
      @close="closeAuxiliaresModal"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Buscar auxiliar</label>
          <input
            v-model="auxiliarSearch"
            type="text"
            placeholder="Buscar por nombre o username"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
          <div class="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            <button
              v-for="persona in auxiliaresFiltrados"
              :key="persona.idUsuario"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
              :class="selectedAuxiliar?.idUsuario === persona.idUsuario
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-transparent hover:bg-slate-50'"
              @click="selectAuxiliar(persona)"
            >
              <span>
                <span class="font-medium text-slate-900">{{ persona.nombres }} {{ persona.apellidos }}</span>
                <span class="ml-2 text-xs text-slate-500">{{ persona.username }}</span>
              </span>
              <span class="text-xs text-slate-500">
                {{ persona.roles.includes('AUXILIAR') ? 'Auxiliar' : 'Participante' }}
              </span>
            </button>
            <p v-if="auxiliarSearch.trim() === ''" class="text-center text-xs text-slate-500">
              Escribe para buscar.
            </p>
            <p v-else-if="auxiliaresFiltrados.length === 0" class="text-center text-xs text-slate-500">
              No hay coincidencias.
            </p>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Si seleccionas a un participante, se le asignara el rol AUXILIAR.
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeAuxiliaresModal">Cancelar</Button>
          <Button :loading="savingAuxiliar" @click="assignAuxiliar">Asignar</Button>
        </div>
      </div>
    </Modal>

    <Modal
      :modelValue="showDeleteModal"
      title="Eliminar evento"
      size="md"
      @close="closeDeleteModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Esta accion eliminara el evento y sus inscripciones. Esta seguro de continuar?
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeDeleteModal">Cancelar</Button>
          <Button variant="danger" :loading="deleting" @click="deleteEvento">Eliminar</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'
import { api } from '@/utils/api'
import { useAlertStore } from '@/stores/alert.store'

interface CarreraDto {
  idCarrera: number
  nombre: string
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombreCarrera: string
  nombre: string
  descripcion: string
  cargaHoraria: number
  modalidad: string
  fechaHora: string
  cupoMaximo: number | null
  costoExterno: number
  costoUmsa: number
  estado: string
  link: string
}

interface AuxiliarDto {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

interface ParticipanteDto {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

const alertStore = useAlertStore()
const carreras = ref<CarreraDto[]>([])
const selectedCarreraId = ref<number | null>(null)
const eventos = ref<EventoDto[]>([])
const auxiliares = ref<AuxiliarDto[]>([])
const participantes = ref<ParticipanteDto[]>([])
const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')
const estadoFiltro = ref('')

const showEventoModal = ref(false)
const editingEvento = ref<EventoDto | null>(null)
const editingEstado = ref('')
const formEvento = ref({
  idCarrera: 0,
  nombre: '',
  descripcion: '',
  cargaHoraria: 1,
  modalidad: 'PRESENCIAL',
  fechaHora: '',
  cupoMaximo: null as number | null,
  costoExterno: 0,
  costoUmsa: 0,
  link: '',
  estado: 'ABIERTO'
})

const showAuxiliaresModal = ref(false)
const selectedEvento = ref<EventoDto | null>(null)
const auxiliarSearch = ref('')
const selectedAuxiliar = ref<ParticipanteDto | null>(null)
const savingAuxiliar = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const eventoToDelete = ref<EventoDto | null>(null)

const eventosFiltrados = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return eventos.value.filter(evento => {
    if (selectedCarreraId.value && evento.idCarrera !== selectedCarreraId.value) return false
    if (estadoFiltro.value && evento.estado !== estadoFiltro.value) return false
    if (term && !evento.nombre.toLowerCase().includes(term)) return false
    return true
  })
})

const auxiliaresFiltrados = computed(() => {
  const term = auxiliarSearch.value.trim().toLowerCase()
  if (!term) return []

  const merged = new Map<number, ParticipanteDto>()
  auxiliares.value.forEach(auxiliar => merged.set(auxiliar.idUsuario, auxiliar))
  participantes.value.forEach(participante => {
    if (!merged.has(participante.idUsuario)) {
      merged.set(participante.idUsuario, participante)
    }
  })

  return Array.from(merged.values()).filter(persona => {
    const fullName = `${persona.nombres} ${persona.apellidos}`.toLowerCase()
    return fullName.includes(term) || persona.username.toLowerCase().includes(term)
  })
})

const loadCarreras = async () => {
  const response = await api.get('/coordinador/carreras') as CarreraDto[]
  carreras.value = response
  selectedCarreraId.value = response[0]?.idCarrera ?? null
}

const loadEventos = async () => {
  loading.value = true
  try {
    const response = await api.get('/eventos/todos') as EventoDto[]
    eventos.value = response
  } finally {
    loading.value = false
  }
}

const loadAuxiliares = async () => {
  const response = await api.get('/usuarios/auxiliares') as AuxiliarDto[]
  auxiliares.value = response
}

const loadParticipantes = async () => {
  const response = await api.get('/usuarios/participantes') as ParticipanteDto[]
  participantes.value = response
}

const loadAll = async () => {
  await Promise.all([loadCarreras(), loadEventos(), loadAuxiliares(), loadParticipantes()])
}

const openCreateEvento = () => {
  editingEvento.value = null
  editingEstado.value = ''
  formEvento.value = {
    idCarrera: selectedCarreraId.value || carreras.value[0]?.idCarrera || 0,
    nombre: '',
    descripcion: '',
    cargaHoraria: 1,
    modalidad: 'PRESENCIAL',
    fechaHora: '',
    cupoMaximo: null,
    costoExterno: 0,
    costoUmsa: 0,
    link: '',
    estado: 'ABIERTO'
  }
  showEventoModal.value = true
}

const openEditEvento = (evento: EventoDto) => {
  editingEvento.value = evento
  editingEstado.value = evento.estado
  formEvento.value = {
    idCarrera: evento.idCarrera,
    nombre: evento.nombre,
    descripcion: evento.descripcion || '',
    cargaHoraria: evento.cargaHoraria,
    modalidad: evento.modalidad,
    fechaHora: evento.fechaHora ? evento.fechaHora.slice(0, 16) : '',
    cupoMaximo: evento.cupoMaximo ?? null,
    costoExterno: Number(evento.costoExterno || 0),
    costoUmsa: Number(evento.costoUmsa || 0),
    link: evento.link || '',
    estado: evento.estado
  }
  showEventoModal.value = true
}

const closeEventoModal = () => {
  showEventoModal.value = false
  editingEvento.value = null
  editingEstado.value = ''
}

const saveEvento = async () => {
  saving.value = true
  try {
    const payload = {
      idCarrera: formEvento.value.idCarrera,
      nombre: formEvento.value.nombre,
      descripcion: formEvento.value.descripcion,
      cargaHoraria: formEvento.value.cargaHoraria,
      modalidad: formEvento.value.modalidad,
      fechaHora: formEvento.value.fechaHora,
      cupoMaximo: formEvento.value.cupoMaximo,
      costoExterno: formEvento.value.costoExterno,
      costoUmsa: formEvento.value.costoUmsa,
      link: formEvento.value.link
    }

    if (editingEvento.value) {
      await api.put(`/eventos/${editingEvento.value.idEvento}`, payload)
      if (formEvento.value.estado !== editingEstado.value) {
        await api.patch(`/eventos/${editingEvento.value.idEvento}/estado?estado=${encodeURIComponent(formEvento.value.estado)}`)
      }
      alertStore.push({ type: 'success', message: 'Evento actualizado.' })
    } else {
      await api.post('/eventos', payload)
      alertStore.push({ type: 'success', message: 'Evento creado.' })
    }

    closeEventoModal()
    await loadEventos()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo guardar el evento.' })
  } finally {
    saving.value = false
  }
}

const openAuxiliares = (evento: EventoDto) => {
  selectedEvento.value = evento
  auxiliarSearch.value = ''
  selectedAuxiliar.value = null
  showAuxiliaresModal.value = true
}

const confirmDeleteEvento = (evento: EventoDto) => {
  eventoToDelete.value = evento
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  eventoToDelete.value = null
}

const closeAuxiliaresModal = () => {
  showAuxiliaresModal.value = false
  selectedEvento.value = null
  selectedAuxiliar.value = null
  auxiliarSearch.value = ''
}

const selectAuxiliar = (persona: ParticipanteDto) => {
  selectedAuxiliar.value = persona
}

const assignAuxiliar = async () => {
  if (!selectedEvento.value || !selectedAuxiliar.value) return

  savingAuxiliar.value = true
  try {
    if (!selectedAuxiliar.value.roles.includes('AUXILIAR')) {
      await api.post(`/usuarios/${selectedAuxiliar.value.idUsuario}/roles`, {
        nombreRol: 'AUXILIAR'
      })
      await Promise.all([loadAuxiliares(), loadParticipantes()])
    }

    await api.post(`/eventos/${selectedEvento.value.idEvento}/auxiliares`, {
      idAuxiliar: selectedAuxiliar.value.idUsuario
    })

    alertStore.push({ type: 'success', message: 'Auxiliar asignado.' })
    closeAuxiliaresModal()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo asignar el auxiliar.' })
  } finally {
    savingAuxiliar.value = false
  }
}

const deleteEvento = async () => {
  if (!eventoToDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/eventos/${eventoToDelete.value.idEvento}`)
    alertStore.push({ type: 'success', message: 'Evento eliminado.' })
    closeDeleteModal()
    await loadEventos()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo eliminar el evento.' })
  } finally {
    deleting.value = false
  }
}

const formatFecha = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

onMounted(() => {
  loadAll()
})
</script>
