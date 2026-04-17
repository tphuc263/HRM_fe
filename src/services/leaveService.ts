import { apiClient, unwrapResponse } from './apiClient'
import type {
  LeaveBalanceDto,
  LeaveRequestCreatePayload,
  LeaveRequestDto,
  LeaveRequestListQuery,
  LeaveTypeDto,
} from '../types/leave'
import type { PageData } from '../types/api'

export const leaveService = {
  getLeaveTypes() {
    return unwrapResponse<LeaveTypeDto[]>(apiClient.get('/leave-types'))
  },
  getMyRequests(query?: LeaveRequestListQuery) {
    return unwrapResponse<PageData<LeaveRequestDto>>(apiClient.get('/leave-requests/my', { params: query }))
  },
  getPendingRequests(query?: LeaveRequestListQuery) {
    return unwrapResponse<PageData<LeaveRequestDto>>(apiClient.get('/leave-requests/pending', { params: query }))
  },
  getAllRequests(query?: LeaveRequestListQuery) {
    return unwrapResponse<PageData<LeaveRequestDto>>(apiClient.get('/leave-requests', { params: query }))
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
  getEmployeeBalances(employeeId: number, year: number) {
    return unwrapResponse<LeaveBalanceDto[]>(
      apiClient.get(`/leave-balances/employee/${employeeId}`, { params: { year } }),
    )
  },
  initBalance(employeeId: number, year: number) {
    return unwrapResponse<void>(apiClient.post('/leave-balances/init', null, { params: { employeeId, year } }))
  },
  updateBalance(id: number, totalDays?: number, carryOverDays?: number) {
    return unwrapResponse<LeaveBalanceDto>(
      apiClient.put(`/leave-balances/${id}`, null, {
        params: {
          totalDays,
          carryOverDays,
        },
      }),
    )
  },
}
