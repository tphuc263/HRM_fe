import { apiClient, unwrapResponse } from './apiClient'
import type {
  AttendanceQueryRange,
  AttendanceRecordDto,
  AttendanceUpdatePayload,
  MonthlyStatsDto,
} from '../types/attendance'

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
  getMyRecords(range: AttendanceQueryRange) {
    return unwrapResponse<AttendanceRecordDto[]>(apiClient.get('/attendance/my-records', { params: range }))
  },
  getDaily(date: string) {
    return unwrapResponse<AttendanceRecordDto[]>(apiClient.get('/attendance/daily', { params: { date } }))
  },
  getEmployeeRecords(employeeId: number, range: AttendanceQueryRange) {
    return unwrapResponse<AttendanceRecordDto[]>(
      apiClient.get(`/attendance/employee/${employeeId}`, { params: range }),
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
