import { apiClient } from '../../services/apiClient'
import { tokenStorage } from '../../services/tokenStorage'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

jest.mock('../../services/tokenStorage')

const originalLocation = window.location

beforeEach(() => {
  jest.clearAllMocks()
  delete (window as any).location
  window.location = { ...originalLocation, pathname: '/', href: 'http://localhost/' } as any
})

afterAll(() => {
  window.location = originalLocation
})

describe('apiClient', () => {
  it('1. Request interceptor gắn Bearer token khi có token trong sessionStorage', async () => {
    ;(tokenStorage.get as jest.Mock).mockReturnValue('mock-token-123')
    
    let capturedAuth = ''
    server.use(
      http.get('*/test-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') || ''
        return HttpResponse.json({ success: true, data: 'ok' })
      })
    )
    
    await apiClient.get('/test-auth')
    expect(capturedAuth).toBe('Bearer mock-token-123')
  })

  it('2. Request interceptor không gắn header khi không có token', async () => {
    ;(tokenStorage.get as jest.Mock).mockReturnValue(null)
    
    let capturedAuth = ''
    server.use(
      http.get('*/test-no-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') || ''
        return HttpResponse.json({ success: true, data: 'ok' })
      })
    )
    
    await apiClient.get('/test-no-auth')
    expect(capturedAuth).toBe('')
  })

  it('3. Response interceptor unwrap ApiResponse.data khi success=true', async () => {
    server.use(
      http.get('*/test-success', () => {
        return HttpResponse.json({ success: true, data: { id: 1, name: 'Test' } })
      })
    )
    
    const res = await apiClient.get('/test-success')
    expect(res).toEqual({ id: 1, name: 'Test' })
  })

  it('4. Response interceptor reject Error khi success=false', async () => {
    server.use(
      http.get('*/test-fail', () => {
        return HttpResponse.json({ success: false, message: 'Lỗi nghiệp vụ custom' })
      })
    )
    
    await expect(apiClient.get('/test-fail')).rejects.toThrow('Lỗi nghiệp vụ custom')
  })

  it('5. 401 -> xóa token + redirect /login', async () => {
    server.use(
      http.get('*/test-401', () => {
        return new HttpResponse(null, { status: 401 })
      })
    )
    
    await expect(apiClient.get('/test-401')).rejects.toThrow()
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(window.location.href).toBe('/login')
  })

  it('6. 401 nhưng đang ở /login -> không redirect loop', async () => {
    window.location.pathname = '/login'
    const initialHref = window.location.href
    
    server.use(
      http.get('*/test-401-login', () => {
        return new HttpResponse(null, { status: 401 })
      })
    )
    
    await expect(apiClient.get('/test-401-login')).rejects.toThrow()
    expect(tokenStorage.clear).toHaveBeenCalled()
    // Href should remain unchanged because we didn't assign to it
    expect(window.location.href).toBe(initialHref)
  })

  it('7. Error parsing: trích message từ AxiosError response', async () => {
    server.use(
      http.get('*/test-axios-error', () => {
        return HttpResponse.json({ message: 'Lỗi server custom 500' }, { status: 500 })
      })
    )
    
    await expect(apiClient.get('/test-axios-error')).rejects.toThrow('Lỗi server custom 500')
  })

  it('8. Error parsing: fallback "Yêu cầu thất bại" khi không có message', async () => {
    server.use(
      http.get('*/test-axios-error-fallback', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    
    await expect(apiClient.get('/test-axios-error-fallback')).rejects.toThrow('Yêu cầu thất bại')
  })
})
