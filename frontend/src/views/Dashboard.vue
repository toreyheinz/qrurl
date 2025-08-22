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
  Trash2 as TrashIcon
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useEntriesStore } from '../stores/entries'
import QRCodeModal from '../components/QRCodeModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const entriesStore = useEntriesStore()

const loading = ref(true)
const creating = ref(false)
const selectedEntry = ref(null)

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
    await entriesStore.createEntry(newEntry.value)
    newEntry.value = { name: '', url: '', customSlug: '' }
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to create link')
  } finally {
    creating.value = false
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