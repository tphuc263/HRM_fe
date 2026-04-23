import { apiClient, unwrapResponse } from './apiClient'
import type { ShiftDto, ShiftUpsertPayload } from '../types/attendance'

export const shiftService = {
  getAll() {
    return unwrapResponse<ShiftDto[]>(apiClient.get('/shifts'))
  },
  create(payload: ShiftUpsertPayload) {
    return unwrapResponse<ShiftDto>(apiClient.post('/shifts', payload))
  },
  update(id: number, payload: ShiftUpsertPayload) {
    return unwrapResponse<ShiftDto>(apiClient.put(`/shifts/${id}`, payload))
  },
  delete(id: number) {
    return unwrapResponse<void>(apiClient.delete(`/shifts/${id}`))
  },
}
