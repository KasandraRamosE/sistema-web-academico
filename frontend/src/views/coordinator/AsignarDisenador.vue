<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Asignacion de disenadores</h1>
        <p class="text-sm text-slate-500">Asigna un disenador para certificados por actividad.</p>
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
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar cursos</label>
          <input
            v-model="cursoSearch"
            type="text"
            placeholder="Nombre del curso"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar eventos</label>
          <input
            v-model="eventoSearch"
            type="text"
            placeholder="Nombre del evento"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Cursos</h3>
          <p class="text-sm text-slate-500">Asignacion de disenador para cursos.</p>
        </div>
        <Badge v-if="cursosFiltrados.length > 0" variant="primary" size="sm">
          {{ cursosFiltrados.length }} cursos
        </Badge>
      </div>

      <div v-if="loadingCursos" class="py-8 text-center text-sm text-slate-500">
        Cargando cursos...
      </div>
      <div v-else-if="cursosFiltrados.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay cursos para mostrar.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Curso</th>
              <th class="px-4 py-3">Disenador</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="curso in cursosFiltrados" :key="curso.idCurso">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ curso.nombre }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">
                {{ curso.nombreDisenador || 'Sin asignar' }}
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  @click="openDesignerModal('CURSO', curso.idCurso, curso.nombre, curso.idDisenador, curso.nombreDisenador)"
                >
                  Asignar
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Eventos</h3>
          <p class="text-sm text-slate-500">Asignacion de disenador para eventos.</p>
        </div>
        <Badge v-if="eventosFiltrados.length > 0" variant="secondary" size="sm">
          {{ eventosFiltrados.length }} eventos
        </Badge>
      </div>

      <div v-if="loadingEventos" class="py-8 text-center text-sm text-slate-500">
        Cargando eventos...
      </div>
      <div v-else-if="eventosFiltrados.length === 0" class="py-8 text-center text-sm text-slate-500">
        No hay eventos para mostrar.
      </div>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Evento</th>
              <th class="px-4 py-3">Disenador</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="evento in eventosFiltrados" :key="evento.idEvento">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ evento.nombre }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">
                {{ evento.nombreDisenador || 'Sin asignar' }}
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  @click="openDesignerModal('EVENTO', evento.idEvento, evento.nombre, evento.idDisenador, evento.nombreDisenador)"
                >
                  Asignar
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Modal
      :modelValue="showDesignerModal"
      title="Asignar disenador"
      size="lg"
      @close="closeDesignerModal"
    >
      <div v-if="assigningActivity" class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-slate-500">Actividad</p>
          <p class="text-sm font-semibold text-slate-900">{{ assigningActivity.nombre }}</p>
          <p class="text-xs text-slate-500">{{ assigningActivity.tipo }}</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Buscar disenador</label>
          <input
            v-model="designerSearch"
            type="text"
            placeholder="Buscar por nombre o username"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
          <div class="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            <button
              v-for="persona in designersFiltrados"
              :key="persona.idUsuario"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
              :class="selectedDesigner?.idUsuario === persona.idUsuario
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-transparent hover:bg-slate-50'"
              @click="selectDesigner(persona)"
            >
              <span>
                <span class="font-medium text-slate-900">{{ persona.nombres }} {{ persona.apellidos }}</span>
                <span class="ml-2 text-xs text-slate-500">{{ persona.username }}</span>
              </span>
              <span class="text-xs text-slate-500">
                {{ isDesigner(persona.roles) ? 'Disenador' : 'Participante' }}
              </span>
            </button>
            <p v-if="designerSearch.trim() === ''" class="text-center text-xs text-slate-500">
              Escribe para buscar.
            </p>
            <p v-else-if="designersFiltrados.length === 0" class="text-center text-xs text-slate-500">
              No hay coincidencias.
            </p>
          </div>
          <p v-if="loadingDesigners || loadingParticipantes" class="mt-1 text-xs text-slate-500">
            Cargando personas...
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Si seleccionas a un participante, se le asignara el rol DISENADOR.
          </p>
          <p v-if="assigningActivity.nombreDisenador" class="mt-1 text-xs text-slate-500">
            Actual: {{ assigningActivity.nombreDisenador }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeDesignerModal">Cancelar</Button>
          <Button :loading="savingDesigner" @click="assignDesigner">Guardar</Button>
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

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombre: string
  idDisenador?: number | null
  nombreDisenador?: string | null
}

interface EventoDto {
  idEvento: number
  idCarrera: number
  nombre: string
  idDisenador?: number | null
  nombreDisenador?: string | null
}

interface PersonaDto {
  idUsuario: number
  username: string
  nombres: string
  apellidos: string
  roles: string[]
}

interface AssigningActivity {
  tipo: 'CURSO' | 'EVENTO'
  id: number
  nombre: string
  idDisenador: number | null
  nombreDisenador: string | null
}

const alertStore = useAlertStore()

const carreras = ref<CarreraDto[]>([])
const selectedCarreraId = ref<number | ''>('')

