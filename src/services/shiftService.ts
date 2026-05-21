import { apiClient } from './apiClient'
import type { ShiftDto, ShiftUpsertPayload } from '../types/attendance'

export const shiftService = {
  getAll() {
    return apiClient.get<ShiftDto[]>('/shifts')
  },
  create(payload: ShiftUpsertPayload) {
    return apiClient.post<ShiftDto>('/shifts', payload)
  },
  update(id: number, payload: ShiftUpsertPayload) {
    return apiClient.put<ShiftDto>(`/shifts/${id}`, payload)
  },
  delete(id: number) {
    return apiClient.delete<void>(`/shifts/${id}`)
  },
}
