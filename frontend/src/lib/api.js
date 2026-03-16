/**
 * API Client
 * Axios instance with auth token injection and error handling
 */

import axios from 'axios'
import toast from 'react-hot-toast'

const rawBase = import.meta.env.VITE_API_URL
const normalizedBase = rawBase ? rawBase.replace(/\/+$/, '') : ''

const api = axios.create({
  baseURL: normalizedBase
    ? `${normalizedBase}/api`
    : '/api',
  timeout: 15_000,
})

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const requestUrl = err.config?.url || ''
    const isAuthCall =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/login-register')

    if (status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      const alreadyOnLogin = window.location?.pathname === '/login'
      if (!alreadyOnLogin && !isAuthCall) {
        window.location.href = '/login'
      }
    } else if (status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(err)
  }
)

export default api
