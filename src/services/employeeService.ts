import { apiClient, unwrapResponse } from './apiClient'
import type { PageData } from '../types/api'
import type { EmployeeDto, EmployeeListQuery } from '../types/hrm'

export const employeeService = {
  getAll(query: EmployeeListQuery) {
    return unwrapResponse<PageData<EmployeeDto>>(apiClient.get('/employees', { params: query }))
  },
}
