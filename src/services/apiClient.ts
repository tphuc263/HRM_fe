import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/api'
import { tokenStorage } from './tokenStorage'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

const instance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) {
      return message
    }
  }

  return (error as Error)?.message || 'Yêu cầu thất bại'
}

instance.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<any>
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        return Promise.reject(new Error(data.message || 'Yêu cầu thất bại'))
      }
      return data.data
    }
    return response.data
  },
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(new Error(parseApiError(error)))
  },
)

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => instance.get<any, T>(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => instance.post<any, T>(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => instance.put<any, T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => instance.delete<any, T>(url, config),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => instance.patch<any, T>(url, data, config),
}
