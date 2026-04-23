import { apiClient, unwrapResponse } from './apiClient'
import type { ContractDto, ContractUpsertPayload } from '../types/hrm'

export const contractService = {
  create(payload: ContractUpsertPayload) {
    return unwrapResponse<ContractDto>(apiClient.post('/contracts', payload))
  },
  update(id: number, payload: ContractUpsertPayload) {
    return unwrapResponse<ContractDto>(apiClient.put(`/contracts/${id}`, payload))
  },
  activate(id: number) {
    return unwrapResponse<ContractDto>(apiClient.put(`/contracts/${id}/activate`))
  },
  terminate(id: number) {
    return unwrapResponse<ContractDto>(apiClient.put(`/contracts/${id}/terminate`))
  },
  getById(id: number) {
    return unwrapResponse<ContractDto>(apiClient.get(`/contracts/${id}`))
  },
  getByEmployee(employeeId: number) {
    return unwrapResponse<ContractDto[]>(apiClient.get(`/contracts/employee/${employeeId}`))
  },
  getActiveContract(employeeId: number) {
    return unwrapResponse<ContractDto>(apiClient.get(`/contracts/employee/${employeeId}/active`))
  },
  getExpiring(days: number = 30) {
    return unwrapResponse<ContractDto[]>(apiClient.get('/contracts/expiring', { params: { days } }))
  },
}
