import axios from 'axios'
import type { ApiResponse } from '../types/api'
import { tokenStorage } from './tokenStorage'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export async function unwrapResponse<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise
  if (!response.data.success) {
    throw new Error(response.data.message || 'Yeu cau that bai')
  }
  return response.data.data
}
