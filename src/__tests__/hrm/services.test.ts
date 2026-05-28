/**
 * @jest-environment node
 */
import { employeeService } from '../../services/employeeService'
import { contractService } from '../../services/contractService'
import { departmentService } from '../../services/departmentService'
import { shiftService } from '../../services/shiftService'
import { holidayService } from '../../services/holidayService'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('HRM Services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // employeeService
  // ==========================================
  describe('employeeService', () => {
    it('getAll', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/employees', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: { content: [] } })
        })
      )
      const res = await employeeService.getAll({ page: 0, status: 'ACTIVE' })
      console.log('EMPLOYEE RES IS:', JSON.stringify(res))
      expect(capturedUrl).toContain('status=ACTIVE')
    })

    it('create', async () => {
      let capturedBody: any
      server.use(
        http.post('*/employees', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: { id: 1 } })
        })
      )
      // @ts-ignore
      await employeeService.create({ name: 'Test', email: 'test@t.com', code: 'T', phone: '1', departmentId: 1, position: 'Dev' })
      expect(capturedBody.name).toBe('Test')
    })

    it('resign', async () => {
      let capturedUrl = ''
      server.use(
        http.put('*/employees/1/resign', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true })
        })
      )
      await employeeService.resign(1, '2023-12-31')
      expect(capturedUrl).toContain('resignationDate=2023-12-31')
    })
  })

  // ==========================================
  // contractService
  // ==========================================
  describe('contractService', () => {
    it('create', async () => {
      let capturedBody: any
      server.use(
        http.post('*/contracts', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: { id: 1 } })
        })
      )
      await contractService.create({ employeeId: 1, contractType: 'FULLTIME', startDate: '2023', endDate: '2024', basicSalary: 10 })
      expect(capturedBody.contractType).toBe('FULLTIME')
    })

    it('activate', async () => {
      let called = false
      server.use(
        http.put('*/contracts/1/activate', () => {
          called = true
          return HttpResponse.json({ success: true, data: { status: 'ACTIVE' } })
        })
      )
      await expect(contractService.activate(1)).resolves.not.toThrow()
      expect(called).toBe(true)
    })
  })

  // ==========================================
  // Other Services (Department, Shift, Holiday)
  // ==========================================
  describe('Other HRM Services', () => {
    it('departmentService.getAll', async () => {
      server.use(
        http.get(new RegExp('/departments$'), () => new HttpResponse(JSON.stringify({ success: true, data: [{ id: 1, name: 'IT' }] }), { headers: { 'Content-Type': 'application/json' } }))
      )
      const res = await departmentService.getAll()
      console.log('RES IS:', JSON.stringify(res))
      expect(res[0].name).toBe('IT')
    })

    it('shiftService.getAll', async () => {
      server.use(
        http.get('*/shifts', () => HttpResponse.json({ success: true, data: [{ id: 1, name: 'Ca sang' }] }))
      )
      const res = await shiftService.getAll()
      expect(res[0].name).toBe('Ca sang')
    })

    it('holidayService.getAll', async () => {
      let capturedUrl = ''
      server.use(
        http.get('*/holidays', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ success: true, data: [] })
        })
      )
      await holidayService.getAll()
      expect(capturedUrl).toContain('/holidays')
    })
  })
})
