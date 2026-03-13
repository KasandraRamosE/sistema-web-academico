<template>
  <!--
    Vista: Mi Perfil
    Permite al usuario ver y editar su información personal
  -->
  <div class="container mx-auto px-4 py-8">
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Mi Perfil</h1>
      <p class="text-gray-600">Gestiona tu información personal</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna izquierda: Avatar y estadísticas -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Card de perfil -->
        <Card>
          <div class="text-center space-y-4">
            <!-- Avatar -->
            <div class="relative inline-block">
              <div class="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <span class="text-white text-4xl font-bold">
                  {{ getInitials() }}
                </span>
              </div>
              <!-- Botón de cambiar foto -->
              <button class="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <!-- Nombre -->
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                {{ authStore.fullName }}
              </h2>
              <p class="text-sm text-gray-600">{{ authStore.user?.email }}</p>
              <Badge 
                :variant="authStore.user?.tipo_usuario === 'INTERNO' ? 'primary' : 'secondary'" 
                size="sm" 
                class="mt-2"
              >
                {{ authStore.user?.tipo_usuario === 'INTERNO' ? 'Usuario UMSA' : 'Usuario Externo' }}
              </Badge>
            </div>
          </div>
        </Card>

        <!-- Estadísticas rápidas -->
        <Card>
          <div class="space-y-4">
            <h3 class="font-semibold text-gray-800 mb-3">Estadísticas</h3>
            
            <div class="flex items-center justify-between py-2 border-b border-gray-200">
              <span class="text-sm text-gray-600">Inscripciones</span>
              <span class="font-semibold text-gray-800">5</span>
            </div>
            
            <div class="flex items-center justify-between py-2 border-b border-gray-200">
              <span class="text-sm text-gray-600">Certificados</span>
              <span class="font-semibold text-gray-800">3</span>
            </div>
            
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-600">Horas totales</span>
              <span class="font-semibold text-gray-800">186</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- Columna derecha: Formulario de datos -->
      <div class="lg:col-span-2">
        <Card>
          <form @submit.prevent="guardarCambios" class="space-y-6">
            <!-- Información Personal -->
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nombres -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombres <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.nombres"
                    type="text"
                    required
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- Apellidos -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.apellidos"
                    type="text"
                    required
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    required
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- Teléfono -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    v-model="formData.telefono"
                    type="tel"
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <!-- CI -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Carnet de Identidad
                  </label>
                  <input
                    v-model="formData.ci"
                    type="text"
                    :disabled="!modoEdicion"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                
              </div>
            </div>

            <!-- Cambiar Contraseña -->
            <div v-if="authStore.user?.tipo_usuario === 'EXTERNO'" class="border-t border-gray-200 pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Contraseña</h3>
                <Button 
                  v-if="!modoEdicion"
                  variant="outline" 
                  size="sm"
                  @click="mostrarCambioPassword = !mostrarCambioPassword"
                  type="button"
                >
                  {{ mostrarCambioPassword ? 'Cancelar' : 'Cambiar contraseña' }}
                </Button>
              </div>

              <div v-if="mostrarCambioPassword || modoEdicion" class="space-y-4">
                <!-- Contraseña actual -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="passwordData.actual"
                    type="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <!-- Nueva contraseña -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="passwordData.nueva"
                    type="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <!-- Confirmar contraseña -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="passwordData.confirmar"
                    type="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                v-if="!modoEdicion"
                variant="primary"
                type="button"
                @click="activarEdicion"
              >
                Editar Perfil
              </Button>

              <template v-else>
                <Button
                  variant="outline"
                  type="button"
                  @click="cancelarEdicion"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  :disabled="guardando"
                >
                  {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
                </Button>
              </template>
            </div>
          </form>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'

// ============================================
// COMPOSABLES
// ============================================

const authStore = useAuthStore()

// ============================================
// ESTADO
// ============================================

const modoEdicion = ref(false)
const guardando = ref(false)
const mostrarCambioPassword = ref(false)

// Datos del formulario
const formData = reactive({
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  ci: '',
  fecha_nacimiento: ''
})

// Backup de datos originales
let datosOriginales: any = {}

// Datos de cambio de contraseña
const passwordData = reactive({
  actual: '',
  nueva: '',
  confirmar: ''
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Obtiene las iniciales del nombre
 */
const getInitials = (): string => {
  if (!authStore.user) return '?'
  
  const nombres = authStore.user.nombres.split(' ')
  const apellidos = authStore.user.apellidos.split(' ')
  
  const inicial1 = nombres[0]?.charAt(0) || ''
  const inicial2 = apellidos[0]?.charAt(0) || ''
  
  return (inicial1 + inicial2).toUpperCase()
}

/**
 * Carga los datos del usuario
 */
const cargarDatos = () => {
  if (!authStore.user) return
  
  formData.nombres = authStore.user.nombres
  formData.apellidos = authStore.user.apellidos
  formData.email = authStore.user.email
  formData.telefono = '' // TODO: Agregar al store cuando venga del backend
  formData.ci = '' // TODO: Agregar al store
  formData.fecha_nacimiento = '' // TODO: Agregar al store
  
  // Guardar copia de datos originales
  datosOriginales = { ...formData }
}

/**
 * Activa el modo edición
 */
const activarEdicion = () => {
  modoEdicion.value = true
}

/**
 * Cancela la edición y restaura datos originales
 */
const cancelarEdicion = () => {
  Object.assign(formData, datosOriginales)
  modoEdicion.value = false
  mostrarCambioPassword.value = false
  
  // Limpiar campos de contraseña
  passwordData.actual = ''
  passwordData.nueva = ''
  passwordData.confirmar = ''
}

/**
 * Guarda los cambios del perfil
 */
const guardarCambios = async () => {
  // Validar contraseñas si se está cambiando
  if (mostrarCambioPassword.value || (passwordData.nueva && passwordData.confirmar)) {
    if (!passwordData.actual) {
      alert('Debes ingresar tu contraseña actual')
      return
    }
    
    if (passwordData.nueva !== passwordData.confirmar) {
      alert('Las contraseñas no coinciden')
      return
    }
    
    if (passwordData.nueva.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }
  }
  
  guardando.value = true
  
  try {
    // TODO: Llamar al backend para guardar cambios
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay
    
    // Actualizar datos en el store
    if (authStore.user) {
      authStore.updateUser({
        ...authStore.user,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email
      })
    }
    
    // Actualizar datos originales
    datosOriginales = { ...formData }
    
    modoEdicion.value = false
    mostrarCambioPassword.value = false
    
    // Limpiar campos de contraseña
    passwordData.actual = ''
    passwordData.nueva = ''
    passwordData.confirmar = ''
    
    alert('Perfil actualizado correctamente')
  } catch (error) {
    console.error('Error al guardar:', error)
    alert('Error al guardar los cambios')
  } finally {
    guardando.value = false
  }
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>