import { apiClient, unwrapResponse } from './apiClient'
import type {
  AttendanceListQuery,
  AttendanceRecordDto,
  AttendanceUpdatePayload,
  DailyAttendanceQuery,
  MonthlyStatsDto,
} from '../types/attendance'
import type { PageData } from '../types/api'

export const attendanceService = {
  checkIn() {
    return unwrapResponse<AttendanceRecordDto>(apiClient.post('/attendance/check-in'))
  },
  checkOut() {
    return unwrapResponse<AttendanceRecordDto>(apiClient.post('/attendance/check-out'))
  },
  getToday() {
    return unwrapResponse<AttendanceRecordDto>(apiClient.get('/attendance/today'))
  },
  getMyRecords(query: AttendanceListQuery) {
    return unwrapResponse<PageData<AttendanceRecordDto>>(apiClient.get('/attendance/my-records', { params: query }))
  },
  getDaily(query: DailyAttendanceQuery) {
    return unwrapResponse<PageData<AttendanceRecordDto>>(apiClient.get('/attendance/daily', { params: query }))
  },
  getEmployeeRecords(employeeId: number, query: AttendanceListQuery) {
    return unwrapResponse<PageData<AttendanceRecordDto>>(
      apiClient.get(`/attendance/employee/${employeeId}`, { params: query }),
    )
  },
  getMonthlyStats(employeeId: number, month: number, year: number) {
    return unwrapResponse<MonthlyStatsDto>(
      apiClient.get(`/attendance/stats/${employeeId}`, { params: { month, year } }),
    )
  },
  adminUpdate(recordId: number, payload: AttendanceUpdatePayload) {
    return unwrapResponse<AttendanceRecordDto>(apiClient.put(`/attendance/${recordId}`, payload))
  },
  markAbsent(employeeId: number, date: string, note?: string) {
    return unwrapResponse<AttendanceRecordDto>(
      apiClient.post('/attendance/mark-absent', null, {
        params: {
          employeeId,
          date,
          note: note || undefined,
        },
      }),
    )
  },
}
