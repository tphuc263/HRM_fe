import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'

import LeaveRequestPage from '../../pages/attendance/LeaveRequestPage'
import AbsenceManagementPage from '../../pages/attendance/AbsenceManagementPage'
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

jest.mock('../../services/leaveService', () => ({
  leaveService: {
    getLeaveTypes: jest.fn(),
    getMyRequests: jest.fn(),
    getPendingRequests: jest.fn(),
    getAllRequests: jest.fn(),
    submitRequest: jest.fn(),
    cancelRequest: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    getMyBalances: jest.fn(),
    getEmployeeBalances: jest.fn(),
    initBalance: jest.fn(),
    updateBalance: jest.fn(),
  },
}))

jest.mock('../../services/attendanceService', () => ({
  attendanceService: {
    getRange: jest.fn(),
    getMyRecords: jest.fn(),
    markAbsent: jest.fn(),
  },
}))

jest.mock('../../services/employeeService', () => ({
  employeeService: {
    getAll: jest.fn().mockResolvedValue({ content: [], totalPages: 1, totalElements: 0 }),
  },
}))

const { leaveService } = require('../../services/leaveService')
const { attendanceService } = require('../../services/attendanceService')

const setupUser = (role = 'USER') => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { role, id: 1 },
    isAuthenticated: true,
  })
}

const mockLeaveTypes = [{ id: 1, name: 'Phép năm' }, { id: 2, name: 'Nghỉ ốm' }]
const mockLeaveRequests = {
  content: [
    { id: 10, employeeCode: 'NV01', employeeName: 'Nguyen Van A', leaveTypeName: 'Phép năm', startDate: '2023-01-01', endDate: '2023-01-02', days: 2, status: 'PENDING' }
  ],
  totalPages: 1,
  totalElements: 1,
}
const mockMyBalances = [
  { id: 20, leaveTypeName: 'Phép năm', totalDays: 12, usedDays: 2, remainingDays: 10, carryOverDays: 0 }
]

