/**
 * Auth Store (Zustand)
 * Manages current user session, login, logout
 */

import { create } from 'zustand'
import api from './api'

const useAuthStore = create((set, get) => ({
  user:  JSON.parse(localStorage.getItem('erp_user') || 'null'),
  token: localStorage.getItem('erp_token') || null,
  loading: false,

  /**
   * Lightweight session for client dashboard (no password).
   */
  loginAsClient: async (registerNumber) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login-register', {
        accountType: 'client',
        registerNumber,
      })
      localStorage.setItem('erp_token', data.token)
      localStorage.setItem('erp_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return {
        success: false,
        error: err.response?.data?.error || 'فشل تسجيل الدخول',
      }
    }
  },

  /**
   * Lightweight session for user dashboard (password required).
   */
  loginAsUser: async (registerNumber, password) => {
    set({ loading: true })
    try {
      if (!password) {
        return { success: false, error: 'Password is required' }
      }

      const { data } = await api.post('/auth/login-register', {
        accountType: 'user',
        registerNumber,
        password,
      })
      localStorage.setItem('erp_token', data.token)
      localStorage.setItem('erp_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return {
        success: false,
        error: err.response?.data?.error || 'فشل تسجيل الدخول',
      }
    }
  },

  /**
   * Login: POST /api/auth/login
   * Persists token + user to localStorage
   */
  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('erp_token', data.token)
      localStorage.setItem('erp_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return {
        success: false,
        error: err.response?.data?.error || 'Login failed',
      }
    }
  },

  /**
   * Logout: clear session
   */
  logout: () => {
    localStorage.removeItem('erp_token')
    localStorage.removeItem('erp_user')
    set({ user: null, token: null })
  },

  /**
   * Check if current user has a given role
   */
  hasRole: (...roles) => {
    const user = get().user
    return user ? roles.includes(user.role) : false
  },
}))

export default useAuthStore
