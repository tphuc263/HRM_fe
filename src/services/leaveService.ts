import { apiClient, unwrapResponse } from './apiClient'
import type {
  LeaveBalanceDto,
  LeaveRequestCreatePayload,
  LeaveRequestDto,
  LeaveTypeDto,
} from '../types/leave'

export const leaveService = {
  getLeaveTypes() {
    return unwrapResponse<LeaveTypeDto[]>(apiClient.get('/leave-types'))
  },
  getMyRequests() {
    return unwrapResponse<LeaveRequestDto[]>(apiClient.get('/leave-requests/my'))
  },
  getPendingRequests() {
    return unwrapResponse<LeaveRequestDto[]>(apiClient.get('/leave-requests/pending'))
  },
  getAllRequests(status?: string) {
    return unwrapResponse<LeaveRequestDto[]>(apiClient.get('/leave-requests', { params: { status } }))
  },
  submitRequest(payload: LeaveRequestCreatePayload) {
    return unwrapResponse<LeaveRequestDto>(apiClient.post('/leave-requests', payload))
  },
  cancelRequest(id: number) {
    return unwrapResponse<LeaveRequestDto>(apiClient.put(`/leave-requests/${id}/cancel`))
  },
  approveRequest(id: number) {
    return unwrapResponse<LeaveRequestDto>(apiClient.put(`/leave-requests/${id}/approve`))
  },
  rejectRequest(id: number, reason: string) {
    return unwrapResponse<LeaveRequestDto>(
      apiClient.put(`/leave-requests/${id}/reject`, null, { params: { reason } }),
    )
  },
  getMyBalances(year: number) {
    return unwrapResponse<LeaveBalanceDto[]>(apiClient.get('/leave-balances/my', { params: { year } }))
  },
}
