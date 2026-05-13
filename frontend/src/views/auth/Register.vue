<template>
  <div class="relative">
    <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-300/25 via-transparent to-amber-300/25 blur-2xl"></div>
    <div class="relative bg-white/95 border border-white/60 rounded-3xl shadow-2xl p-8 backdrop-blur">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-emerald-300/50 bg-white shadow-lg">
          <img :src="logo" alt="Logo FHCE" class="w-full h-full object-cover" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-emerald-600">FHCE Cursos</p>
          <h2 class="text-2xl font-bold text-slate-900">Crear Cuenta</h2>
          <p class="text-sm text-slate-500">Registro de usuario externo</p>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
          <input
            v-model="form.username"
            type="text"
            autocomplete="username"
            :disabled="isSubmitting"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="Usuario de acceso"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nombres</label>
          <input
            v-model="form.nombres"
            type="text"
            autocomplete="given-name"
            :disabled="isSubmitting"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="Tus nombres"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
          <input
            v-model="form.apellidos"
            type="text"
            autocomplete="family-name"
            :disabled="isSubmitting"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="Tus apellidos"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            :disabled="isSubmitting"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="isSubmitting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition pr-10"
              placeholder="Minimo 8 caracteres"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              :disabled="isSubmitting"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              :aria-label="showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'"
            >
              <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.27-2.944-9.543-7a9.965 9.965 0 012.472-4.111m3.168-2.225A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.198 5.29M15 12a3 3 0 00-3-3" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
          <div class="relative">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="isSubmitting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition pr-10"
              placeholder="Repite tu contraseña"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="isSubmitting"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              :aria-label="showConfirmPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'"
            >
              <svg v-if="!showConfirmPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.27-2.944-9.543-7a9.965 9.965 0 012.472-4.111m3.168-2.225A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.198 5.29M15 12a3 3 0 00-3-3" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg v-if="isSubmitting" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4" />
            <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke-width="4" />
          </svg>
          {{ isSubmitting ? 'Enviando codigo...' : 'Registrarme' }}
        </button>

        <p v-if="message" class="text-sm text-emerald-600" role="status">
          {{ message }}
        </p>
        <p v-if="errorMessage" class="text-sm text-red-600" role="status">
          {{ errorMessage }}
        </p>

        <div class="text-center pt-2">
          <router-link
            to="/auth/login"
            class="text-sm text-emerald-700 hover:text-emerald-800"
          >
            Ya tengo cuenta
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Evitar duplicado del icono de mostrar contrasena en Edge/IE */
:deep(input::-ms-reveal),
:deep(input::-ms-clear) {
  display: none;
}
</style>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import logo from '@/assets/images/logo.jpg'

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
  confirmPassword: '',
  tipoParticipante: 'EXTERNO' as 'EXTERNO'
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)

const handleRegister = async () => {
  if (isSubmitting.value) return
  try {
    message.value = ''
    errorMessage.value = ''

    const trimmedUsername = form.username.trim()
    const trimmedNombres = form.nombres.trim()
    const trimmedApellidos = form.apellidos.trim()
    const trimmedEmail = form.email.trim()
    const trimmedPassword = form.password.trim()
    const trimmedConfirm = form.confirmPassword.trim()

    if (!trimmedUsername || !trimmedNombres || !trimmedApellidos || !trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      errorMessage.value = 'Completa todos los campos obligatorios'
      return
    }

    if (!/^[\w.\-]+$/i.test(trimmedUsername)) {
      errorMessage.value = 'El usuario solo puede tener letras, numeros, puntos o guiones'
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errorMessage.value = 'El email no tiene un formato valido'
      return
    }

    if (trimmedPassword.length < 8) {
      errorMessage.value = 'La contraseña debe tener al menos 8 caracteres'
      return
    }

    if (trimmedPassword !== trimmedConfirm) {
      errorMessage.value = 'Las contraseñas no coinciden'
      return
    }

    isSubmitting.value = true
    const response = await auth.register({
      username: trimmedUsername,
      nombres: trimmedNombres,
      apellidos: trimmedApellidos,
      email: trimmedEmail,
      password: trimmedPassword,
      tipoParticipante: 'EXTERNO'
    })

    message.value = response
    router.push({
      name: 'verify-email',
      query: { username: trimmedUsername }
    })
  } catch (error) {
    errorMessage.value = (error as Error).message
  } finally {
    isSubmitting.value = false
  }
}
</script>
