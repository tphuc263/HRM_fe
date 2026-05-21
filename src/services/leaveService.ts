import { apiClient } from './apiClient'
import type {
  LeaveBalanceDto,
  LeaveRequestCreatePayload,
  LeaveRequestDto,
  LeaveRequestListQuery,
  LeaveTypeDto,
  LeaveTypeUpsertPayload,
} from '../types/leave'
import type { PageData } from '../types/api'

export const leaveService = {
  getLeaveTypes() {
    return apiClient.get<LeaveTypeDto[]>('/leave-types')
  },
  createLeaveType(payload: LeaveTypeUpsertPayload) {
    return apiClient.post<LeaveTypeDto>('/leave-types', payload)
  },
  updateLeaveType(id: number, payload: LeaveTypeUpsertPayload) {
    return apiClient.put<LeaveTypeDto>(`/leave-types/${id}`, payload)
  },
  getMyRequests(query?: LeaveRequestListQuery) {
    return apiClient.get<PageData<LeaveRequestDto>>('/leave-requests/my', { params: query })
  },
  getPendingRequests(query?: LeaveRequestListQuery) {
    return apiClient.get<PageData<LeaveRequestDto>>('/leave-requests/pending', { params: query })
  },
  getAllRequests(query?: LeaveRequestListQuery) {
    return apiClient.get<PageData<LeaveRequestDto>>('/leave-requests', { params: query })
  },
  submitRequest(payload: LeaveRequestCreatePayload) {
    return apiClient.post<LeaveRequestDto>('/leave-requests', payload)
  },
  cancelRequest(id: number) {
    return apiClient.put<LeaveRequestDto>(`/leave-requests/${id}/cancel`)
  },
  approveRequest(id: number) {
    return apiClient.put<LeaveRequestDto>(`/leave-requests/${id}/approve`)
  },
  rejectRequest(id: number, reason: string) {
    return apiClient.put<LeaveRequestDto>(`/leave-requests/${id}/reject`, null, { params: { reason } })
  },
  getMyBalances(year: number) {
    return apiClient.get<LeaveBalanceDto[]>('/leave-balances/my', { params: { year } })
  },
  getEmployeeBalances(employeeId: number, year: number) {
    return apiClient.get<LeaveBalanceDto[]>(`/leave-balances/employee/${employeeId}`, { params: { year } })
  },
  initBalance(employeeId: number, year: number) {
    return apiClient.post<void>('/leave-balances/init', null, { params: { employeeId, year } })
  },
  updateBalance(id: number, totalDays?: number, carryOverDays?: number) {
    return apiClient.put<LeaveBalanceDto>(`/leave-balances/${id}`, null, {
            params: {
              totalDays,
              carryOverDays,
            },
          })
  },
}
