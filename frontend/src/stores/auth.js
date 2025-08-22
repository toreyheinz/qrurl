import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function requestMagicLink(email) {
    const response = await api.post('/auth/request', { email })
    return response.data
  }

  async function verifyMagicLink(verifyToken) {
    const response = await api.post('/auth/verify', { token: verifyToken })
    const { token: authToken, user: userData } = response.data
    
    token.value = authToken
    user.value = userData
    
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
    
    return response.data
  }

  function logout() {
    token.value = null
    user.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    delete api.defaults.headers.common['Authorization']
  }

  // Initialize auth header if token exists
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return {
    token,
    user,
    isAuthenticated,
    requestMagicLink,
    verifyMagicLink,
    logout
  }
})