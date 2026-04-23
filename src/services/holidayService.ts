import { apiClient, unwrapResponse } from './apiClient'
import type { HolidayDto, HolidayUpsertPayload } from '../types/attendance'

export const holidayService = {
  getAll() {
    return unwrapResponse<HolidayDto[]>(apiClient.get('/holidays'))
  },
  create(payload: HolidayUpsertPayload) {
    return unwrapResponse<HolidayDto>(apiClient.post('/holidays', payload))
  },
  update(id: number, payload: HolidayUpsertPayload) {
    return unwrapResponse<HolidayDto>(apiClient.put(`/holidays/${id}`, payload))
  },
  delete(id: number) {
    return unwrapResponse<void>(apiClient.delete(`/holidays/${id}`))
  },
}
