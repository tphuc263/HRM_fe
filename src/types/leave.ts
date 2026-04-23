export interface LeaveTypeDto {
  id: number
  code: string
  name: string
  isPaid: boolean
  description?: string | null
}

export interface LeaveTypeUpsertPayload {
  code: string
  name: string
  isPaid: boolean
  description?: string
}

export interface LeaveRequestDto {
  id: number
  employeeId: number
  employeeCode: string
  employeeName: string
  leaveTypeId: number
  leaveTypeCode: string
  leaveTypeName: string
  isPaidLeave: boolean
  startDate: string
  endDate: string
  days: number
  reason: string
  attachmentUrl?: string | null
  status: string
  approvedByName?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface LeaveRequestCreatePayload {
  leaveTypeId: number
  startDate: string
  endDate: string
  days: number
  reason: string
  attachmentUrl?: string
}

export interface LeaveBalanceDto {
  id: number
  employeeId: number
  employeeCode: string
  employeeName: string
  leaveTypeId: number
  leaveTypeCode: string
  leaveTypeName: string
  year: number
  totalDays: number
  usedDays: number
  carryOverDays: number
  remainingDays: number
}

export interface LeaveRequestListQuery {
  status?: string
  leaveTypeId?: number
  keyword?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
