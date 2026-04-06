<template>
  <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span class="text-white font-bold text-2xl">F</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">
        Crear Cuenta
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Registro de usuario externo
      </p>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
        <input
          v-model="form.username"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Ingrese su usuario"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
        <input
          v-model="form.nombres"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Ingrese sus nombres"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
        <input
          v-model="form.apellidos"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Ingrese sus apellidos"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
        <input
          v-model="form.password"
          type="password"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Minimo 8 caracteres"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de participante</label>
        <select
          v-model="form.tipoParticipante"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="UMSA">UMSA</option>
          <option value="EXTERNO">Externo</option>
        </select>
      </div>

      <button
        @click="handleRegister"
        class="w-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white py-2 rounded-lg hover:shadow-lg transition-all font-medium"
      >
        Registrarme
      </button>

      <p v-if="message" class="text-sm text-green-600">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <div class="text-center mt-4">
        <router-link
          to="/auth/login"
          class="text-sm text-primary-600 hover:text-primary-700"
        >
          Ya tengo cuenta
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()

const message = ref('')
const errorMessage = ref('')

const form = reactive({
  username: '',
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  tipoParticipante: 'EXTERNO' as 'UMSA' | 'EXTERNO'
})

const handleRegister = async () => {
  try {
    message.value = ''
    errorMessage.value = ''

    const response = await auth.register({
      username: form.username,
      nombres: form.nombres,
      apellidos: form.apellidos,
      email: form.email,
      password: form.password,
      tipoParticipante: form.tipoParticipante
    })

    message.value = response
    router.push({
      name: 'verify-email',
      query: { username: form.username }
    })
  } catch (error) {
    errorMessage.value = (error as Error).message
  }
}
</script>
