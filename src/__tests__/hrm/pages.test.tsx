import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'

import EmployeeListPage from '../../pages/employees/EmployeeListPage'
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

jest.mock('../../services/employeeService', () => ({
  employeeService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getById: jest.fn(),
    resign: jest.fn(),
  },
}))

jest.mock('../../services/departmentService', () => ({
  departmentService: {
    getAll: jest.fn(),
  },
}))

jest.mock('../../services/contractService', () => ({
  contractService: {
    getByEmployee: jest.fn(),
    create: jest.fn(),
    activate: jest.fn(),
    terminate: jest.fn(),
  },
}))

jest.mock('../../services/shiftService', () => ({
  shiftService: {
    getAll: jest.fn(),
  },
}))

const { employeeService } = require('../../services/employeeService')
const { departmentService } = require('../../services/departmentService')

const setupUser = (role = 'ADMIN') => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { role, id: 1 },
    isAuthenticated: true,
  })
}

const mockEmployees = {
  content: [
    {
      id: 1,
      code: 'EMP01',
      name: 'Nguyen Van A',
      email: 'a@gmail.com',
      phone: '0123456789',
      departmentName: 'IT',
      position: 'Developer',
      status: 'ACTIVE',
      joinDate: '2023-01-01',
    },
  ],
  totalPages: 1,
  totalElements: 1,
}

describe('HRM Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('ADMIN')

    employeeService.getAll.mockResolvedValue(mockEmployees)
    departmentService.getAll.mockResolvedValue([{ id: 1, name: 'IT' }])
  })

  describe('EmployeeListPage', () => {
    it('1. Render danh sách nhân viên', async () => {
      render(<EmployeeListPage />)
      await waitFor(() => {
        expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
        expect(screen.getByText('EMP01')).toBeInTheDocument()
      })
    })

    it('2. Search nhân viên', async () => {
      render(<EmployeeListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      const searchInput = screen.getByPlaceholderText(/Tìm kiếm/i)
      await userEvent.type(searchInput, 'Nguyen Van B')

      await new Promise((r) => setTimeout(r, 600))

      await waitFor(() => {
        expect(employeeService.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('3. Mở form tạo nhân viên', async () => {
      render(<EmployeeListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      const btn = screen.getByRole('button', { name: /Thêm nhân viên/i })
      await userEvent.click(btn)

      expect(screen.getByText(/Thêm Nhân Viên Mới/i)).toBeInTheDocument()
    })

    it('4. Cho nghỉ việc (Resign) - hiện modal xác nhận', async () => {
      employeeService.resign.mockResolvedValue(undefined)

      render(<EmployeeListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

      // Find the row for the employee and get the last button (Resign)
      const row = screen.getByText('Nguyen Van A').closest('tr')!
      // In testing-library we can use within
      // We don't have within imported so we can just use row.querySelectorAll
      const rowButtons = Array.from(row.querySelectorAll('button'))
      const resignBtn = rowButtons[rowButtons.length - 1]
      await userEvent.click(resignBtn)

      // Resign modal opens
      await waitFor(() => {
        expect(screen.getByText('Xác nhận nghỉ việc')).toBeInTheDocument()
      })

      // Click confirm
      const confirmBtn = screen.getByRole('button', { name: /Xác nhận$/i })
      await userEvent.click(confirmBtn)

      await waitFor(() => expect(employeeService.resign).toHaveBeenCalled())
    })
  })
})
