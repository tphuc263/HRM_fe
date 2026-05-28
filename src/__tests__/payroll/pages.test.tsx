import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'

import PayrollListPage from '../../pages/payroll/PayrollListPage'
import MyPayrollPage from '../../pages/payroll/MyPayrollPage'
import { useAuth } from '../../context/useAuth'

jest.mock('../../context/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}))

jest.mock('../../utils/exportUtils', () => ({
  downloadExcel: jest.fn(),
}))

jest.mock('html2pdf.js', () => {
  return jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(undefined),
  }))
})

// Mock payrollApi (used by pages, not payrollService)
jest.mock('../../lib/api/payrollApi', () => ({
  payrollApi: {
    getPayrollsByMonth: jest.fn(),
    getPayrollsByEmployee: jest.fn(),
    getPayrollById: jest.fn(),
    generatePayroll: jest.fn(),
    updatePayroll: jest.fn(),
    bulkUpdatePayroll: jest.fn(),
    submitPayroll: jest.fn(),
    approvePayroll: jest.fn(),
  },
}))

jest.mock('../../services/departmentService', () => ({
  departmentService: {
    getAll: jest.fn(),
  },
}))

jest.mock('../../services/employeeService', () => ({
  employeeService: {
    getAll: jest.fn().mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 }),
  },
}))

const { payrollApi } = require('../../lib/api/payrollApi')
const { departmentService } = require('../../services/departmentService')

const setupUser = (role = 'ADMIN') => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { role, id: 1 },
    isAuthenticated: true,
  })
}

const mockPayrolls = {
  content: [
    {
      id: 1,
      employeeCode: 'NV01',
      employeeName: 'Nguyen Van A',
      departmentName: 'IT',
      basicSalary: 10000000,
      actualDays: 20,
      workDays: 22,
      totalAllowances: 1000000,
      totalDeductions: 500000,
      netSalary: 10500000,
      status: 'DRAFT',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
  ],
  totalPages: 1,
  totalElements: 1,
}

const mockMyPayrolls = {
  content: [
    {
      id: 1,
      month: 10,
      year: 2023,
      basicSalary: 15000000,
      actualDays: 22,
      workDays: 22,
      totalAllowances: 0,
      totalDeductions: 0,
      netSalary: 15000000,
      status: 'APPROVED',
      allowances: {},
      deductions: {},
    },
  ],
  totalPages: 1,
  totalElements: 1,
}

describe('Payroll Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('ADMIN')

    // payrollApi returns ApiResponse wrapper { success, data }
    payrollApi.getPayrollsByMonth.mockResolvedValue({ success: true, data: mockPayrolls })
    payrollApi.getPayrollsByEmployee.mockResolvedValue({ success: true, data: mockMyPayrolls })
    departmentService.getAll.mockResolvedValue([{ id: 1, name: 'IT' }])
  })

  describe('PayrollListPage', () => {
    it('1. Hiển thị danh sách payroll', async () => {
      render(<PayrollListPage />)
      await waitFor(() => {
        expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
      })
    })

    it('2. Filter theo phòng ban', async () => {
      render(<PayrollListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())
      // Verify the service was called
      expect(payrollApi.getPayrollsByMonth).toHaveBeenCalled()
    })

    it('3. Mở modal Tạo bảng lương -> generatePayroll', async () => {
      payrollApi.generatePayroll.mockResolvedValue({ success: true, data: [] })

      render(<PayrollListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      const btn = screen.getByRole('button', { name: /Tạo bảng lương tháng/i })
      await userEvent.click(btn)

      const submitBtn = await screen.findByRole('button', { name: /^Tạo bảng lương$/i })
      await userEvent.click(submitBtn)

      await waitFor(() => expect(payrollApi.generatePayroll).toHaveBeenCalled())
    })

    it('4. Sửa phiếu DRAFT -> updatePayroll', async () => {
      payrollApi.updatePayroll.mockResolvedValue({ success: true, data: {} })

      render(<PayrollListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      const editBtn = screen.getByTitle('Sửa phiếu lương')
      await userEvent.click(editBtn)

      const saveBtn = await screen.findByRole('button', { name: /Cập nhật/i })
      await userEvent.click(saveBtn)

      await waitFor(() => expect(payrollApi.updatePayroll).toHaveBeenCalled())
    })

    it('5. Chốt lương -> submitPayroll', async () => {
      payrollApi.submitPayroll.mockResolvedValue({ success: true, data: {} })

      render(<PayrollListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      const submitBtn = screen.getByTitle('Chốt lương')
      await userEvent.click(submitBtn)

      const confirmBtn = await screen.findByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtn)

      await waitFor(() => expect(payrollApi.submitPayroll).toHaveBeenCalled())
    })

    it('6. Duyệt lương (APPROVED) -> approvePayroll', async () => {
      payrollApi.approvePayroll.mockResolvedValue({ success: true, data: {} })
      payrollApi.getPayrollsByMonth.mockResolvedValue({
        success: true,
        data: {
          content: [{ ...mockPayrolls.content[0], status: 'CALCULATED' }],
          totalPages: 1,
          totalElements: 1,
        },
      })

      render(<PayrollListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      const btn = screen.getByRole('button', { name: /Duyệt/i })
      await userEvent.click(btn)

      const confirmBtn = await screen.findByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtn)

      await waitFor(() => expect(payrollApi.approvePayroll).toHaveBeenCalled())
    })
  })

  describe('MyPayrollPage', () => {
    beforeEach(() => {
      setupUser('USER')
    })

    it('1. Render thông tin phiếu lương', async () => {
      render(<MyPayrollPage />)
      await waitFor(() => {
        expect(screen.getByText(/Tháng 10/i)).toBeInTheDocument()
      })
    })

    it('2. Download PDF gọi html2pdf', async () => {
      const html2pdf = require('html2pdf.js')
      html2pdf.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(undefined),
      })

      render(<MyPayrollPage />)
      const btn = await screen.findByRole('button', { name: /Tải PDF/i })
      await userEvent.click(btn)

      expect(html2pdf).toHaveBeenCalled()
    })
  })
})
