import { apiClient, unwrapResponse } from './apiClient'
import type { DepartmentDto } from '../types/hrm'

export const departmentService = {
  getAll() {
    return unwrapResponse<DepartmentDto[]>(apiClient.get('/departments'))
  },
}
