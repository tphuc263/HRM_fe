export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';

export interface PayrollResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  month: string; // YYYY-MM
  
  basicSalary: number;
  workDays: number;
  actualDays: number;
  
  allowances: Record<string, number>;
  totalAllowances: number;
  
  overtimePay: number;
  grossSalary: number;
  
  deductions: Record<string, number>;
  totalDeductions: number;
  
  netSalary: number;
  
  status: PayrollStatus;
  approvedByName?: string;
  approvedAt?: string;
  paidAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PayrollUpdateRequest {
  workDays?: number;
  actualDays?: number;
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
  overtimePay?: number;
}

export interface BulkUpdateRequest {
  payrollIds: number[];
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
}

export interface GenerateRequest {
  defaultAllowances?: Record<string, number>;
  defaultDeductions?: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
