<template>
  <!--
    Tarjeta de Actividad (Curso o Evento)
    Muestra información resumida con opción de ver detalle o inscribirse
  -->
  <Card 
    :hoverable="true"
    class="h-full flex flex-col"
  >
    <!-- Header con tipo y estado -->
    <template #header>
      <div class="flex items-center justify-between">
        <!-- Badge de tipo -->
        <Badge 
          :variant="activity.tipo === 'CURSO' ? 'primary' : 'secondary'"
          size="sm"
        >
          {{ activity.tipo }}
        </Badge>

        <!-- Badge de estado -->
        <Badge 
          :variant="getEstadoBadgeVariant()"
          size="sm"
          :dot="true"
        >
          {{ getEstadoLabel() }}
        </Badge>
      </div>
    </template>

    <!-- Contenido principal -->
    <div class="flex-1 space-y-4">
      <!-- Título -->
      <h3 class="text-lg font-bold text-gray-800 line-clamp-2">
        {{ activity.nombre }}
      </h3>

      <!-- Descripción -->
      <p class="text-sm text-gray-600 line-clamp-3">
        {{ activity.descripcion }}
      </p>

      <!-- Información adicional -->
      <div class="space-y-2">
        <!-- Carrera -->
        <div v-if="activity.carrera" class="flex items-center space-x-2 text-sm text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{{ activity.carrera.nombre }}</span>
        </div>

        <!-- Modalidad -->
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>{{ getModalidadLabel() }}</span>
        </div>

        <!-- Carga horaria -->
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ activity.carga_horaria }} horas académicas</span>
        </div>

        <!-- Fechas -->
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDateRange() }}</span>
        </div>

        <!-- Cupos -->
        <div class="flex items-center space-x-2 text-sm">
          <svg class="w-4 h-4" :class="getCuposColor()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span :class="getCuposColor()">
            {{ activity.cupos_disponibles }} de {{ activity.cupo_maximo }} cupos libres
          </span>
        </div>
      </div>

      <!-- Precio -->
      <div class="pt-4 border-t border-gray-200">
        <div v-if="activity.es_gratuito" class="text-center">
          <Badge variant="success" size="lg" class="w-full justify-center">
            ✓ GRATUITO
          </Badge>
        </div>
        <div v-else class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Precio UMSA:</span>
            <span class="font-bold text-purple-600">Bs. {{ activity.costo_umsa }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Precio Externo:</span>
            <span class="font-bold text-gray-800">Bs. {{ activity.costo_externo }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer con botones -->
    <template #footer>
      <Button
        variant="outline"
        size="sm"
        class="w-full"
        @click="$emit('view-detail', activity.id_actividad, activity.tipo)"
      >
        Ver detalle
      </Button>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import Button from '@/components/common/Button.vue'
import type { Actividad } from '@/types'

// ============================================
// PROPS
// ============================================

interface Props {
  activity: Actividad
}

const props = defineProps<Props>()

// ============================================
// EMITS
// ============================================

defineEmits<{
  'view-detail': [activityId: number, tipo: 'CURSO' | 'EVENTO']
}>()

// ============================================
// MÉTODOS
// ============================================

/**
 * Obtiene la variante del badge según el estado
 */
const getEstadoBadgeVariant = () => {
  switch (props.activity.estado) {
    case 'ABIERTO':
      return 'success'
    case 'LLENO':
      return 'warning'
    case 'FINALIZADO':
      return 'gray'
    default:
      return 'gray'
  }
}

/**
 * Obtiene la etiqueta del estado
 */
const getEstadoLabel = () => {
  switch (props.activity.estado) {
    case 'ABIERTO':
      return 'Abierto'
    case 'LLENO':
      return 'Lleno'
    case 'FINALIZADO':
      return 'Finalizado'
    default:
      return props.activity.estado
  }
}

/**
 * Obtiene la etiqueta de la modalidad
 */
const getModalidadLabel = () => {
  switch (props.activity.modalidad) {
    case 'PRESENCIAL':
      return 'Presencial'
    case 'VIRTUAL':
      return 'Virtual'
    case 'MIXTO':
      return 'Mixto'
    default:
      return props.activity.modalidad
  }
}

/**
 * Formatea el rango de fechas
 */
const formatDateRange = () => {
  const inicio = new Date(props.activity.fecha_inicio)
  const fin = new Date(props.activity.fecha_fin)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  
  if (inicio.toDateString() === fin.toDateString()) {
    return formatDate(inicio)
  }
  
  return `${formatDate(inicio)} - ${formatDate(fin)}`
}

/**
 * Obtiene el color según los cupos disponibles
 */
const getCuposColor = () => {
  const porcentaje = (props.activity.cupos_disponibles / props.activity.cupo_maximo) * 100
  
  if (porcentaje === 0) return 'text-red-600'
  if (porcentaje < 20) return 'text-orange-600'
  if (porcentaje < 50) return 'text-yellow-600'
  return 'text-green-600'
}
</script>

<style scoped>
/* Limitar líneas de texto */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>