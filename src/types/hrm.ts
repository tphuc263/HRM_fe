export interface EmployeeDto {
  id: number
  code: string
  name: string
  avatar?: string | null
  email?: string | null
  phone?: string | null
  birthday?: string | null
  address?: string | null
  joinDate?: string | null
  departmentId?: number | null
  departmentName?: string | null
  status: string
  resignationDate?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface EmployeeListQuery {
  keyword?: string
  status?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface DepartmentDto {
  id: number
  code: string
  name: string
  description?: string | null
}
