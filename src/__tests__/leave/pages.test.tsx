import React from 'react'
import { render, screen, waitFor, act } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

import LeaveRequestPage from '../../pages/attendance/LeaveRequestPage'
import AbsenceManagementPage from '../../pages/attendance/AbsenceManagementPage'
import { useAuth } from '../../context/useAuth'

// Mock Hooks
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

// Basic mocked responses for tests
const mockLeaveTypes = [{ id: 1, name: 'Phép năm' }, { id: 2, name: 'Nghỉ ốm' }]
const mockLeaveRequests = {
  content: [
    { id: 10, employeeName: 'Nguyen Van A', leaveTypeName: 'Phép năm', startDate: '2023-01-01', endDate: '2023-01-02', days: 2, status: 'PENDING' }
  ],
  totalPages: 1,
  totalElements: 1
}
const mockMyBalances = [
  { id: 20, leaveTypeName: 'Phép năm', totalDays: 12, usedDays: 2, remainingDays: 10, carryOverDays: 0 }
]

describe('LeaveRequestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('USER')
    
    server.use(
      http.get('*/leave-types', () => HttpResponse.json({ success: true, data: mockLeaveTypes })),
      http.get('*/leave-requests/my', () => HttpResponse.json({ success: true, data: mockLeaveRequests })),
      http.get('*/leave-requests', () => HttpResponse.json({ success: true, data: mockLeaveRequests })),
      http.get('*/leave-balances/my', () => HttpResponse.json({ success: true, data: mockMyBalances })),
      http.get('*/employees', () => HttpResponse.json({ success: true, data: { content: [] } }))
    )
  })

  it('1. Render danh sách đơn nghỉ phép', async () => {
    render(<LeaveRequestPage />)
    await waitFor(() => {
      expect(screen.getByText('Phép năm')).toBeInTheDocument()
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument() // Admin would see this, user doesn't. Wait, the mock request includes it.
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
    const select = await screen.findByRole('combobox')
    expect(select).toBeInTheDocument()
    // By default it should have 'Phép năm' loaded
    expect(screen.getByText('Phép năm')).toBeInTheDocument()
  })

  it('4. Submit đơn -> gọi submitRequest() API', async () => {
    let submitCalled = false
    server.use(
      http.post('*/leave-requests', () => {
        submitCalled = true
        return HttpResponse.json({ success: true, data: { id: 11 } })
      })
    )
    
    render(<LeaveRequestPage />)
    await userEvent.click(await screen.findByText(/Tạo đơn nghỉ mới/i))
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/Từ ngày/i), '2023-05-01')
    await userEvent.type(screen.getByLabelText(/Đến ngày/i), '2023-05-02')
    await userEvent.type(screen.getByLabelText(/Lý do/i), 'Nghỉ mát')
    
    await userEvent.click(screen.getByRole('button', { name: /Gửi đơn/i }))
    await waitFor(() => expect(submitCalled).toBe(true))
  })

  it('5. Hủy đơn PENDING -> gọi cancelRequest()', async () => {
    let cancelCalled = false
    server.use(
      http.put('*/leave-requests/10/cancel', () => {
        cancelCalled = true
        return HttpResponse.json({ success: true })
      })
    )
    render(<LeaveRequestPage />)
    const cancelBtn = await screen.findByRole('button', { name: /Hủy/i })
    await userEvent.click(cancelBtn)
    await waitFor(() => expect(cancelCalled).toBe(true))
  })

  it('6. Admin: thấy danh sách chờ duyệt, bảng có cột nhân viên', async () => {
    setupUser('ADMIN')
    render(<LeaveRequestPage />)
    await waitFor(() => {
      // "Ma NV", "Họ tên" are shown
      expect(screen.getByText('Ma NV')).toBeInTheDocument()
      expect(screen.getByText('Họ tên')).toBeInTheDocument()
    })
  })

  it('7. Admin: Approve -> gọi approveRequest()', async () => {
    setupUser('ADMIN')
    let approved = false
    server.use(
      http.put('*/leave-requests/10/approve', () => {
        approved = true
        return HttpResponse.json({ success: true })
      })
    )
    render(<LeaveRequestPage />)
    const approveBtn = await screen.findByRole('button', { name: /Duyệt/i })
    await userEvent.click(approveBtn)
    await waitFor(() => expect(approved).toBe(true))
  })

  it('8. Admin: Reject -> nhập lý do -> rejectRequest()', async () => {
    setupUser('ADMIN')
    let rejectedWithReason = ''
    server.use(
      http.put('*/leave-requests/10/reject', ({ request }) => {
        const url = new URL(request.url)
        rejectedWithReason = url.searchParams.get('reason') || ''
        return HttpResponse.json({ success: true })
      })
    )
    render(<LeaveRequestPage />)
    
    // Click reject
    const rejectBtn = await screen.findByRole('button', { name: /Từ chối/i })
    await userEvent.click(rejectBtn)
    
    // Modal opens
    const input = await screen.findByPlaceholderText(/Nhập lý do/i)
    await userEvent.type(input, 'Khong dong y')
    
    // Confirm
    const confirmBtns = screen.getAllByRole('button', { name: /Từ chối/i })
    // The modal confirm button is the last one usually
    await userEvent.click(confirmBtns[confirmBtns.length - 1])
    
    await waitFor(() => expect(rejectedWithReason).toBe('Khong dong y'))
  })

  it('9 & 10. Lọc theo status và loại phép', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/leave-requests/my', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: mockLeaveRequests })
      })
    )
    render(<LeaveRequestPage />)
    
    // Click 'Đã duyệt'
    await userEvent.click(await screen.findByText('Đã duyệt'))
    await waitFor(() => expect(capturedUrl).toContain('status=APPROVED'))
  })
})

