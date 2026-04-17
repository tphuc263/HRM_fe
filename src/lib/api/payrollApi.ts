import type { 
  PayrollResponse, 
  PayrollUpdateRequest, 
  BulkUpdateRequest, 
  GenerateRequest, 
  ApiResponse 
} from '../../types/payroll';
import type { PageData } from '../../types/api';

type PayrollListQuery = {
  month: string;
  status?: string;
  keyword?: string;
  departmentId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

type PayrollHistoryQuery = {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

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
  getPayrollsByMonth(query: PayrollListQuery) {
    const params = new URLSearchParams({ month: query.month });
    if (query.status) params.set('status', query.status);
    if (query.keyword) params.set('keyword', query.keyword);
    if (query.departmentId != null) params.set('departmentId', String(query.departmentId));
    if (query.page != null) params.set('page', String(query.page));
    if (query.size != null) params.set('size', String(query.size));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortDir) params.set('sortDir', query.sortDir);

    return fetcher<PageData<PayrollResponse>>(`/payrolls?${params.toString()}`);
  },

  getPayrollById(id: number) {
    return fetcher<PayrollResponse>(`/payrolls/${id}`);
  },

  getPayrollsByEmployee(employeeId: number, query?: PayrollHistoryQuery) {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.page != null) params.set('page', String(query.page));
    if (query?.size != null) params.set('size', String(query.size));
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortDir) params.set('sortDir', query.sortDir);

    const suffix = params.toString();
    return fetcher<PageData<PayrollResponse>>(`/payrolls/employee/${employeeId}${suffix ? `?${suffix}` : ''}`);
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
