<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <router-link to="/" class="inline-flex items-center space-x-2 mb-6">
            <LinkIcon class="h-8 w-8 text-indigo-600" />
            <span class="text-2xl font-bold text-gray-900">QRurl</span>
          </router-link>
          <h2 class="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p class="text-gray-600 mt-2">Sign in with your email</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="you@example.com"
              :disabled="loading"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span v-if="!loading">Send Magic Link</span>
            <span v-else class="flex items-center">
              <Loader2Icon class="animate-spin -ml-1 mr-3 h-5 w-5" />
              Sending...
            </span>
          </button>
        </form>

        <div v-if="success" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-start">
            <CheckCircleIcon class="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p class="text-green-800 font-medium">Magic link sent!</p>
              <p class="text-green-700 text-sm mt-1">
                Check your email for a login link. It will expire in 15 minutes.
              </p>
            </div>
          </div>
        </div>

        <div v-if="error" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start">
            <AlertCircleIcon class="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p class="text-red-800 font-medium">Error</p>
              <p class="text-red-700 text-sm mt-1">{{ error }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-600">
          <p>
            By signing in, you agree to our
            <a href="#" class="text-indigo-600 hover:text-indigo-700"> Terms of Service</a>
            and
            <a href="#" class="text-indigo-600 hover:text-indigo-700"> Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Link as LinkIcon, Loader2 as Loader2Icon, CheckCircle as CheckCircleIcon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    await authStore.requestMagicLink(email.value)
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to send magic link. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>