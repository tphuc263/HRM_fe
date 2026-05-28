import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

import DailyAttendancePage from '../../pages/attendance/DailyAttendancePage'
import MonthlyAttendancePage from '../../pages/attendance/MonthlyAttendancePage'
import OvertimeRegistrationPage from '../../pages/attendance/OvertimeRegistrationPage'
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

const setupUser = (role = 'USER') => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { role, id: 1 },
    isAuthenticated: true,
  })
}

describe('Attendance Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('USER')
    
    server.use(
      http.get('*/attendance/today', () => HttpResponse.json({ success: true, data: null })),
      http.get('*/attendance/daily', () => HttpResponse.json({ success: true, data: { content: [], totalPages: 1, totalElements: 0 } })),
      http.get('*/employees', () => HttpResponse.json({ success: true, data: { content: [] } }))
    )
  })

  // ==========================================
  // DailyAttendancePage
  // ==========================================
  describe('DailyAttendancePage', () => {
    it('1. NV Check-in -> gọi checkIn()', async () => {
      let checkInCalled = false
      server.use(
        http.post('*/attendance/check-in', () => {
          checkInCalled = true
          return HttpResponse.json({ success: true, data: { id: 1, checkIn: '08:00:00' } })
        })
      )
      render(<DailyAttendancePage />)
      const checkInBtn = await screen.findByRole('button', { name: /Check-in/i })
      await userEvent.click(checkInBtn)
      await waitFor(() => expect(checkInCalled).toBe(true))
    })

    it('2. Đã check-in -> Hiện nút Check-out', async () => {
      server.use(
        http.get('*/attendance/today', () => HttpResponse.json({ success: true, data: { id: 1, checkIn: '08:00:00', checkOut: null } }))
      )
      render(<DailyAttendancePage />)
      const checkOutBtn = await screen.findByRole('button', { name: /Check-out/i })
      expect(checkOutBtn).toBeInTheDocument()
    })

    it('3. NV Check-out -> gọi checkOut()', async () => {
      server.use(
        http.get('*/attendance/today', () => HttpResponse.json({ success: true, data: { id: 1, checkIn: '08:00:00', checkOut: null } }))
      )
      let checkOutCalled = false
      server.use(
        http.post('*/attendance/check-out', () => {
          checkOutCalled = true
          return HttpResponse.json({ success: true, data: { id: 1, checkIn: '08:00:00', checkOut: '17:00:00' } })
        })
      )
      render(<DailyAttendancePage />)
      const checkOutBtn = await screen.findByRole('button', { name: /Check-out/i })
      await userEvent.click(checkOutBtn)
      await waitFor(() => expect(checkOutCalled).toBe(true))
    })

    it('4. Admin: xem danh sách chấm công ngày', async () => {
      setupUser('ADMIN')
      server.use(
        http.get('*/attendance/daily', () => HttpResponse.json({ success: true, data: { content: [{ id: 1, employeeCode: 'EMP1', employeeName: 'Nguyen A', checkIn: '08:00' }], totalPages: 1, totalElements: 1 } }))
      )
      render(<DailyAttendancePage />)
      await waitFor(() => {
        expect(screen.getByText('Nguyen A')).toBeInTheDocument()
        expect(screen.getByText('08:00')).toBeInTheDocument()
      })
    })

    it('5. Admin: cập nhật giờ chấm công (adminUpdate)', async () => {
      setupUser('ADMIN')
      server.use(
        http.get('*/attendance/daily', () => HttpResponse.json({ success: true, data: { content: [{ id: 1, employeeCode: 'EMP1', employeeName: 'Nguyen A', checkIn: '08:00' }] } }))
      )
      render(<DailyAttendancePage />)
      // Wait for load
      await waitFor(() => expect(screen.getByText('Nguyen A')).toBeInTheDocument())
      
      const updateBtn = await screen.findByRole('button', { name: /Cập nhật/i })
      expect(updateBtn).toBeInTheDocument() // Assuming there is an update button
    })
  })

  // ==========================================
  // MonthlyAttendancePage
  // ==========================================
  describe('MonthlyAttendancePage', () => {
    beforeEach(() => {
      server.use(
        http.get('*/attendance/my-records', () => HttpResponse.json({ success: true, data: { content: [] } })),
        http.get('*/attendance/employee/*', () => HttpResponse.json({ success: true, data: { content: [] } })),
        http.get('*/attendance/stats/*', () => HttpResponse.json({ success: true, data: { presentDays: 20, absentDays: 0, lateDays: 1, leaveDays: 1 } }))
      )
    })

    it('1. Render stats view (User)', async () => {
      render(<MonthlyAttendancePage />)
      await waitFor(() => {
        // Stats boxes
        expect(screen.getByText('20')).toBeInTheDocument() // present days
        expect(screen.getByText('1')).toBeInTheDocument() // late or leave days
      })
    })

    it('2. Filter theo tháng', async () => {
      render(<MonthlyAttendancePage />)
      // Just check if month picker exists
      const monthInput = screen.getByLabelText(/Chọn tháng/i) || screen.getByPlaceholderText(/MM\/YYYY/i) || screen.getByDisplayValue(/202/i)
      expect(monthInput).toBeInTheDocument()
    })

    it('3. Admin: xem bảng chấm công tháng của NV khác', async () => {
      setupUser('ADMIN')
      render(<MonthlyAttendancePage />)
      const empSelect = screen.getByRole('combobox')
      expect(empSelect).toBeInTheDocument()
    })
  })

  // ==========================================
  // OvertimeRegistrationPage
  // ==========================================
  describe('OvertimeRegistrationPage', () => {
    beforeEach(() => {
      server.use(
        http.get('*/overtime-requests/my', () => HttpResponse.json({ success: true, data: { content: [{ id: 10, date: '2023-10-10', hours: 2, status: 'PENDING' }] } })),
        http.get('*/overtime-requests', () => HttpResponse.json({ success: true, data: { content: [{ id: 10, date: '2023-10-10', hours: 2, status: 'PENDING' }] } }))
      )
    })

    it('1. Render danh sách OT', async () => {
      render(<OvertimeRegistrationPage />)
      await waitFor(() => {
        expect(screen.getByText('2023-10-10')).toBeInTheDocument()
      })
    })

    it('2. Click tạo mới -> gửi request OT', async () => {
      let created = false
      server.use(
        http.post('*/overtime-requests', () => {
          created = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<OvertimeRegistrationPage />)
      const createBtn = await screen.findByRole('button', { name: /Tạo /i })
      await userEvent.click(createBtn)
      
      // Wait for modal and fill form
      const dateInput = await screen.findByLabelText(/Ngày/i)
      await userEvent.type(dateInput, '2023-10-11')
      
      const submitBtn = await screen.findByRole('button', { name: /Lưu|Gửi/i })
      await userEvent.click(submitBtn)
      
      await waitFor(() => expect(created).toBe(true))
    })

    it('3. NV Hủy OT PENDING', async () => {
      let cancelled = false
      server.use(
        http.delete('*/overtime-requests/10', () => {
          cancelled = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<OvertimeRegistrationPage />)
      
      const cancelBtn = await screen.findByRole('button', { name: /Hủy/i })
      await userEvent.click(cancelBtn)
      
      await waitFor(() => expect(cancelled).toBe(true))
    })

    it('4. Admin: Duyệt OT', async () => {
      setupUser('ADMIN')
      let approved = false
      server.use(
        http.put('*/overtime-requests/10/approve', () => {
          approved = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<OvertimeRegistrationPage />)
      const approveBtn = await screen.findByRole('button', { name: /Duyệt/i })
      await userEvent.click(approveBtn)
      await waitFor(() => expect(approved).toBe(true))
    })

    it('5. Admin: Từ chối OT', async () => {
      setupUser('ADMIN')
      let rejected = false
      server.use(
        http.put('*/overtime-requests/10/reject', () => {
          rejected = true
          return HttpResponse.json({ success: true })
        })
      )
      render(<OvertimeRegistrationPage />)
      const rejectBtn = await screen.findByRole('button', { name: /Từ chối/i })
      await userEvent.click(rejectBtn)
      
      const reasonInput = await screen.findByPlaceholderText(/lý do/i)
      await userEvent.type(reasonInput, 'khong can')
      
      const confirmBtns = screen.getAllByRole('button', { name: /Từ chối/i })
      await userEvent.click(confirmBtns[confirmBtns.length - 1])
      
      await waitFor(() => expect(rejected).toBe(true))
    })
  })
})
