<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center">
          <router-link to="/" class="inline-flex items-center space-x-2 mb-6">
            <LinkIcon class="h-8 w-8 text-indigo-600" />
            <span class="text-2xl font-bold text-gray-900">QRurl</span>
          </router-link>

          <div v-if="loading" class="py-8">
            <Loader2Icon class="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p class="text-gray-600">Verifying your login...</p>
          </div>

          <div v-else-if="error" class="py-8">
            <AlertCircleIcon class="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h3>
            <p class="text-gray-600 mb-6">{{ error }}</p>
            <router-link
              to="/login"
              class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Back to Login
            </router-link>
          </div>

          <div v-else-if="success" class="py-8">
            <CheckCircleIcon class="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
            <p class="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Link as LinkIcon, Loader2 as Loader2Icon, CheckCircle as CheckCircleIcon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    error.value = 'No verification token provided'
    loading.value = false
    return
  }

  try {
    await authStore.verifyMagicLink(token)
    success.value = true
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Invalid or expired token'
  } finally {
    loading.value = false
  }
})
</script>