const cursos = ref<CursoDto[]>([])
const eventos = ref<EventoDto[]>([])
const designers = ref<PersonaDto[]>([])
const participantes = ref<PersonaDto[]>([])

const loadingCursos = ref(false)
const loadingEventos = ref(false)
const loadingDesigners = ref(false)
const loadingParticipantes = ref(false)
const savingDesigner = ref(false)

const cursoSearch = ref('')
const eventoSearch = ref('')
const designerSearch = ref('')

const showDesignerModal = ref(false)
const assigningActivity = ref<AssigningActivity | null>(null)
const selectedDesigner = ref<PersonaDto | null>(null)

const cursosFiltrados = computed(() => {
  const term = cursoSearch.value.trim().toLowerCase()
  return cursos.value.filter(curso => {
    const carreraOk = !selectedCarreraId.value || curso.idCarrera === selectedCarreraId.value
    const searchOk = !term || curso.nombre.toLowerCase().includes(term)
    return carreraOk && searchOk
  })
})

const eventosFiltrados = computed(() => {
  const term = eventoSearch.value.trim().toLowerCase()
  return eventos.value.filter(evento => {
    const carreraOk = !selectedCarreraId.value || evento.idCarrera === selectedCarreraId.value
    const searchOk = !term || evento.nombre.toLowerCase().includes(term)
    return carreraOk && searchOk
  })
})

const designersFiltrados = computed(() => {
  const term = designerSearch.value.trim().toLowerCase()
  if (!term) return []

  const merged = new Map<number, PersonaDto>()
  designers.value.forEach(disenador => merged.set(disenador.idUsuario, disenador))
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
}

const loadCursos = async () => {
  loadingCursos.value = true
  try {
    const response = await api.get('/cursos/todos') as CursoDto[]
    cursos.value = response
  } finally {
    loadingCursos.value = false
  }
}

const loadEventos = async () => {
  loadingEventos.value = true
  try {
    const response = await api.get('/eventos/todos') as EventoDto[]
    eventos.value = response
  } finally {
    loadingEventos.value = false
  }
}

const loadDesigners = async () => {
  loadingDesigners.value = true
  try {
    const response = await api.get('/usuarios/disenadores') as PersonaDto[]
    designers.value = response
  } finally {
    loadingDesigners.value = false
  }
}

const loadParticipantes = async () => {
  loadingParticipantes.value = true
  try {
    const response = await api.get('/usuarios/participantes') as PersonaDto[]
    participantes.value = response
  } finally {
    loadingParticipantes.value = false
  }
}

const loadAll = async () => {
  await Promise.all([
    loadCarreras(),
    loadCursos(),
    loadEventos(),
    loadDesigners(),
    loadParticipantes()
  ])
}

const openDesignerModal = (
  tipo: AssigningActivity['tipo'],
  id: number,
  nombre: string,
  idDisenador?: number | null,
  nombreDisenador?: string | null
) => {
  assigningActivity.value = {
    tipo,
    id,
    nombre,
    idDisenador: idDisenador ?? null,
    nombreDisenador: nombreDisenador ?? null
  }
  designerSearch.value = ''
  selectedDesigner.value = null
  showDesignerModal.value = true
}

const closeDesignerModal = () => {
  showDesignerModal.value = false
  assigningActivity.value = null
  selectedDesigner.value = null
  designerSearch.value = ''
}

const selectDesigner = (persona: PersonaDto) => {
  selectedDesigner.value = persona
}

const assignDesigner = async () => {
  if (!assigningActivity.value || !selectedDesigner.value) return

  savingDesigner.value = true
  try {
    const selectedId = Number(selectedDesigner.value.idUsuario)

    if (!isDesigner(selectedDesigner.value.roles)) {
      await api.post(`/usuarios/${selectedId}/roles`, {
        nombreRol: 'DISENADOR'
      })
      await Promise.all([loadDesigners(), loadParticipantes()])
    }

    if (assigningActivity.value.tipo === 'CURSO') {
      const response = await api.patch(`/cursos/${assigningActivity.value.id}/disenador`, {
        idDisenador: selectedId
      }) as CursoDto

      cursos.value = cursos.value.map(item =>
        item.idCurso === response.idCurso ? response : item)
    } else {
      const response = await api.patch(`/eventos/${assigningActivity.value.id}/disenador`, {
        idDisenador: selectedId
      }) as EventoDto

      eventos.value = eventos.value.map(item =>
        item.idEvento === response.idEvento ? response : item)
    }

    alertStore.push({
      type: 'success',
      message: 'Disenador asignado correctamente.'
    })
    closeDesignerModal()
  } catch (error) {
    alertStore.push({
      type: 'error',
      message: (error as Error).message || 'No se pudo asignar el disenador.'
    })
  } finally {
    savingDesigner.value = false
  }
}

const isDesigner = (roles: string[]) => {
  return roles.some(role => role === 'DISENADOR' || role === 'DISEÑADOR')
}

onMounted(() => {
  loadAll()
})
</script>
