import { apiClient, unwrapResponse } from './apiClient'
import type { OvertimeRequestRequest, OvertimeRequestResponse } from '../types/attendance'
import type { PageData } from '../types/api'

export const overtimeService = {
  createRequest(payload: OvertimeRequestRequest) {
    return unwrapResponse<OvertimeRequestResponse>(apiClient.post('/overtime-requests', payload))
  },

  getMyRequests(params: {
    status?: string
    keyword?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }) {
    return unwrapResponse<PageData<OvertimeRequestResponse>>(
      apiClient.get('/overtime-requests/my', { params }),
    )
  },

  getAllRequests(params: {
    status?: string
    keyword?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }) {
    return unwrapResponse<PageData<OvertimeRequestResponse>>(
      apiClient.get('/overtime-requests', { params }),
    )
  },

  approveRequest(id: number) {
    return unwrapResponse<OvertimeRequestResponse>(apiClient.put(`/overtime-requests/${id}/approve`))
  },

  rejectRequest(id: number, reason: string) {
    return unwrapResponse<OvertimeRequestResponse>(
      apiClient.put(`/overtime-requests/${id}/reject`, null, { params: { reason } }),
    )
  },

  cancelRequest(id: number) {
    return unwrapResponse<void>(apiClient.delete(`/overtime-requests/${id}`))
  },
}
