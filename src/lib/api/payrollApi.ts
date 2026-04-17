import type { 
  PayrollResponse, 
  PayrollUpdateRequest, 
  BulkUpdateRequest, 
  GenerateRequest, 
  ApiResponse 
} from '../../types/payroll';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

async function fetcher<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token'); // Giả định dùng localStorage lưu token
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra khi gọi API');
  }

  return data;
}

export const payrollApi = {
  getPayrollsByMonth(month: string) {
    return fetcher<PayrollResponse[]>(`/payrolls?month=${month}`);
  },

  getPayrollById(id: number) {
    return fetcher<PayrollResponse>(`/payrolls/${id}`);
  },

  getPayrollsByEmployee(employeeId: number) {
    return fetcher<PayrollResponse[]>(`/payrolls/employee/${employeeId}`);
  },

  generatePayroll(month: number, year: number, workDays: number = 22, body?: GenerateRequest) {
    return fetcher<PayrollResponse[]>(`/payrolls/generate?month=${month}&year=${year}&workDays=${workDays}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  updatePayroll(id: number, data: PayrollUpdateRequest) {
    return fetcher<PayrollResponse>(`/payrolls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  bulkUpdatePayroll(data: BulkUpdateRequest) {
    return fetcher<PayrollResponse[]>(`/payrolls/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  submitPayroll(id: number) {
    return fetcher<PayrollResponse>(`/payrolls/${id}/submit`, {
      method: 'PUT',
    });
  },

  approvePayroll(id: number) {
    return fetcher<PayrollResponse>(`/payrolls/${id}/approve`, {
      method: 'PUT',
    });
  }
};
