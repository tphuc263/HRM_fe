import { apiClient } from './apiClient'
import type { HolidayDto, HolidayUpsertPayload } from '../types/attendance'

export const holidayService = {
  getAll() {
    return apiClient.get<HolidayDto[]>('/holidays')
  },
  create(payload: HolidayUpsertPayload) {
    return apiClient.post<HolidayDto>('/holidays', payload)
  },
  createBatch(payloads: HolidayUpsertPayload[]) {
    return apiClient.post<HolidayDto[]>('/holidays/batch', payloads)
  },
  update(id: number, payload: HolidayUpsertPayload) {
    return apiClient.put<HolidayDto>(`/holidays/${id}`, payload)
  },
  delete(id: number) {
    return apiClient.delete<void>(`/holidays/${id}`)
  },
}
