import { apiClient, unwrapResponse } from './apiClient'
import type { DepartmentDto, DepartmentUpsertPayload } from '../types/hrm'

export const departmentService = {
  getAll() {
    return unwrapResponse<DepartmentDto[]>(apiClient.get('/departments'))
  },
  create(payload: DepartmentUpsertPayload) {
    return unwrapResponse<DepartmentDto>(apiClient.post('/departments', payload))
  },
  update(id: number, payload: DepartmentUpsertPayload) {
    return unwrapResponse<DepartmentDto>(apiClient.put(`/departments/${id}`, payload))
  },
  delete(id: number) {
    return unwrapResponse<void>(apiClient.delete(`/departments/${id}`))
  },
}
