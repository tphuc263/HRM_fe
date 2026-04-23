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
  dependentCount?: number
  currentSalary?: number | null
  latestNetSalary?: number | null
  lastPayrollMonth?: string | null
  createdAt?: string
  updatedAt?: string
  generatedAccount?: AccountInfo | null
}

export interface AccountInfo {
  username: string
  defaultPassword: string
  role: string
}

export interface EmployeeUpsertPayload {
  code: string
  name: string
  email: string
  phone?: string
  birthday?: string
  address?: string
  joinDate: string
  departmentId?: number
  avatar?: string
  dependentCount?: number
}

export interface EmployeeListQuery {
  keyword?: string
  status?: string
  departmentId?: number
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

export interface DepartmentUpsertPayload {
  code: string
  name: string
  description?: string
}

export interface ContractDto {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: string
  contractType: string
  startDate: string
  endDate?: string | null
  basicSalary: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface ContractUpsertPayload {
  employeeId: number
  contractType: string
  startDate: string
  endDate?: string
  basicSalary: number
}
