import { apiClient } from './apiClient'
import type { DepartmentDto, DepartmentUpsertPayload } from '../types/hrm'

export const departmentService = {
  getAll() {
    return apiClient.get<DepartmentDto[]>('/departments')
  },
  create(payload: DepartmentUpsertPayload) {
    return apiClient.post<DepartmentDto>('/departments', payload)
  },
  update(id: number, payload: DepartmentUpsertPayload) {
    return apiClient.put<DepartmentDto>(`/departments/${id}`, payload)
  },
  delete(id: number) {
    return apiClient.delete<void>(`/departments/${id}`)
  },
}
