<template>
  <div class="space-y-4">
    <div v-if="entry.logo_url" class="space-y-3">
      <div class="flex items-center space-x-4">
        <img 
          :src="getLogoUrl(entry.logo_url)" 
          alt="Logo" 
          class="w-20 h-20 object-contain border rounded-lg p-2"
        />
        <div class="flex-1">
          <p class="text-sm text-gray-600 mb-2">Current logo</p>
          <button
            @click="deleteLogo"
            :disabled="deleting"
            class="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            {{ deleting ? 'Deleting...' : 'Remove Logo' }}
          </button>
        </div>
      </div>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ entry.logo_url ? 'Replace Logo' : 'Add Logo' }}
      </label>
      <input
        type="file"
        ref="fileInput"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        @change="handleFileSelect"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />
      <p class="text-xs text-gray-500 mt-1">
        PNG, JPG, SVG, or WebP. Max 5MB.
      </p>
    </div>
    
    <div v-if="selectedFile" class="flex justify-end space-x-3">
      <button
        @click="cancelUpload"
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
      >
        Cancel
      </button>
      <button
        @click="uploadLogo"
        :disabled="uploading"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {{ uploading ? 'Uploading...' : 'Upload Logo' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  entry: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update'])

const authStore = useAuthStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const deleting = ref(false)

function getLogoUrl(logoUrl) {
  // If it's a relative URL, prepend the backend URL
  if (logoUrl?.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8787'}${logoUrl}`
  }
  return logoUrl
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size: 5MB')
      event.target.value = ''
      return
    }
    
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: PNG, JPG, SVG, WebP')
      event.target.value = ''
      return
    }
    
    selectedFile.value = file
  }
}

function cancelUpload() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function uploadLogo() {
  if (!selectedFile.value) return
  
  uploading.value = true
  const formData = new FormData()
  formData.append('logo', selectedFile.value)
  formData.append('entryId', props.entry.id)
  
  try {
    const response = await fetch('/api/logo/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload logo')
    }
    
    const data = await response.json()
    
    // Emit update event with new logo URL
    emit('update', { ...props.entry, logo_url: data.logoUrl })
    
    // Reset
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    
    alert('Logo uploaded successfully!')
  } catch (error) {
    alert(error.message || 'Failed to upload logo')
  } finally {
    uploading.value = false
  }
}

async function deleteLogo() {
  if (!confirm('Are you sure you want to remove the logo?')) return
  
  deleting.value = true
  
  try {
    const response = await fetch(`/api/logo/delete/${props.entry.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete logo')
    }
    
    // Emit update event with no logo
    emit('update', { ...props.entry, logo_url: null })
    
    alert('Logo removed successfully!')
  } catch (error) {
    alert(error.message || 'Failed to delete logo')
  } finally {
    deleting.value = false
  }
}
</script>