describe('LeaveRequestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('USER')

    leaveService.getLeaveTypes.mockResolvedValue(mockLeaveTypes)
    leaveService.getMyRequests.mockResolvedValue(mockLeaveRequests)
    leaveService.getAllRequests.mockResolvedValue(mockLeaveRequests)
    leaveService.getPendingRequests.mockResolvedValue(mockLeaveRequests)
    leaveService.getMyBalances.mockResolvedValue(mockMyBalances)
    leaveService.getEmployeeBalances.mockResolvedValue([])
  })

  it('1. Render danh sách đơn nghỉ phép', async () => {
    render(<LeaveRequestPage />)
    await waitFor(() => {
      // "Phép năm" appears in filter dropdown + table row
      expect(screen.getAllByText('Phép năm').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('2. Click "Tạo đơn mới" -> mở modal', async () => {
    render(<LeaveRequestPage />)
    const btn = await screen.findByText(/Tạo đơn nghỉ mới/i)
    await userEvent.click(btn)
    expect(screen.getByText('Tạo đơn xin nghỉ mới')).toBeInTheDocument()
  })

  it('3. Chọn loại phép -> form thay đổi', async () => {
    render(<LeaveRequestPage />)
    await userEvent.click(await screen.findByText(/Tạo đơn nghỉ mới/i))
    await waitFor(() => {
      expect(screen.getAllByText('Phép năm').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('4. Submit đơn -> gọi submitRequest() API', async () => {
    leaveService.submitRequest.mockResolvedValue({ id: 11 })

    render(<LeaveRequestPage />)
    await waitFor(() => expect(screen.getAllByText('Phép năm').length).toBeGreaterThanOrEqual(2))
    await userEvent.click(screen.getByText(/Tạo đơn nghỉ mới/i))

    // Wait for modal
    await waitFor(() => expect(screen.getByText('Tạo đơn xin nghỉ mới')).toBeInTheDocument())

    // Fix: form uses input[type="date"] without associated labels
    const dateInputs = document.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>
    const fromInput = dateInputs[0]
    const toInput = dateInputs[1]
    const reasonInput = screen.getByPlaceholderText(/Nhập lý do xin nghỉ/i)

    await userEvent.type(fromInput, '2023-05-01')
    await userEvent.type(toInput, '2023-05-02')
    await userEvent.type(reasonInput, 'Nghỉ mát')

    await userEvent.click(screen.getByRole('button', { name: /Gửi đơn/i }))
    await waitFor(() => expect(leaveService.submitRequest).toHaveBeenCalled())
  })

  it('5. Hủy đơn PENDING -> gọi cancelRequest()', async () => {
    leaveService.cancelRequest.mockResolvedValue(undefined)

    render(<LeaveRequestPage />)
    // Wait for data to load (Phép năm in table row)
    await waitFor(() => expect(screen.getAllByText('Phép năm').length).toBeGreaterThanOrEqual(2))

    // "Hủy" button directly calls handleCancel. Match exact to avoid "Đã hủy" tab
    const cancelBtn = screen.getByRole('button', { name: /^Hủy$/i })
    await userEvent.click(cancelBtn)

    await waitFor(() => expect(leaveService.cancelRequest).toHaveBeenCalledWith(10))
  })

  it('6. Admin: thấy danh sách chờ duyệt, bảng có cột nhân viên', async () => {
    setupUser('ADMIN')
    render(<LeaveRequestPage />)
    await waitFor(() => {
      expect(screen.getByText('Ma NV')).toBeInTheDocument()
      expect(screen.getByText('Họ tên')).toBeInTheDocument()
    })
  })

  it('7. Admin: Approve -> gọi approveRequest()', async () => {
    setupUser('ADMIN')
    leaveService.approveRequest.mockResolvedValue(undefined)

    render(<LeaveRequestPage />)
    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

    const approveBtn = screen.getByRole('button', { name: /^Duyệt$/i })
    await userEvent.click(approveBtn)

    await waitFor(() => expect(leaveService.approveRequest).toHaveBeenCalledWith(10))
  })

  it('8. Admin: Reject -> nhập lý do -> rejectRequest()', async () => {
    setupUser('ADMIN')
    leaveService.rejectRequest.mockResolvedValue(undefined)

    render(<LeaveRequestPage />)
    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument())

    // "Từ chối" button in the table row opens PromptModal
    const rejectBtns = screen.getAllByRole('button', { name: /^Từ chối$/i })
    await userEvent.click(rejectBtns[1]) // first one is the filter tab, second is in the table

    // PromptModal with placeholder and minChars=5
    const textarea = await screen.findByPlaceholderText(/Nhập lý do/)
    await userEvent.type(textarea, 'Khong dong y nha')

    // Confirm button in PromptModal also has text "Từ chối"
    const allRejectBtns = screen.getAllByRole('button', { name: /Từ chối/i })
    await userEvent.click(allRejectBtns[allRejectBtns.length - 1])

    await waitFor(() => expect(leaveService.rejectRequest).toHaveBeenCalledWith(10, 'Khong dong y nha'))
  })

  it('9 & 10. Lọc theo status', async () => {
    render(<LeaveRequestPage />)
    // Wait for initial load
    await waitFor(() => expect(screen.getAllByText('Phép năm').length).toBeGreaterThanOrEqual(2))

    // Click "Đã duyệt" tab
    const approvedTab = screen.getByText('Đã duyệt')
    await userEvent.click(approvedTab)

    await waitFor(() => {
      expect(leaveService.getMyRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' })
      )
    })
  })
})

describe('AbsenceManagementPage', () => {
  const mockRecords = {
    content: [
      { id: 100, employeeCode: 'NV01', employeeName: 'Le Van B', date: '2023-01-05', status: 'ABSENT', note: 'Ly do vang mat' }
    ],
    totalPages: 1,
    totalElements: 1,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('ADMIN')
    attendanceService.getRange.mockResolvedValue(mockRecords)
    attendanceService.getMyRecords.mockResolvedValue(mockRecords)
    attendanceService.markAbsent.mockResolvedValue({ id: 11 })
  })

  it('1. Render list vắng mặt', async () => {
    render(<AbsenceManagementPage />)
    await waitFor(() => {
      expect(screen.getByText('Le Van B')).toBeInTheDocument()
    })
  })

  it('2. Search và Filter theo ngày', async () => {
    render(<AbsenceManagementPage />)
    await waitFor(() => expect(screen.getByText('Le Van B')).toBeInTheDocument())
    expect(attendanceService.getRange).toHaveBeenCalled()
  })

  it('3. Admin: thấy nút Đánh vắng mặt', async () => {
    render(<AbsenceManagementPage />)
    await waitFor(() => expect(screen.getByText('Le Van B')).toBeInTheDocument())
    // Admin sees the Đánh vắng mặt button (it's disabled because no employee selected from dropdown)
    expect(screen.getByText(/Đánh vắng mặt/i)).toBeInTheDocument()
  })

  it('4. User thường không thấy form đánh vắng mặt', async () => {
    setupUser('USER')
    attendanceService.getMyRecords.mockResolvedValue(mockRecords)
    render(<AbsenceManagementPage />)
    await waitFor(() => expect(screen.getByText('Le Van B')).toBeInTheDocument())
    expect(screen.queryByText(/Đánh vắng mặt/i)).not.toBeInTheDocument()
  })
})
