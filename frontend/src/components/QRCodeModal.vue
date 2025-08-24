<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-semibold text-gray-900">QR Code</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition"
        >
          <XIcon class="h-6 w-6" />
        </button>
      </div>

      <div class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600 mb-2">{{ entry.name }}</p>
          <p class="text-xs text-gray-500">{{ shortUrl }}</p>
        </div>

        <div class="flex justify-center">
          <div v-if="loading" class="py-8">
            <Loader2Icon class="h-8 w-8 text-gray-400 animate-spin" />
          </div>
          <img
            v-else
            :src="qrCodeUrl"
            alt="QR Code"
            class="w-64 h-64"
          />
        </div>

        <div class="flex space-x-3">
          <button
            @click="downloadQR"
            class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center"
          >
            <DownloadIcon class="h-4 w-4 mr-2" />
            Download
          </button>
          <button
            @click="copyQR"
            class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center"
          >
            <CopyIcon class="h-4 w-4 mr-2" />
            Copy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X as XIcon, Loader2 as Loader2Icon, Download as DownloadIcon, Copy as CopyIcon } from 'lucide-vue-next'
import { generateQRCodeWithLogo } from '../services/qrcode'

const props = defineProps({
  entry: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const loading = ref(true)
const qrCodeUrl = ref('')

const shortUrl = computed(() => {
  return `${import.meta.env.VITE_SHORT_URL || 'http://localhost:8787'}/${props.entry.slug}`
})

onMounted(async () => {
  try {
    // Get full logo URL if logo exists
    const logoUrl = props.entry.logo_url ? getFullLogoUrl(props.entry.logo_url) : null
    qrCodeUrl.value = await generateQRCodeWithLogo(shortUrl.value, logoUrl)
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    // Try without logo as fallback
    const { default: QRCode } = await import('qrcode')
    qrCodeUrl.value = await QRCode.toDataURL(shortUrl.value, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2
    })
  } finally {
    loading.value = false
  }
})

function getFullLogoUrl(logoUrl) {
  // If it's a relative URL starting with /api/logo, prepend the backend URL
  if (logoUrl?.startsWith('/api/logo')) {
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8787'}${logoUrl}`
  }
  return logoUrl
}

function downloadQR() {
  const link = document.createElement('a')
  link.download = `qr-${props.entry.slug}.png`
  link.href = qrCodeUrl.value
  link.click()
}

async function copyQR() {
  try {
    const blob = await fetch(qrCodeUrl.value).then(r => r.blob())
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    alert('QR code copied to clipboard!')
  } catch (error) {
    alert('Failed to copy QR code')
  }
}
</script>