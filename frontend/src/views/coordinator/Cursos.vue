<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Cursos</h1>
        <p class="text-sm text-slate-500">Gestiona cursos y asigna docentes a paralelos.</p>
      </div>
      <Button variant="outline" @click="openCreateCurso">Nuevo curso</Button>
    </div>


    <Card>
      <div class="mb-4 grid gap-3 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Nombre del curso..."
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
        <div  v-if="carreras.length > 1">
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
        Cargando cursos...
      </div>
      <div v-else-if="cursosFiltrados.length === 0" class="py-10 text-center text-sm text-slate-500">
        No hay cursos para esta carrera.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Curso</th>
              <th class="px-4 py-3">Carrera</th>
              <th class="px-4 py-3">Inicio</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="curso in cursosFiltrados" :key="curso.idCurso">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-900">{{ curso.nombre }}</p>
                <p class="text-xs text-slate-500">{{ curso.cargaHoraria }} horas · Nota minima {{ curso.notaAprobacion }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ curso.nombreCarrera }}</td>
              <td class="px-4 py-3 text-slate-600">{{ curso.fechaInicio }}</td>
              <td class="px-4 py-3">
                <Badge :variant="curso.estado === 'ABIERTO' ? 'success' : 'gray'" size="sm">
                  {{ curso.estado }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" @click="openParalelos(curso)">Paralelos</Button>
                  <Button variant="ghost" size="sm" @click="openEditCurso(curso)">Editar</Button>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:text-rose-700" @click="confirmDeleteCurso(curso)">
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
      :modelValue="showCursoModal"
      :title="editingCurso ? 'Editar curso' : 'Nuevo curso'"
      size="lg"
      @close="closeCursoModal"
    >
      <form class="space-y-4" @submit.prevent="saveCurso">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            v-model="formCurso.nombre"
            type="text"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
          <textarea
            v-model="formCurso.descripcion"
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          ></textarea>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Carrera</label>
            <select
              v-model.number="formCurso.idCarrera"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            >
              <option v-for="carrera in carreras" :key="carrera.idCarrera" :value="carrera.idCarrera">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Fecha inicio</label>
            <input
              v-model="formCurso.fechaInicio"
              type="date"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Carga horaria</label>
            <input
              v-model.number="formCurso.cargaHoraria"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Costo externo</label>
            <input
              v-model.number="formCurso.costoExterno"
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
              v-model.number="formCurso.costoUmsa"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Nota de aprobacion</label>
          <input
            v-model.number="formCurso.notaAprobacion"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Estado</label>
          <select
            v-model="formCurso.estado"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          >
            <option value="ABIERTO">Abierto</option>
            <option value="LLENO">Lleno</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" type="button" @click="closeCursoModal">Cancelar</Button>
          <Button type="submit" :loading="saving">Guardar</Button>
        </div>
      </form>
    </Modal>

    <Modal
      :modelValue="showDeleteModal"
      title="Eliminar curso"
      size="md"
      @close="closeDeleteModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Esta accion eliminara el curso y sus paralelos. Esta seguro de continuar?
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeDeleteModal">Cancelar</Button>
          <Button variant="danger" :loading="deleting" @click="deleteCurso">Eliminar</Button>
        </div>
      </div>
    </Modal>

    <Modal
      :modelValue="showParalelosModal"
      title="Gestion de paralelos"
      size="xl"
      @close="closeParalelos"
    >
      <div v-if="paraleloCurso" class="space-y-4">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ paraleloCurso.nombre }}</h3>
            <p class="text-sm text-slate-500">Asigna docentes a cada paralelo.</p>
          </div>
          <Button variant="outline" size="sm" @click="openCreateParalelo">Nuevo paralelo</Button>
        </div>

        <div v-if="paraleloCurso.paralelos.length === 0" class="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Este curso no tiene paralelos.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="paralelo in paraleloCurso.paralelos"
            :key="paralelo.codigo"
            class="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-900">Paralelo {{ paralelo.codigo }}</p>
                <p class="text-xs text-slate-500">{{ paralelo.modalidad }} · Cupo {{ paralelo.cupoMaximo ?? 'Sin limite' }}</p>
              </div>
              <Button variant="ghost" size="sm" @click="openEditParalelo(paralelo)">Editar</Button>
            </div>
            <p class="mt-2 text-xs text-slate-500">Docente: {{ paralelo.nombreDocente || 'Sin asignar' }}</p>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      :modelValue="showParaleloModal"
      :title="editingParalelo ? 'Editar paralelo' : 'Nuevo paralelo'"
      size="lg"
      @close="closeParaleloModal"
    >
      <form v-if="paraleloCurso" class="space-y-4" @submit.prevent="saveParalelo">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Codigo</label>
          <input
            v-model="formParalelo.codigo"
            type="text"
            required
            :disabled="!!editingParalelo"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Docente</label>
          <input
            v-model="docenteSearch"
            type="text"
            placeholder="Buscar por nombre o username"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
          <div class="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg">
            <button
              v-for="persona in docentesFiltrados"
              :key="persona.idUsuario"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
              :class="selectedDocente?.idUsuario === persona.idUsuario
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-transparent hover:bg-slate-50'"
              @click="selectDocente(persona)"
            >
              <span>
                <span class="font-medium text-slate-900">{{ persona.nombres }} {{ persona.apellidos }}</span>
                <span class="ml-2 text-xs text-slate-500">{{ persona.username }}</span>
              </span>
              <span class="text-xs text-slate-500">
                {{ persona.roles.includes('DOCENTE') ? 'Docente' : 'Participante' }}
              </span>
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Si seleccionas a un participante, se le asignara el rol DOCENTE.
          </p>
        </div>
        <div v-if="selectedDocente && !selectedDocente.roles.includes('DOCENTE')">
          <label class="mb-1 block text-sm font-medium text-slate-700">Titulo academico</label>
          <input
            v-model="tituloDocente"
            type="text"
            placeholder="Lic., MSc., PhD., etc."
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
          <p v-if="docenteAssignError" class="mt-1 text-xs text-rose-600">{{ docenteAssignError }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Modalidad</label>
            <select
              v-model="formParalelo.modalidad"
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
              v-model.number="formParalelo.cupoMaximo"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Horario</label>
          <input
            v-model="formParalelo.horarioDescripcion"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Link</label>
          <input
            v-model="formParalelo.link"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" type="button" @click="closeParaleloModal">Cancelar</Button>
          <Button type="submit" :loading="savingParalelo">Guardar</Button>
        </div>
      </form>
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

interface ParaleloDto {
  codigo: string
  modalidad: string
  cupoMaximo: number | null
  horarioDescripcion: string
  link: string
  nombreDocente?: string
}

interface CursoDto {
  idCurso: number
  idCarrera: number
  nombreCarrera: string
  nombre: string
  descripcion: string
  cargaHoraria: number
  fechaInicio: string
  costoExterno: number
  costoUmsa: number
  notaAprobacion: number
  estado: string
  paralelos: ParaleloDto[]
}

interface DocenteDto {
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
const cursos = ref<CursoDto[]>([])
const docentes = ref<DocenteDto[]>([])
const participantes = ref<ParticipanteDto[]>([])
const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')
const estadoFiltro = ref('')
const docenteSearch = ref('')
const selectedDocente = ref<ParticipanteDto | null>(null)
const tituloDocente = ref('')
const docenteAssignError = ref('')

const showCursoModal = ref(false)
const editingCurso = ref<CursoDto | null>(null)
const editingEstado = ref('')
const formCurso = ref({
  idCarrera: 0,
  nombre: '',
  descripcion: '',
  cargaHoraria: 1,
  fechaInicio: '',
  costoExterno: 0,
  costoUmsa: 0,
  notaAprobacion: 51,
  estado: 'ABIERTO'
})

const showDeleteModal = ref(false)
const deleting = ref(false)
const cursoToDelete = ref<CursoDto | null>(null)

const showParalelosModal = ref(false)
const paraleloCurso = ref<CursoDto | null>(null)

const showParaleloModal = ref(false)
const editingParalelo = ref<ParaleloDto | null>(null)
const savingParalelo = ref(false)
const formParalelo = ref({
  codigo: '',
  idDocente: null as number | null,
  modalidad: 'PRESENCIAL',
  cupoMaximo: null as number | null,
  horarioDescripcion: '',
  link: ''
})

const cursosFiltrados = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return cursos.value.filter(curso => {
    if (selectedCarreraId.value && curso.idCarrera !== selectedCarreraId.value) return false
    if (estadoFiltro.value && curso.estado !== estadoFiltro.value) return false
    if (term && !curso.nombre.toLowerCase().includes(term)) return false
    return true
  })
})

