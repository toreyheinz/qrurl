<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="flex items-center space-x-2">
              <LinkIcon class="h-6 w-6 text-indigo-600" />
              <span class="text-xl font-bold text-gray-900">QRurl</span>
            </router-link>
            <span class="text-gray-400">/</span>
            <span class="text-gray-600">Analytics</span>
          </div>
          
          <router-link
            to="/dashboard"
            class="text-gray-500 hover:text-gray-700 transition flex items-center space-x-2"
          >
            <ArrowLeftIcon class="h-4 w-4" />
            <span>Back to Dashboard</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="bg-white rounded-lg shadow-sm p-8">
        <div class="text-center">
          <Loader2Icon class="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p class="text-gray-500">Loading analytics...</p>
        </div>
      </div>

      <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-8">
        <div class="text-center">
          <AlertCircleIcon class="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p class="text-gray-900 font-semibold">Failed to load analytics</p>
          <p class="text-gray-500 mt-1">{{ error }}</p>
        </div>
      </div>

      <div v-else>
        <!-- Link Info -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ analyticsData.entry.name }}</h1>
          <div class="space-y-2">
            <p class="text-sm text-gray-600">
              <span class="font-medium">Short URL:</span>
              <a :href="getShortUrl(analyticsData.entry.slug)" target="_blank" class="text-indigo-600 hover:text-indigo-700 ml-2">
                {{ getShortUrl(analyticsData.entry.slug) }}
              </a>
            </p>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Clicks</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ analyticsData.entry.clickCount || 0 }}</p>
              </div>
              <div class="p-3 bg-indigo-100 rounded-lg">
                <MousePointerClickIcon class="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ uniqueVisitors }}</p>
              </div>
              <div class="p-3 bg-green-100 rounded-lg">
                <UsersIcon class="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Countries</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ uniqueCountries }}</p>
              </div>
              <div class="p-3 bg-purple-100 rounded-lg">
                <GlobeIcon class="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <!-- Clicks by Date -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Clicks Over Time</h2>
          <div v-if="analyticsData.analytics.length === 0" class="text-center py-8 text-gray-500">
            No click data available yet
          </div>
          <div v-else class="space-y-2">
            <div v-for="day in clicksByDate" :key="day.date" class="flex items-center">
              <span class="text-sm text-gray-600 w-24">{{ formatDate(day.date) }}</span>
              <div class="flex-1 mx-4">
                <div class="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-indigo-600 rounded-full"
                    :style="`width: ${(day.clicks / maxClicks) * 100}%`"
                  ></div>
                </div>
              </div>
              <span class="text-sm font-medium text-gray-900 w-12 text-right">{{ day.clicks }}</span>
            </div>
          </div>
        </div>

        <!-- Countries -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold mb-4">Top Countries</h2>
          <div v-if="countriesData.length === 0" class="text-center py-8 text-gray-500">
            No geographic data available yet
          </div>
          <div v-else class="space-y-3">
            <div v-for="country in countriesData" :key="country.name" class="flex items-center justify-between">
              <span class="text-sm text-gray-700">{{ country.name || 'Unknown' }}</span>
              <span class="text-sm font-medium text-gray-900">{{ country.clicks }} clicks</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Link as LinkIcon,
  ArrowLeft as ArrowLeftIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  MousePointerClick as MousePointerClickIcon,
  Users as UsersIcon,
  Globe as GlobeIcon
} from 'lucide-vue-next'
import { useEntriesStore } from '../stores/entries'

const route = useRoute()
const entriesStore = useEntriesStore()

const loading = ref(true)
const error = ref('')
const analyticsData = ref(null)

const uniqueVisitors = computed(() => {
  if (!analyticsData.value?.analytics) return 0
  const unique = new Set(analyticsData.value.analytics.map(a => a.ip_hash))
  return unique.size
})

const uniqueCountries = computed(() => {
  if (!analyticsData.value?.analytics) return 0
  const countries = new Set(analyticsData.value.analytics.map(a => a.country).filter(Boolean))
  return countries.size
})

const clicksByDate = computed(() => {
  if (!analyticsData.value?.analytics) return []
  
  const grouped = {}
  analyticsData.value.analytics.forEach(item => {
    const date = item.date
    if (!grouped[date]) {
      grouped[date] = 0
    }
    grouped[date] += item.clicks || 1
  })
  
  return Object.entries(grouped)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7)
})

const maxClicks = computed(() => {
  return Math.max(...clicksByDate.value.map(d => d.clicks), 1)
})

const countriesData = computed(() => {
  if (!analyticsData.value?.analytics) return []
  
  const grouped = {}
  analyticsData.value.analytics.forEach(item => {
    const country = item.country || 'Unknown'
    if (!grouped[country]) {
      grouped[country] = 0
    }
    grouped[country] += item.clicks || 1
  })
  
  return Object.entries(grouped)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
})

onMounted(async () => {
  try {
    const id = route.params.id
    analyticsData.value = await entriesStore.fetchAnalytics(id)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load analytics'
  } finally {
    loading.value = false
  }
})

function getShortUrl(slug) {
  return `${import.meta.env.VITE_SHORT_URL || 'http://localhost:8787'}/${slug}`
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>