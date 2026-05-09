<template>
  <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span class="text-white font-bold text-2xl">F</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">
        Verificar Email
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Ingresa el codigo de 6 digitos
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleVerify">
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
        <label class="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
        <input
          v-model="form.codigo"
          type="text"
          maxlength="6"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="000000"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:shadow-xl transition"
      >
        Verificar
      </button>

      <p v-if="message" class="text-sm text-green-600">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <div class="flex items-center justify-between text-sm">
        <button
          type="button"
          @click="handleResend"
          class="text-emerald-700 hover:text-emerald-800 font-medium"
        >
          Reenviar codigo
        </button>
        <router-link
          to="/auth/login"
          class="text-emerald-700 hover:text-emerald-800"
        >
          Ir al login
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const route = useRoute()

const message = ref('')
const errorMessage = ref('')

const form = reactive({
  username: '',
  codigo: ''
})

onMounted(() => {
  const username = route.query.username
  if (typeof username === 'string') {
    form.username = username
  }
})

const handleVerify = async () => {
  try {
    message.value = ''
    errorMessage.value = ''
    const response = await auth.verifyEmail({
      username: form.username,
      codigo: form.codigo
    })
    message.value = response
  } catch (error) {
    errorMessage.value = (error as Error).message
  }
}

const handleResend = async () => {
  try {
    message.value = ''
    errorMessage.value = ''
    const response = await auth.resendCode(form.username)
    message.value = response
  } catch (error) {
    errorMessage.value = (error as Error).message
  }
}
</script>
