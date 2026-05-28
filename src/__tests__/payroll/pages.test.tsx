import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

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
    save: jest.fn(),
  }))
})

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
      updatedAt: '2023-01-01'
    }
  ],
  totalPages: 1,
  totalElements: 1
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
      deductions: {}
    }
  ],
  totalPages: 1,
  totalElements: 1
}

describe('Payroll Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('ADMIN')
    
    server.use(
      http.get('*/payrolls', () => HttpResponse.json({ success: true, data: mockPayrolls })),
      http.get('*/payrolls/my', () => HttpResponse.json({ success: true, data: mockMyPayrolls })),
      http.get('*/departments', () => HttpResponse.json({ success: true, data: [{ id: 1, name: 'IT' }] }))
    )
  })

  // ==========================================
  // PayrollListPage
  // ==========================================
  describe('PayrollListPage', () => {
    it('1. Hiển thị danh sách payroll', async () => {
      render(<PayrollListPage />)
      await waitFor(() => {
        expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
        expect(screen.getByText(/10.500.000/)).toBeInTheDocument()
      })
    })

    it('2. Filter theo tháng và phòng ban', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/payrolls', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: mockPayrolls })
        })
      )
      render(<PayrollListPage />)
      
      // Wait load
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())
      
      // Change department
      const deptSelect = screen.getByRole('combobox', { name: '' }) // There are multiple combo boxes, so let's select by default value 'ALL'
      const selects = screen.getAllByRole('combobox')
      await userEvent.selectOptions(selects[0], '1') // Select department ID 1
      
      await waitFor(() => expect(capturedUrl).toContain('departmentId=1'))
    })

    it('3. Mở modal Tạo bảng lương -> generatePayroll', async () => {
      let generateCalled = false
      server.use(
        http.post('*/payrolls/generate', () => {
          generateCalled = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<PayrollListPage />)
      const btn = await screen.findByRole('button', { name: /Tạo bảng lương tháng/i })
      await userEvent.click(btn)
      
      const submitBtn = await screen.findByRole('button', { name: /Xác nhận tạo/i })
      await userEvent.click(submitBtn)
      
      await waitFor(() => expect(generateCalled).toBe(true))
    })

    it('4. Sửa phiếu DRAFT -> updatePayroll', async () => {
      let updated = false
      server.use(
        http.put('*/payrolls/1', () => {
          updated = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<PayrollListPage />)
      
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())
      
      // Edit button title "Sửa phiếu lương"
      const editBtn = screen.getByTitle('Sửa phiếu lương')
      await userEvent.click(editBtn)
      
      // Update form
      const saveBtn = await screen.findByRole('button', { name: /Cập nhật/i })
      await userEvent.click(saveBtn)
      
      await waitFor(() => expect(updated).toBe(true))
    })

    it('5. Chốt lương -> submitPayroll', async () => {
      let submitted = false
      server.use(
        http.post('*/payrolls/1/submit', () => {
          submitted = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<PayrollListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())
      
      const submitBtn = screen.getByTitle('Chốt lương')
      await userEvent.click(submitBtn)
      
      const confirmBtn = await screen.findByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtn)
      
      await waitFor(() => expect(submitted).toBe(true))
    })

    it('6. Duyệt lương (APPROVED) -> approvePayroll', async () => {
      let approved = false
      // Change status to CALCULATED so Duyệt button appears
      server.use(
        http.get('*/payrolls', () => HttpResponse.json({ success: true, data: {
          content: [{ ...mockPayrolls.content[0], status: 'CALCULATED' }],
          totalPages: 1, totalElements: 1
        }})),
        http.post('*/payrolls/1/approve', () => {
          approved = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<PayrollListPage />)
      
      const btn = await screen.findByRole('button', { name: /Duyệt/i })
      await userEvent.click(btn)
      
      const confirmBtn = await screen.findByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtn)
      
      await waitFor(() => expect(approved).toBe(true))
    })
  })

  // ==========================================
  // MyPayrollPage
  // ==========================================
  describe('MyPayrollPage', () => {
    beforeEach(() => {
      setupUser('USER')
    })

    it('1. Render thông tin phiếu lương', async () => {
      render(<MyPayrollPage />)
      await waitFor(() => {
        expect(screen.getByText(/15.000.000/)).toBeInTheDocument()
      })
    })

    it('2. Download PDF gọi html2pdf', async () => {
      // Mock html2pdf
      const html2pdf = require('html2pdf.js')
      const mockSave = jest.fn()
      html2pdf.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        save: mockSave,
      })

      render(<MyPayrollPage />)
      const btn = await screen.findByRole('button', { name: /Tải PDF/i })
      await userEvent.click(btn)
      
      expect(html2pdf).toHaveBeenCalled()
    })
  })
})
