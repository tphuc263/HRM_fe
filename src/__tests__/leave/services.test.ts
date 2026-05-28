/**
 * @jest-environment node
 */
import { leaveService } from '../../services/leaveService'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
jest.mock('../../services/tokenStorage', () => ({
  tokenStorage: {
    get: jest.fn().mockReturnValue('mock-token'),
  }
}))

describe('leaveService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('1. getLeaveTypes() -> GET /leave-types', async () => {
    server.use(
      http.get('*/leave-types', () => HttpResponse.json({ success: true, data: [{ id: 1, name: 'AL' }] }))
    )
    const res = await leaveService.getLeaveTypes()
    expect(res).toEqual([{ id: 1, name: 'AL' }])
  })

  it('2. createLeaveType() -> POST /leave-types', async () => {
    let capturedBody: any
    server.use(
      http.post('*/leave-types', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { id: 1 } })
      })
    )
    // @ts-ignore
    await leaveService.createLeaveType({ name: 'SL', defaultDays: 10, requiresApproval: true })
    expect(capturedBody).toEqual({ name: 'SL', defaultDays: 10, requiresApproval: true })
  })

  it('3. updateLeaveType() -> PUT /leave-types/:id', async () => {
    let capturedBody: any
    server.use(
      http.put('*/leave-types/1', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { id: 1 } })
      })
    )
    // @ts-ignore
    await leaveService.updateLeaveType(1, { name: 'SL Updated', defaultDays: 15, requiresApproval: false })
    expect(capturedBody).toEqual({ name: 'SL Updated', defaultDays: 15, requiresApproval: false })
  })

  it('4. submitRequest() -> POST /leave-requests', async () => {
    let capturedBody: any
    server.use(
      http.post('*/leave-requests', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: { id: 10 } })
      })
    )
    const payload = { leaveTypeId: 1, startDate: '2023-01-01', endDate: '2023-01-02', reason: 'Sick' }
    // @ts-ignore
    await leaveService.submitRequest(payload)
    expect(capturedBody).toEqual(payload)
  })

  it('5. cancelRequest() -> PUT /leave-requests/:id/cancel', async () => {
    let called = false
    server.use(
      http.put('*/leave-requests/10/cancel', () => {
        called = true
        return HttpResponse.json({ success: true, data: { status: 'CANCELLED' } })
      })
    )
    await expect(leaveService.cancelRequest(10)).resolves.not.toThrow()
    expect(called).toBe(true)
  })

  it('6. approveRequest() -> PUT /leave-requests/:id/approve', async () => {
    let called = false
    server.use(
      http.put('*/leave-requests/10/approve', () => {
        called = true
        return HttpResponse.json({ success: true, data: { status: 'APPROVED' } })
      })
    )
    await expect(leaveService.approveRequest(10)).resolves.not.toThrow()
    expect(called).toBe(true)
  })

  it('7. rejectRequest() -> PUT /leave-requests/:id/reject + reason param', async () => {
    let capturedUrl = ''
    server.use(
      http.put('*/leave-requests/10/reject', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: { status: 'REJECTED' } })
      })
    )
    await leaveService.rejectRequest(10, 'Too busy')
    expect(capturedUrl).toMatch(/reason=Too[+%20]busy/)
  })

  it('8. getMyRequests() truyền đúng query params', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/leave-requests/my', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: { content: [] } })
      })
    )
    await leaveService.getMyRequests({ status: 'PENDING', page: 0, size: 10 })
    expect(capturedUrl).toContain('status=PENDING')
    expect(capturedUrl).toContain('page=0')
    expect(capturedUrl).toContain('size=10')
  })

  it('9. getMyBalances() truyền year', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/leave-balances/my', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: [] })
      })
    )
    await leaveService.getMyBalances(2023)
    expect(capturedUrl).toContain('year=2023')
  })

  it('10. initBalance() -> POST /leave-balances/init với employeeId + year', async () => {
    let capturedUrl = ''
    server.use(
      http.post('*/leave-balances/init', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: null })
      })
    )
    await leaveService.initBalance(5, 2023)
    expect(capturedUrl).toContain('employeeId=5')
    expect(capturedUrl).toContain('year=2023')
  })

  it('11. updateBalance() -> PUT /leave-balances/:id với totalDays, carryOverDays', async () => {
    let capturedUrl = ''
    server.use(
      http.put('*/leave-balances/20', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: { id: 20 } })
      })
    )
    await leaveService.updateBalance(20, 15, 2)
    expect(capturedUrl).toContain('totalDays=15')
    expect(capturedUrl).toContain('carryOverDays=2')
  })
})
