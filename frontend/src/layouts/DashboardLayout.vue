<template>
  <!--
    Layout del Dashboard (Roles Administrativos)
    SOLO Sidebar + Contenido (SIN header público)
    El sidebar incluye: logo, navegación, perfil, logout
  -->
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar con todo integrado -->
    <Sidebar />
    
    <!-- Contenido principal -->
    <main class="flex-1 overflow-y-auto">
      <div class="p-8">
        <!-- Breadcrumbs (opcional) -->
        <div v-if="showBreadcrumbs" class="mb-6">
          <nav class="flex text-sm text-gray-600">
            <span class="text-gray-800 font-medium">{{ currentPageTitle }}</span>
          </nav>
        </div>

        <!-- Vista hija (contenido del dashboard) -->
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'

// ============================================
// COMPOSABLES
// ============================================

const route = useRoute()

// ============================================
// COMPUTED
// ============================================

/**
 * Obtiene el título de la página actual
 */
const currentPageTitle = computed(() => {
  return (route.meta.title as string) || 'Dashboard'
})

/**
 * Controla si se muestran los breadcrumbs
 */
const showBreadcrumbs = computed(() => {
  return route.meta.breadcrumb !== false
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>