const docentesFiltrados = computed(() => {
  const term = docenteSearch.value.trim().toLowerCase()
  if (!term) return []
  const merged = new Map<number, ParticipanteDto>()

  docentes.value.forEach(docente => {
    merged.set(docente.idUsuario, docente)
  })
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

const loadCursos = async () => {
  loading.value = true
  try {
    const response = await api.get('/cursos/todos') as CursoDto[]
    cursos.value = response
  } finally {
    loading.value = false
  }
}

const loadDocentes = async () => {
  const response = await api.get('/usuarios/docentes') as DocenteDto[]
  docentes.value = response
}

const loadParticipantes = async () => {
  const response = await api.get('/usuarios/participantes') as ParticipanteDto[]
  participantes.value = response
}

const loadAll = async () => {
  await Promise.all([loadCarreras(), loadCursos(), loadDocentes(), loadParticipantes()])
}

const openCreateCurso = () => {
  editingCurso.value = null
  editingEstado.value = ''
  formCurso.value = {
    idCarrera: selectedCarreraId.value || carreras.value[0]?.idCarrera || 0,
    nombre: '',
    descripcion: '',
    cargaHoraria: 1,
    fechaInicio: '',
    costoExterno: 0,
    costoUmsa: 0,
    notaAprobacion: 51,
    estado: 'ABIERTO'
  }
  showCursoModal.value = true
}

const openEditCurso = (curso: CursoDto) => {
  editingCurso.value = curso
  editingEstado.value = curso.estado
  formCurso.value = {
    idCarrera: curso.idCarrera,
    nombre: curso.nombre,
    descripcion: curso.descripcion || '',
    cargaHoraria: curso.cargaHoraria,
    fechaInicio: curso.fechaInicio,
    costoExterno: Number(curso.costoExterno || 0),
    costoUmsa: Number(curso.costoUmsa || 0),
    notaAprobacion: Number(curso.notaAprobacion || 51),
    estado: curso.estado
  }
  showCursoModal.value = true
}

const closeCursoModal = () => {
  showCursoModal.value = false
  editingCurso.value = null
  editingEstado.value = ''
}

const saveCurso = async () => {
  saving.value = true
  try {
    if (editingCurso.value) {
      await api.put(`/cursos/${editingCurso.value.idCurso}`, {
        idCarrera: formCurso.value.idCarrera,
        nombre: formCurso.value.nombre,
        descripcion: formCurso.value.descripcion,
        cargaHoraria: formCurso.value.cargaHoraria,
        fechaInicio: formCurso.value.fechaInicio,
        costoExterno: formCurso.value.costoExterno,
        costoUmsa: formCurso.value.costoUmsa,
        notaAprobacion: formCurso.value.notaAprobacion
      })
      if (formCurso.value.estado !== editingEstado.value) {
        await api.patch(`/cursos/${editingCurso.value.idCurso}/estado?estado=${encodeURIComponent(formCurso.value.estado)}`)
      }
      alertStore.push({ type: 'success', message: 'Curso actualizado.' })
    } else {
      await api.post('/cursos', {
        idCarrera: formCurso.value.idCarrera,
        nombre: formCurso.value.nombre,
        descripcion: formCurso.value.descripcion,
        cargaHoraria: formCurso.value.cargaHoraria,
        fechaInicio: formCurso.value.fechaInicio,
        costoExterno: formCurso.value.costoExterno,
        costoUmsa: formCurso.value.costoUmsa,
        notaAprobacion: formCurso.value.notaAprobacion
      })
      alertStore.push({ type: 'success', message: 'Curso creado.' })
    }
    closeCursoModal()
    await loadCursos()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo guardar el curso.' })
  } finally {
    saving.value = false
  }
}

const confirmDeleteCurso = (curso: CursoDto) => {
  cursoToDelete.value = curso
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  cursoToDelete.value = null
}

const deleteCurso = async () => {
  if (!cursoToDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/cursos/${cursoToDelete.value.idCurso}`)
    alertStore.push({ type: 'success', message: 'Curso eliminado.' })
    closeDeleteModal()
    await loadCursos()
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo eliminar el curso.' })
  } finally {
    deleting.value = false
  }
}

const openParalelos = (curso: CursoDto) => {
  paraleloCurso.value = curso
  showParalelosModal.value = true
}

const closeParalelos = () => {
  showParalelosModal.value = false
  paraleloCurso.value = null
}

const openCreateParalelo = () => {
  editingParalelo.value = null
  formParalelo.value = {
    codigo: '',
    idDocente: null,
    modalidad: 'PRESENCIAL',
    cupoMaximo: null,
    horarioDescripcion: '',
    link: ''
  }
  docenteSearch.value = ''
  selectedDocente.value = null
  tituloDocente.value = ''
  docenteAssignError.value = ''
  showParaleloModal.value = true
}

const openEditParalelo = (paralelo: ParaleloDto) => {
  editingParalelo.value = paralelo
  formParalelo.value = {
    codigo: paralelo.codigo,
    idDocente: null,
    modalidad: paralelo.modalidad,
    cupoMaximo: paralelo.cupoMaximo ?? null,
    horarioDescripcion: paralelo.horarioDescripcion || '',
    link: paralelo.link || ''
  }
  docenteSearch.value = ''
  selectedDocente.value = null
  tituloDocente.value = ''
  docenteAssignError.value = ''
  showParaleloModal.value = true
}

const closeParaleloModal = () => {
  showParaleloModal.value = false
  editingParalelo.value = null
  selectedDocente.value = null
  docenteSearch.value = ''
  tituloDocente.value = ''
  docenteAssignError.value = ''
}

const selectDocente = (persona: ParticipanteDto) => {
  selectedDocente.value = persona
  formParalelo.value.idDocente = persona.idUsuario
  docenteAssignError.value = ''
}

const saveParalelo = async () => {
  if (!paraleloCurso.value) return

  savingParalelo.value = true
  try {
    if (selectedDocente.value && !selectedDocente.value.roles.includes('DOCENTE')) {
      if (!tituloDocente.value.trim()) {
        docenteAssignError.value = 'El titulo es obligatorio para asignar DOCENTE.'
        savingParalelo.value = false
        return
      }
      await api.post(`/usuarios/${selectedDocente.value.idUsuario}/roles`, {
        nombreRol: 'DOCENTE',
        titulo: tituloDocente.value.trim()
      })
      await Promise.all([loadDocentes(), loadParticipantes()])
    }

    const payload = {
      codigo: formParalelo.value.codigo,
      idDocente: formParalelo.value.idDocente || null,
      modalidad: formParalelo.value.modalidad,
      cupoMaximo: formParalelo.value.cupoMaximo,
      horarioDescripcion: formParalelo.value.horarioDescripcion,
      link: formParalelo.value.link
    }

    if (editingParalelo.value) {
      await api.put(`/cursos/${paraleloCurso.value.idCurso}/paralelos/${editingParalelo.value.codigo}`, payload)
      alertStore.push({ type: 'success', message: 'Paralelo actualizado.' })
    } else {
      await api.post(`/cursos/${paraleloCurso.value.idCurso}/paralelos`, payload)
      alertStore.push({ type: 'success', message: 'Paralelo creado.' })
    }

    closeParaleloModal()
    await loadCursos()

    if (paraleloCurso.value) {
      const updated = cursos.value.find(curso => curso.idCurso === paraleloCurso.value?.idCurso)
      paraleloCurso.value = updated || null
    }
  } catch (error) {
    alertStore.push({ type: 'error', message: (error as Error).message || 'No se pudo guardar el paralelo.' })
  } finally {
    savingParalelo.value = false
  }
}

onMounted(() => {
  loadAll()
})
</script>
