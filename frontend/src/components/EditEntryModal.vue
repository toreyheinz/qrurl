<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-start mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Edit Link</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition"
        >
          <XIcon class="h-6 w-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="My awesome link"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Slug (cannot be changed)
            </label>
            <input
              :value="entry.slug"
              type="text"
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Destination URL
          </label>
          <input
            v-model="formData.url"
            type="url"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com"
          />
        </div>

        <!-- Logo Management -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium text-gray-700 mb-3">Logo for QR Code</h4>
          <LogoUploader 
            :entry="entry" 
            @update="handleLogoUpdate"
          />
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { X as XIcon } from 'lucide-vue-next'
import { useEntriesStore } from '../stores/entries'
import LogoUploader from './LogoUploader.vue'

const props = defineProps({
  entry: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'update'])

const entriesStore = useEntriesStore()
const saving = ref(false)

const formData = reactive({
  name: '',
  url: ''
})

onMounted(() => {
  // Initialize form with current values
  formData.name = props.entry.name
  formData.url = props.entry.original_url || props.entry.url
})

async function handleSubmit() {
  saving.value = true
  try {
    await entriesStore.updateEntry(props.entry.id, {
      name: formData.name,
      url: formData.url
    })
    
    // Update local entry
    const updatedEntry = {
      ...props.entry,
      name: formData.name,
      original_url: formData.url
    }
    
    emit('update', updatedEntry)
    emit('close')
    
    alert('Link updated successfully!')
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to update link')
  } finally {
    saving.value = false
  }
}

function handleLogoUpdate(updatedEntry) {
  // Update the entry with new logo information
  emit('update', updatedEntry)
}
</script>