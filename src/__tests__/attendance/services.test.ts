/**
 * @jest-environment node
 */
import { attendanceService } from '../../services/attendanceService'
import { overtimeService } from '../../services/overtimeService'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('Attendance Services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // attendanceService (10 methods)
  // ==========================================
  describe('attendanceService', () => {
    it('checkIn', async () => {
      let capturedBody: any
      server.use(
        http.post('*/attendance/check-in', async ({ request }) => {
          capturedBody = await request.json().catch(() => ({}))
          return HttpResponse.json({ success: true, data: { id: 1 } })
        })
      )
      await attendanceService.checkIn({ latitude: 10, longitude: 106 })
      expect(capturedBody).toEqual({ latitude: 10, longitude: 106 })
    })

    it('checkOut', async () => {
      let capturedBody: any
      server.use(
        http.post('*/attendance/check-out', async ({ request }) => {
          capturedBody = await request.json().catch(() => ({}))
          return HttpResponse.json({ success: true, data: { id: 1 } })
        })
      )
      await attendanceService.checkOut({ latitude: 10, longitude: 106 })
      expect(capturedBody).toEqual({ latitude: 10, longitude: 106 })
    })

    it('getToday', async () => {
      server.use(
        http.get('*/attendance/today', () => HttpResponse.json({ success: true, data: { id: 2 } }))
      )
      const res = await attendanceService.getToday()
      expect(res).toEqual({ id: 2 })
    })

    it('getMyRecords', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/attendance/my-records', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { content: [] } })
        })
      )
      await attendanceService.getMyRecords({ page: 0, status: 'PRESENT' })
      expect(capturedUrl).toContain('status=PRESENT')
      expect(capturedUrl).toContain('page=0')
    })

    it('getDaily', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/attendance/daily', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { content: [] } })
        })
      )
      await attendanceService.getDaily({ date: '2023-01-01', page: 0 })
      expect(capturedUrl).toContain('date=2023-01-01')
    })

    it('getRange', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/attendance/range', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { content: [] } })
        })
      )
      await attendanceService.getRange({ fromDate: '2023-01-01', toDate: '2023-01-31' })
      expect(capturedUrl).toContain('fromDate=2023-01-01')
      expect(capturedUrl).toContain('toDate=2023-01-31')
    })

    it('getEmployeeRecords', async () => {
      server.use(
        http.get('*/attendance/employee/5', () => HttpResponse.json({ success: true, data: { content: [] } }))
      )
      const res = await attendanceService.getEmployeeRecords(5, {})
      expect(res).toEqual({ content: [] })
    })

    it('getMonthlyStats', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/attendance/stats/5', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { presentDays: 20 } })
        })
      )
      await attendanceService.getMonthlyStats(5, 5, 2023)
      expect(capturedUrl).toContain('month=5')
      expect(capturedUrl).toContain('year=2023')
    })

    it('adminUpdate', async () => {
      let capturedBody: any
      server.use(
        http.put('*/attendance/10', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: { id: 10 } })
        })
      )
      await attendanceService.adminUpdate(10, { note: 'Forgot checkin' })
      expect(capturedBody).toEqual({ note: 'Forgot checkin' })
    })

    it('markAbsent', async () => {
      let capturedUrl = ''
      server.use(
        http.post('*/attendance/mark-absent', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { id: 11 } })
        })
      )
      await attendanceService.markAbsent(5, '2023-01-01', 'Sick')
      expect(capturedUrl).toContain('employeeId=5')
      expect(capturedUrl).toContain('date=2023-01-01')
      expect(capturedUrl).toContain('note=Sick')
    })
  })

  // ==========================================
  // overtimeService (6 methods)
  // ==========================================
  describe('overtimeService', () => {
    it('createRequest', async () => {
      let capturedBody: any
      server.use(
        http.post('*/overtime-requests', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: { id: 1 } })
        })
      )
      await overtimeService.createRequest({ date: '2023-01-01', hours: 2, reason: 'Fix bug' })
      expect(capturedBody).toEqual({ date: '2023-01-01', hours: 2, reason: 'Fix bug' })
    })

    it('getMyRequests', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/overtime-requests/my', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { content: [] } })
        })
      )
      await overtimeService.getMyRequests({ status: 'PENDING' })
      expect(capturedUrl).toContain('status=PENDING')
    })

    it('getAllRequests', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/overtime-requests', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { content: [] } })
        })
      )
      await overtimeService.getAllRequests({ status: 'APPROVED' })
      expect(capturedUrl).toContain('status=APPROVED')
    })

    it('approveRequest', async () => {
      server.use(
        http.put('*/overtime-requests/10/approve', () => HttpResponse.json({ success: true, data: { id: 10 } }))
      )
      const res = await overtimeService.approveRequest(10)
      expect(res).toEqual({ id: 10 })
    })

    it('rejectRequest', async () => {
      let capturedUrl = ''
      server.use(
        http.put('*/overtime-requests/10/reject', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { id: 10 } })
        })
      )
      await overtimeService.rejectRequest(10, 'No need')
      expect(capturedUrl).toMatch(/reason=No[+%20]need/)
    })

    it('cancelRequest', async () => {
      server.use(
        http.delete('*/overtime-requests/10', () => HttpResponse.json({ success: true, data: null }))
      )
      await expect(overtimeService.cancelRequest(10)).resolves.not.toThrow()
    })
  })
})
