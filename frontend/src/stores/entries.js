import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchEntries() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/entries')
      entries.value = response.data.entries
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch entries'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEntry(data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/entries', data)
      entries.value.unshift(response.data.entry)
      return response.data.entry
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create entry'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEntry(id, data) {
    loading.value = true
    error.value = null
    try {
      await api.put(`/entries/${id}`, data)
      const index = entries.value.findIndex(e => e.id === id)
      if (index !== -1) {
        entries.value[index] = { ...entries.value[index], ...data }
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update entry'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEntry(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/entries/${id}`)
      entries.value = entries.value.filter(e => e.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete entry'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAnalytics(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/analytics/${id}`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch analytics'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    loading,
    error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    fetchAnalytics
  }
})