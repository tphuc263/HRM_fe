import { apiClient } from './apiClient'
import type { LoginRequest, LoginResponse } from '../types/auth'

export const authService = {
  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>('/auth/login', payload)
  },
  me() {
    return apiClient.get<LoginResponse>('/auth/me')
  },
}
