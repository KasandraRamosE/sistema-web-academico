<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Mis eventos</h1>
        <p class="text-sm text-slate-500">Listado de eventos disponibles para asistencia.</p>
      </div>
      <Button variant="outline" size="sm" @click="loadEventos">Actualizar</Button>
    </div>

    <Card>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Buscar evento</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Nombre del evento"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
          Cargando eventos...
        </div>
        <div v-else-if="eventosFiltrados.length === 0" class="py-8 text-center text-sm text-slate-500">
          No hay eventos disponibles.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Evento</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Inscritos</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Accion</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="evento in eventosFiltrados" :key="evento.idEvento" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <p class="text-sm font-medium text-slate-800">{{ evento.nombre }}</p>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ formatDate(evento.fechaHora) }}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ evento.inscritos }}</td>
                <td class="px-4 py-3 text-right">
                  <router-link :to="`/auxiliar/asistencia?evento=${evento.idEvento}`">
                    <Button size="sm">Registrar</Button>
                  </router-link>
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
import { api } from '@/utils/api'

interface EventoDto {
  idEvento: number
  nombre: string
  fechaHora: string
  inscritos: number
}

const loading = ref(false)
const searchTerm = ref('')
const eventos = ref<EventoDto[]>([])

const eventosFiltrados = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return eventos.value

  return eventos.value.filter(evento => evento.nombre.toLowerCase().includes(term))
})

const loadEventos = async () => {
  loading.value = true
  try {
    const response = await api.get('/eventos/auxiliar') as EventoDto[]
    eventos.value = response
  } finally {
    loading.value = false
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

onMounted(() => {
  loadEventos()
})
</script>
