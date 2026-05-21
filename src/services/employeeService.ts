import { apiClient } from './apiClient'
import type { PageData } from '../types/api'
import type { EmployeeDto, EmployeeListQuery, EmployeeUpsertPayload } from '../types/hrm'

export const employeeService = {
  getAll(query: EmployeeListQuery) {
    return apiClient.get<PageData<EmployeeDto>>('/employees', { params: query })
  },
  getById(id: number) {
    return apiClient.get<EmployeeDto>(`/employees/${id}`)
  },
  create(payload: EmployeeUpsertPayload) {
    return apiClient.post<EmployeeDto>('/employees', payload)
  },
  update(id: number, payload: EmployeeUpsertPayload) {
    return apiClient.put<EmployeeDto>(`/employees/${id}`, payload)
  },
  resign(id: number, resignationDate?: string) {
    return apiClient.put<void>(`/employees/${id}/resign`, null, {
            params: resignationDate ? { resignationDate } : undefined,
          })
  },
  delete(id: number) {
    return apiClient.delete<void>(`/employees/${id}`)
  },
}
