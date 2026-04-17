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
  note?: string | null
  createdAt?: string
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