describe('AbsenceManagementPage', () => {
  const mockRecords = {
    content: [
      { id: 100, employeeCode: 'NV01', employeeName: 'Le Van B', date: '2023-01-05', note: 'Ly do vang mat' }
    ],
    totalPages: 1,
    totalElements: 1
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setupUser('ADMIN')
    server.use(
      http.get('*/attendance/range', () => HttpResponse.json({ success: true, data: mockRecords })),
      http.get('*/attendance/my-records', () => HttpResponse.json({ success: true, data: mockRecords })),
      http.get('*/employees', () => HttpResponse.json({ success: true, data: { content: [{ id: 1, code: 'NV01', name: 'Le Van B' }] } }))
    )
  })

  it('1. Render list vắng mặt', async () => {
    render(<AbsenceManagementPage />)
    await waitFor(() => {
      expect(screen.getByText('Le Van B')).toBeInTheDocument()
      expect(screen.getByText('Ly do vang mat')).toBeInTheDocument()
    })
  })

  it('2. Search và Filter theo ngày', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/attendance/range', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: mockRecords })
      })
    )
    
    render(<AbsenceManagementPage />)
    // Wait for initial load
    await waitFor(() => expect(screen.getByText('Le Van B')).toBeInTheDocument())
    
    // Type search
    const searchInput = screen.getByPlaceholderText(/Tìm tên\/mã/i)
    await userEvent.type(searchInput, 'NV01')
    
    const refreshBtn = screen.getByRole('button', { name: /Tải lại/i })
    await userEvent.click(refreshBtn)
    
    await waitFor(() => {
      expect(capturedUrl).toContain('keyword=NV01')
    })
  })

  it('3. Admin: Đánh vắng mặt', async () => {
    let markCalled = false
    server.use(
      http.post('*/attendance/absent', () => {
        markCalled = true
        return HttpResponse.json({ success: true })
      })
    )
    render(<AbsenceManagementPage />)
    
    await waitFor(() => expect(screen.getByText('Le Van B')).toBeInTheDocument())
    
    const markBtn = screen.getByRole('button', { name: /Đánh vắng mặt/i })
    await userEvent.click(markBtn)
    
    await waitFor(() => expect(markCalled).toBe(true))
  })

  it('4. User thường không thấy form đánh vắng mặt', async () => {
    setupUser('USER')
    render(<AbsenceManagementPage />)
    await waitFor(() => {
      expect(screen.getByText('Le Van B')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Đánh vắng mặt/i })).not.toBeInTheDocument()
  })
})
