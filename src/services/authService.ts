import { apiClient } from './apiClient'
import type { LoginRequest, LoginResponse } from '../types/auth'

export const authService = {
  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>('/auth/login', payload)
  },
  me() {
    return apiClient.get<LoginResponse>('/auth/me')
  },
  forgotPassword(payload: { email: string; newPassword: string }) {
    return apiClient.post('/auth/forgot-password', payload)
  },
  verifyForgotPassword(payload: { email: string; otpCode: string }) {
    return apiClient.post('/auth/verify-forgot-password', payload)
  },
}
