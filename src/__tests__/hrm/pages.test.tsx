import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

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
      joinDate: '2023-01-01'
    }
  ],
  totalPages: 1,
  totalElements: 1
}

describe('HRM Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('ADMIN')
    
    server.use(
      http.get('*/employees', () => HttpResponse.json({ success: true, data: mockEmployees })),
      http.get('*/departments', () => HttpResponse.json({ success: true, data: [{ id: 1, name: 'IT' }] }))
    )
  })

  // ==========================================
  // EmployeeListPage
  // ==========================================
  describe('EmployeeListPage', () => {
    it('1. Render danh sách nhân viên', async () => {
      render(<EmployeeListPage />)
      await waitFor(() => {
        expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
        expect(screen.getByText('EMP01')).toBeInTheDocument()
      })
    })

    it('2. Search nhân viên', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/employees', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: mockEmployees })
        })
      )
      render(<EmployeeListPage />)
      
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())
      
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm/i)
      await userEvent.type(searchInput, 'Nguyen Van B')
      
      // Assume it searches on type or enter. We will just check if URL changed if there is a button.
      // Usually there is a debounce or search button
      // To be safe we will check after a small delay
      await new Promise(r => setTimeout(r, 600))
      
      await waitFor(() => {
        expect(capturedUrl).toContain('keyword=Nguyen+Van+B') || expect(capturedUrl).toContain('keyword=Nguyen%20Van%20B')
      })
    })

    it('3. Mở form tạo nhân viên', async () => {
      render(<EmployeeListPage />)
      const btn = await screen.findByRole('button', { name: /Thêm nhân viên/i })
      await userEvent.click(btn)
      
      expect(screen.getByText('Thêm Nhân Viên Mới')).toBeInTheDocument() // Assuming modal title
    })

    it('4. Cho nghỉ việc (Resign)', async () => {
      let resigned = false
      server.use(
        http.put('*/employees/1/resign', () => {
          resigned = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<EmployeeListPage />)
      await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())
      
      // Find resign button (usually with title Cho nghỉ việc)
      const resignBtn = screen.getByTitle('Cho nghỉ việc')
      await userEvent.click(resignBtn)
      
      // Fill form and submit
      const confirmBtns = await screen.findAllByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtns[confirmBtns.length - 1])
      
      await waitFor(() => expect(resigned).toBe(true))
    })
  })
})
