import { apiClient, unwrapResponse } from './apiClient'
import type { LoginRequest, LoginResponse } from '../types/auth'

export const authService = {
  login(payload: LoginRequest) {
    return unwrapResponse<LoginResponse>(apiClient.post('/auth/login', payload))
  },
  me() {
    return unwrapResponse<LoginResponse>(apiClient.get('/auth/me'))
  },
}
