import { apiClient, unwrapResponse } from './apiClient'
import type { PageData } from '../types/api'
import type { EmployeeDto, EmployeeListQuery, EmployeeUpsertPayload } from '../types/hrm'

export const employeeService = {
  getAll(query: EmployeeListQuery) {
    return unwrapResponse<PageData<EmployeeDto>>(apiClient.get('/employees', { params: query }))
  },
  getById(id: number) {
    return unwrapResponse<EmployeeDto>(apiClient.get(`/employees/${id}`))
  },
  create(payload: EmployeeUpsertPayload) {
    return unwrapResponse<EmployeeDto>(apiClient.post('/employees', payload))
  },
  update(id: number, payload: EmployeeUpsertPayload) {
    return unwrapResponse<EmployeeDto>(apiClient.put(`/employees/${id}`, payload))
  },
  resign(id: number, resignationDate?: string) {
    return unwrapResponse<void>(
      apiClient.put(`/employees/${id}/resign`, null, {
        params: resignationDate ? { resignationDate } : undefined,
      }),
    )
  },
  delete(id: number) {
    return unwrapResponse<void>(apiClient.delete(`/employees/${id}`))
  },
}
