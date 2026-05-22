export interface AttendanceRecordDto {
  id?: number
  employeeId: number
  employeeCode: string
  employeeName: string
  date: string
  checkIn?: string | null
  checkOut?: string | null
  status?: string | null
  overtimeHours?: number | null
  workHours?: number | null
  lateMinutes?: number | null
  earlyLeaveMinutes?: number | null
  checkInIp?: string | null
  checkInLat?: number | null
  checkInLng?: number | null
  checkOutIp?: string | null
  checkOutLat?: number | null
  checkOutLng?: number | null
  checkInGpsValid?: boolean | null
  checkInIpValid?: boolean | null
  checkOutGpsValid?: boolean | null
  checkOutIpValid?: boolean | null
  note?: string | null
  createdAt?: string
}

export interface ShiftDto {
  id: number
  code: string
  name: string
  startTime: string
  endTime: string
  breakStartTime?: string | null
  breakEndTime?: string | null
  isDefault: boolean
  isActive: boolean
}

export interface ShiftUpsertPayload {
  code: string
  name: string
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  isDefault: boolean
  isActive: boolean
}

export interface HolidayDto {
  id: number
  name: string
  date: string
  isPaid: boolean
}

export interface HolidayUpsertPayload {
  name: string
  date: string
  isPaid: boolean
}

export interface MonthlyStatsDto {
  employeeId: number
  employeeCode: string
  employeeName: string
  month: number
  year: number
  totalWorkDays: number
  lateCount: number
  totalOvertimeHours: number
}

export interface AttendanceUpdatePayload {
  employeeId?: number
  date?: string
  checkIn?: string
  checkOut?: string
  status?: string
  note?: string
}

export interface AbsentMarkPayload {
  employeeId: number
  date: string
  note?: string
}

export interface AttendanceQueryRange {
  from: string
  to: string
}

export interface AttendanceListQuery extends AttendanceQueryRange {
  status?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface DailyAttendanceQuery {
  date: string
  keyword?: string
  status?: string
  hasOvertime?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface OvertimeRequestResponse {
  id: number
  employeeId: number
  employeeCode: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  approvedByName?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface OvertimeRequestRequest {
  date: string
  startTime: string
  endTime: string
  reason: string
}

