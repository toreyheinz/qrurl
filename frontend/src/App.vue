<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // Check if user is authenticated on app load
  if (authStore.isAuthenticated) {
    console.log('User authenticated:', authStore.user)
  }
})
</script>