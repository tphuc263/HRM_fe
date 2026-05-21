import { apiClient } from './apiClient'
import type { ContractDto, ContractUpsertPayload } from '../types/hrm'

export const contractService = {
  create(payload: ContractUpsertPayload) {
    return apiClient.post<ContractDto>('/contracts', payload)
  },
  update(id: number, payload: ContractUpsertPayload) {
    return apiClient.put<ContractDto>(`/contracts/${id}`, payload)
  },
  activate(id: number) {
    return apiClient.put<ContractDto>(`/contracts/${id}/activate`)
  },
  terminate(id: number) {
    return apiClient.put<ContractDto>(`/contracts/${id}/terminate`)
  },
  getById(id: number) {
    return apiClient.get<ContractDto>(`/contracts/${id}`)
  },
  getByEmployee(employeeId: number) {
    return apiClient.get<ContractDto[]>(`/contracts/employee/${employeeId}`)
  },
  getActiveContract(employeeId: number) {
    return apiClient.get<ContractDto>(`/contracts/employee/${employeeId}/active`)
  },
  getExpiring(days: number = 30) {
    return apiClient.get<ContractDto[]>('/contracts/expiring', { params: { days } })
  },
}
