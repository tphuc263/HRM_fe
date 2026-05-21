import { apiClient } from './apiClient'
import type { OvertimeRequestRequest, OvertimeRequestResponse } from '../types/attendance'
import type { PageData } from '../types/api'

export const overtimeService = {
  createRequest(payload: OvertimeRequestRequest) {
    return apiClient.post<OvertimeRequestResponse>('/overtime-requests', payload)
  },

  getMyRequests(params: {
    status?: string
    keyword?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }) {
    return apiClient.get<PageData<OvertimeRequestResponse>>('/overtime-requests/my', { params })
  },

  getAllRequests(params: {
    status?: string
    keyword?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }) {
    return apiClient.get<PageData<OvertimeRequestResponse>>('/overtime-requests', { params })
  },

  approveRequest(id: number) {
    return apiClient.put<OvertimeRequestResponse>(`/overtime-requests/${id}/approve`)
  },

  rejectRequest(id: number, reason: string) {
    return apiClient.put<OvertimeRequestResponse>(`/overtime-requests/${id}/reject`, null, { params: { reason } })
  },

  cancelRequest(id: number) {
    return apiClient.delete<void>(`/overtime-requests/${id}`)
  },
}
