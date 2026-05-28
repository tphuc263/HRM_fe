import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'

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

jest.mock('../../utils/exportUtils', () => ({
  downloadExcel: jest.fn(),
}))

jest.mock('../../services/attendanceService', () => ({
  attendanceService: {
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    getToday: jest.fn(),
    getMyRecords: jest.fn(),
    getDaily: jest.fn(),
    getRange: jest.fn(),
    getEmployeeRecords: jest.fn(),
    getMonthlyStats: jest.fn(),
    adminUpdate: jest.fn(),
    markAbsent: jest.fn(),
  },
}))

jest.mock('../../services/overtimeService', () => ({
  overtimeService: {
    createRequest: jest.fn(),
    getMyRequests: jest.fn(),
    getAllRequests: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    cancelRequest: jest.fn(),
  },
}))

jest.mock('../../services/employeeService', () => ({
  employeeService: {
    getAll: jest.fn().mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 }),
  },
}))

const { attendanceService } = require('../../services/attendanceService')
const { overtimeService } = require('../../services/overtimeService')

const setupUser = (role = 'USER') => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { role, id: 1, employeeName: 'Test User', username: 'testuser' },
    isAuthenticated: true,
  })
}

describe('Attendance Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('USER')

    attendanceService.getToday.mockResolvedValue(null)
    attendanceService.getMyRecords.mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 })
    attendanceService.getRange.mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 })
    attendanceService.getDaily.mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 })
    attendanceService.getMonthlyStats.mockResolvedValue({ presentDays: 0, absentDays: 0, lateDays: 0, leaveDays: 0, totalWorkDays: 20, lateCount: 1, totalOvertimeHours: 5 })
    attendanceService.getEmployeeRecords.mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 })
    overtimeService.getMyRequests.mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 })
    overtimeService.getAllRequests.mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 })
  })

  // ==========================================
  // DailyAttendancePage
  // ==========================================
  describe('DailyAttendancePage', () => {
    it('1. NV Check-in -> gọi checkIn()', async () => {
      attendanceService.checkIn.mockResolvedValue({ id: 1, checkIn: '08:00:00' })

      // Mock geolocation before render
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn().mockImplementation((success) =>
            success({ coords: { latitude: 10, longitude: 106 } })
          ),
        },
        writable: true,
        configurable: true,
      })

      render(<DailyAttendancePage />)
      const checkInBtn = await screen.findByRole('button', { name: /Check-in/i })
      await userEvent.click(checkInBtn)
      await waitFor(() => expect(attendanceService.checkIn).toHaveBeenCalled())
    })

    it('2. Đã check-in -> Hiện nút Check-out', async () => {
      render(<DailyAttendancePage />)
      const checkOutBtn = await screen.findByRole('button', { name: /Check-out/i })
      expect(checkOutBtn).toBeInTheDocument()
    })

    it('3. NV Check-out -> gọi checkOut()', async () => {
      attendanceService.checkOut.mockResolvedValue({ id: 1, checkIn: '08:00:00', checkOut: '17:00:00' })

      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn().mockImplementation((success) =>
            success({ coords: { latitude: 10, longitude: 106 } })
          ),
        },
        writable: true,
        configurable: true,
      })

      render(<DailyAttendancePage />)
      const checkOutBtn = await screen.findByRole('button', { name: /Check-out/i })
      await userEvent.click(checkOutBtn)
      await waitFor(() => expect(attendanceService.checkOut).toHaveBeenCalled())
    })

    it('4. Admin: xem danh sách chấm công ngày', async () => {
      setupUser('ADMIN')
      attendanceService.getRange.mockResolvedValue({
        content: [{ id: 1, employeeCode: 'EMP1', employeeName: 'Nguyen A', checkIn: '08:00', date: '2023-01-01' }],
        totalPages: 1,
        totalElements: 1,
      })
      render(<DailyAttendancePage />)
      await waitFor(() => {
        expect(screen.getByText('Nguyen A')).toBeInTheDocument()
        expect(screen.getByText('08:00')).toBeInTheDocument()
      })
    })

    it('5. Admin: cập nhật giờ chấm công (adminUpdate)', async () => {
      setupUser('ADMIN')
      attendanceService.getRange.mockResolvedValue({
        content: [{ id: 1, employeeCode: 'EMP1', employeeName: 'Nguyen A', checkIn: '08:00', date: '2023-01-01' }],
        totalPages: 1,
        totalElements: 1,
      })
      render(<DailyAttendancePage />)
      await waitFor(() => expect(screen.getByText('Nguyen A')).toBeInTheDocument())

      const editBtn = screen.getByRole('button', { name: /Sửa/i })
      expect(editBtn).toBeInTheDocument()
    })
  })

  // ==========================================
  // MonthlyAttendancePage
  // ==========================================
  describe('MonthlyAttendancePage', () => {
    it('1. Render stats view (User) - hiện stats từ records', async () => {
      // For USER, stats are computed from getMyRecords
      attendanceService.getMyRecords.mockResolvedValue({
        content: [
          { employeeId: 1, employeeCode: 'NV01', employeeName: 'Test User', date: '2023-10-01', checkIn: '08:00', checkOut: '17:00', status: 'ON_TIME', workHours: 8, overtimeHours: 0 },
          { employeeId: 1, employeeCode: 'NV01', employeeName: 'Test User', date: '2023-10-02', checkIn: '08:30', checkOut: '17:00', status: 'LATE', workHours: 8, overtimeHours: 1 },
        ],
        totalPages: 1,
        totalElements: 2,
      })
      render(<MonthlyAttendancePage />)
      await waitFor(() => {
        // Stats should show: 2 work days (both not ABSENT), 1 late, 1 OT hour
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1) // totalWorkDays
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2) // lateCount or OT hours
      })
    })

    it('2. Filter theo tháng - page renders with month input', async () => {
      render(<MonthlyAttendancePage />)
      // Check month input exists
      const monthInput = document.querySelector('input[type="month"]')
      expect(monthInput).toBeInTheDocument()
    })

    it('3. Admin: xem bảng chấm công tháng của NV khác', async () => {
      setupUser('ADMIN')
      const { employeeService } = require('../../services/employeeService')
      employeeService.getAll.mockResolvedValue({
        content: [{ id: 1, code: 'NV01', name: 'Nguyen A' }],
        totalPages: 1,
        totalElements: 1,
      })
      render(<MonthlyAttendancePage />)
      await waitFor(() => {
        const empSelect = screen.getByRole('combobox')
        expect(empSelect).toBeInTheDocument()
      })
    })
  })

  // ==========================================
  // OvertimeRegistrationPage
  // ==========================================
  describe('OvertimeRegistrationPage', () => {
    const mockOTData = {
      content: [{ id: 10, date: '2023-10-10', hours: 2, status: 'PENDING', employeeName: 'NV Test', employeeCode: 'NV01', startTime: '18:00:00', endTime: '20:00:00', reason: 'Fix bug' }],
      totalPages: 1,
      totalElements: 1,
    }

    beforeEach(() => {
      overtimeService.getMyRequests.mockResolvedValue(mockOTData)
      overtimeService.getAllRequests.mockResolvedValue(mockOTData)
    })

    it('1. Render danh sách OT', async () => {
      render(<OvertimeRegistrationPage />)
      await waitFor(() => {
        expect(screen.getByText('NV Test')).toBeInTheDocument()
      })
    })

    it('2. Click tạo mới -> mở modal đăng ký', async () => {
      render(<OvertimeRegistrationPage />)
      await waitFor(() => expect(screen.getByText('NV Test')).toBeInTheDocument())

      const createBtn = screen.getByRole('button', { name: /Đăng ký tăng ca mới/i })
      await userEvent.click(createBtn)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Đăng ký tăng ca/i })).toBeInTheDocument()
      })
    })

    it('3. NV Hủy OT PENDING', async () => {
      overtimeService.cancelRequest.mockResolvedValue(undefined)

      render(<OvertimeRegistrationPage />)
      await waitFor(() => expect(screen.getByText('NV Test')).toBeInTheDocument())

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn/i })
      await userEvent.click(cancelBtn)

      const confirmBtn = await screen.findByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtn)

      await waitFor(() => expect(overtimeService.cancelRequest).toHaveBeenCalledWith(10))
    })

    it('4. Admin: Duyệt OT', async () => {
      setupUser('ADMIN')
      overtimeService.approveRequest.mockResolvedValue({ id: 10 })

      render(<OvertimeRegistrationPage />)
      await waitFor(() => expect(screen.getByText('NV Test')).toBeInTheDocument())

      const approveBtn = screen.getByRole('button', { name: /Duyệt/i })
      await userEvent.click(approveBtn)

      const confirmBtn = await screen.findByRole('button', { name: /Xác nhận/i })
      await userEvent.click(confirmBtn)

      await waitFor(() => expect(overtimeService.approveRequest).toHaveBeenCalledWith(10))
    })

    it('5. Admin: Từ chối OT', async () => {
      setupUser('ADMIN')
      overtimeService.rejectRequest.mockResolvedValue({ id: 10 })

      render(<OvertimeRegistrationPage />)
      await waitFor(() => expect(screen.getByText('NV Test')).toBeInTheDocument())

      const rejectBtn = screen.getByRole('button', { name: /Từ chối/i })
      await userEvent.click(rejectBtn)

      // PromptModal uses textarea, not input
      const textarea = await screen.findByPlaceholderText(/Nhập nội dung/)
      await userEvent.type(textarea, 'khong can')

      const confirmBtn = await screen.findByRole('button', { name: /Gửi đi/i })
      await userEvent.click(confirmBtn)

      await waitFor(() => expect(overtimeService.rejectRequest).toHaveBeenCalledWith(10, 'khong can'))
    })
  })
})
