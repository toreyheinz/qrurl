<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-2">
            <LinkIcon class="h-6 w-6 text-indigo-600" />
            <span class="text-xl font-bold text-gray-900">QRurl</span>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">{{ authStore.user?.email }}</span>
            <button
              @click="handleLogout"
              class="text-gray-500 hover:text-gray-700 transition"
            >
              <LogOutIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Create New Link -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 class="text-lg font-semibold mb-4">Create New Short Link</h2>
        
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                v-model="newEntry.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="My awesome link"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Custom Slug (optional)
              </label>
              <input
                v-model="newEntry.customSlug"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="my-custom-slug"
                pattern="[a-zA-Z0-9-]{3,50}"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Destination URL
            </label>
            <input
              v-model="newEntry.url"
              type="url"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Logo for QR Code (optional)
            </label>
            <input
              type="file"
              ref="logoFileInput"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              @change="handleLogoSelect"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p class="text-xs text-gray-500 mt-1">
              PNG, JPG, SVG, or WebP. Max 5MB. Will be embedded in QR code center.
            </p>
          </div>
          
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="creating"
              class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {{ creating ? 'Creating...' : 'Create Link' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Links List -->
      <div class="bg-white rounded-lg shadow-sm">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold">Your Links</h2>
        </div>
        
        <div v-if="loading" class="p-8 text-center">
          <Loader2Icon class="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p class="text-gray-500">Loading your links...</p>
        </div>
        
        <div v-else-if="entriesStore.entries.length === 0" class="p-8 text-center">
          <LinkIcon class="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">No links yet. Create your first one above!</p>
        </div>
        
        <div v-else class="divide-y">
          <div
            v-for="entry in entriesStore.entries"
            :key="entry.id"
            class="p-6 hover:bg-gray-50 transition"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ entry.name }}</h3>
                <div class="mt-1 space-y-1">
                  <p class="text-sm text-indigo-600">
                    {{ getShortUrl(entry.slug) }}
                    <button
                      @click="copyToClipboard(getShortUrl(entry.slug))"
                      class="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <CopyIcon class="h-4 w-4 inline" />
                    </button>
                  </p>
                  <p class="text-sm text-gray-500 truncate">
                    → {{ entry.original_url }}
                  </p>
                </div>
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{{ entry.click_count || 0 }} clicks</span>
                  <span>Created {{ formatDate(entry.created_at) }}</span>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 ml-4">
                <button
                  @click="showQRCode(entry)"
                  class="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="Show QR Code"
                >
                  <QrCodeIcon class="h-5 w-5" />
                </button>
                <router-link
                  :to="`/analytics/${entry.id}`"
                  class="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="View Analytics"
                >
                  <ChartBarIcon class="h-5 w-5" />
                </router-link>
                <button
                  @click="editEntry(entry)"
                  class="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="Edit"
                >
                  <EditIcon class="h-5 w-5" />
                </button>
                <button
                  @click="deleteEntry(entry.id)"
                  class="p-2 text-gray-400 hover:text-red-600 transition"
                  title="Delete"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- QR Code Modal -->
    <QRCodeModal
      v-if="selectedEntry"
      :entry="selectedEntry"
      @close="selectedEntry = null"
    />
    
    <!-- Edit Entry Modal -->
    <EditEntryModal
      v-if="editingEntry"
      :entry="editingEntry"
      @close="editingEntry = null"
      @update="handleEntryUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Link as LinkIcon, 
  LogOut as LogOutIcon,
  Loader2 as Loader2Icon,
  Copy as CopyIcon,
  QrCode as QrCodeIcon,
  BarChart3 as ChartBarIcon,
  Trash2 as TrashIcon,
  Edit as EditIcon
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useEntriesStore } from '../stores/entries'
import QRCodeModal from '../components/QRCodeModal.vue'
import EditEntryModal from '../components/EditEntryModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const entriesStore = useEntriesStore()

const loading = ref(true)
const creating = ref(false)
const selectedEntry = ref(null)
const editingEntry = ref(null)
const logoFileInput = ref(null)
const selectedLogo = ref(null)

const newEntry = ref({
  name: '',
  url: '',
  customSlug: ''
})

onMounted(async () => {
  try {
    await entriesStore.fetchEntries()
  } finally {
    loading.value = false
  }
})

async function handleCreate() {
  creating.value = true
  try {
    // First create the entry
    const entry = await entriesStore.createEntry(newEntry.value)
    
    // Then upload logo if selected
    if (selectedLogo.value && entry) {
      await uploadLogo(entry.id)
    }
    
    // Reset form
    newEntry.value = { name: '', url: '', customSlug: '' }
    selectedLogo.value = null
    if (logoFileInput.value) {
      logoFileInput.value.value = ''
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to create link')
  } finally {
    creating.value = false
  }
}

function handleLogoSelect(event) {
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
    
    selectedLogo.value = file
  }
}

async function uploadLogo(entryId) {
  if (!selectedLogo.value) return
  
  const formData = new FormData()
  formData.append('logo', selectedLogo.value)
  formData.append('entryId', entryId)
  
  try {
    const response = await fetch('/api/logo/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload logo')
    }
    
    const data = await response.json()
    
    // Update the entry in the store with the logo URL
    const entryIndex = entriesStore.entries.findIndex(e => e.id === entryId)
    if (entryIndex !== -1) {
      entriesStore.entries[entryIndex].logo_url = data.logoUrl
    }
  } catch (error) {
    console.error('Logo upload error:', error)
    // Don't throw - logo upload failure shouldn't break the flow
  }
}

async function deleteEntry(id) {
  if (confirm('Are you sure you want to delete this link?')) {
    try {
      await entriesStore.deleteEntry(id)
    } catch (error) {
      alert('Failed to delete link')
    }
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}

function getShortUrl(slug) {
  return `${import.meta.env.VITE_SHORT_URL || 'http://localhost:8787'}/${slug}`
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert('Copied to clipboard!'))
    .catch(() => alert('Failed to copy'))
}

function showQRCode(entry) {
  selectedEntry.value = entry
}

function editEntry(entry) {
  editingEntry.value = entry
}

function handleEntryUpdate(updatedEntry) {
  // Update the entry in the store
  const index = entriesStore.entries.findIndex(e => e.id === updatedEntry.id)
  if (index !== -1) {
    entriesStore.entries[index] = updatedEntry
  }
  
  // Update selected entry if it's the same one
  if (selectedEntry.value?.id === updatedEntry.id) {
    selectedEntry.value = updatedEntry
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  
  return date.toLocaleDateString()
}
</script>