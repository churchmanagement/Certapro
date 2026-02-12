import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // Try to refresh token
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        })

        // Update tokens
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken
        )

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        useAuthStore.getState().clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
