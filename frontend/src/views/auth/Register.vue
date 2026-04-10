<template>
  <div class="relative">
    <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-300/25 via-transparent to-amber-300/25 blur-2xl"></div>
    <div class="relative bg-white/95 border border-white/60 rounded-3xl shadow-2xl p-8 backdrop-blur">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
          <span class="text-white font-bold text-2xl">FH</span>
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
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contrasena</label>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="Minimo 8 caracteres"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de participante</label>
          <select
            v-model="form.tipoParticipante"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
          >
            <option value="UMSA">UMSA</option>
            <option value="EXTERNO">Externo</option>
          </select>
        </div>

        <button
          type="submit"
          class="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:shadow-xl transition"
        >
          Registrarme
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
