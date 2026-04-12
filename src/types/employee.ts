export interface Employee {
  id: string
  employeeCode: string
  attendanceCode: string
  fullName: string
  email: string
  phone: string
  department: string
  workGroup: string
  position: string
  nationality: string
  startDate: string
  status: 'active' | 'inactive' | 'probation'
}

export interface FilterParams {
  search: string
  position: string
  workplace: string
  nationality: string
  department: string
  status: string
}

export interface PaginationInfo {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

