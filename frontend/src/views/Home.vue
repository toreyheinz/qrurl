<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex justify-between items-center py-6">
        <div class="flex items-center space-x-2">
          <LinkIcon class="h-8 w-8 text-indigo-600" />
          <span class="text-2xl font-bold text-gray-900">QRurl</span>
        </div>
        <div class="flex items-center space-x-4">
          <router-link
            v-if="!authStore.isAuthenticated"
            to="/login"
            class="text-gray-700 hover:text-gray-900"
          >
            Sign In
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Dashboard
          </router-link>
        </div>
      </nav>

      <main class="py-20">
        <div class="text-center">
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Short Links, Beautiful QR Codes
          </h1>
          <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Create custom short URLs with branded QR codes. Track analytics, manage your links, 
            and share them with style.
          </p>

          <div v-if="!authStore.isAuthenticated" class="space-y-4">
            <router-link
              to="/login"
              class="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
            >
              Get Started Free
            </router-link>
            <p class="text-sm text-gray-500">No credit card required</p>
          </div>

          <div v-else>
            <router-link
              to="/dashboard"
              class="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
            >
              Go to Dashboard
            </router-link>
          </div>
        </div>

        <div class="mt-20 grid md:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-xl shadow-sm">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <LinkIcon class="h-6 w-6 text-indigo-600" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Custom Short URLs</h3>
            <p class="text-gray-600">
              Create memorable short links with custom slugs or auto-generated codes
            </p>
          </div>

          <div class="bg-white p-8 rounded-xl shadow-sm">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <QrCodeIcon class="h-6 w-6 text-indigo-600" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Branded QR Codes</h3>
            <p class="text-gray-600">
              Generate QR codes with your logo embedded for professional sharing
            </p>
          </div>

          <div class="bg-white p-8 rounded-xl shadow-sm">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <ChartBarIcon class="h-6 w-6 text-indigo-600" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Analytics & Insights</h3>
            <p class="text-gray-600">
              Track clicks, geographic data, and referrers for your links
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { Link as LinkIcon, QrCode as QrCodeIcon, BarChart3 as ChartBarIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>