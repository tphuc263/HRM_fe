import { apiClient } from './apiClient'
import type {
  AttendanceListQuery,
  AttendanceRecordDto,
  AttendanceUpdatePayload,
  DailyAttendanceQuery,
  MonthlyStatsDto,
} from '../types/attendance'
import type { PageData } from '../types/api'

export const attendanceService = {
  checkIn(payload?: { latitude?: number; longitude?: number }) {
    return apiClient.post<AttendanceRecordDto>('/attendance/check-in', payload)
  },
  checkOut(payload?: { latitude?: number; longitude?: number }) {
    return apiClient.post<AttendanceRecordDto>('/attendance/check-out', payload)
  },
  getToday() {
    return apiClient.get<AttendanceRecordDto>('/attendance/today')
  },
  getMyRecords(query: AttendanceListQuery) {
    return apiClient.get<PageData<AttendanceRecordDto>>('/attendance/my-records', { params: query })
  },
  getDaily(query: DailyAttendanceQuery) {
    return apiClient.get<PageData<AttendanceRecordDto>>('/attendance/daily', { params: query })
  },
  getRange(query: { fromDate: string; toDate: string; status?: string; keyword?: string; page?: number; size?: number; sortBy?: string; sortDir?: string }) {
    return apiClient.get<PageData<AttendanceRecordDto>>('/attendance/range', { params: query })
  },
  getEmployeeRecords(employeeId: number, query: AttendanceListQuery) {
    return apiClient.get<PageData<AttendanceRecordDto>>(`/attendance/employee/${employeeId}`, { params: query })
  },
  getMonthlyStats(employeeId: number, month: number, year: number) {
    return apiClient.get<MonthlyStatsDto>(`/attendance/stats/${employeeId}`, { params: { month, year } })
  },
  adminUpdate(recordId: number, payload: AttendanceUpdatePayload) {
    return apiClient.put<AttendanceRecordDto>(`/attendance/${recordId}`, payload)
  },
  markAbsent(employeeId: number, date: string, note?: string) {
    return apiClient.post<AttendanceRecordDto>('/attendance/mark-absent', null, {
            params: {
              employeeId,
              date,
              note: note || undefined,
            },
          })
  },
}
