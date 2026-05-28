import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

import { authService } from '../../services/authService'
import { tokenStorage } from '../../services/tokenStorage'
import { AuthProvider, AuthContext } from '../../context/AuthContext'
import { useAuth } from '../../context/useAuth'
import RequireAuth from '../../components/auth/RequireAuth'
import LoginPage from '../../pages/auth/LoginPage'

// --- Mocks ---
jest.mock('../../services/tokenStorage', () => ({
  tokenStorage: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
}))

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================
  // 1. authService
  // ============================================
  describe('authService', () => {
    it('1. login() -> POST /auth/login', async () => {
      let capturedBody: any
      server.use(
        http.post('*/auth/login', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: { accessToken: 'token123' } })
        })
      )
      const res = await authService.login({ username: 'admin', password: '123' })
      expect(capturedBody).toEqual({ username: 'admin', password: '123' })
      expect(res).toEqual({ accessToken: 'token123' })
    })

    it('2. me() -> GET /auth/me', async () => {
      server.use(
        http.get('*/auth/me', () => {
          return HttpResponse.json({ success: true, data: { userId: 1, role: 'ADMIN' } })
        })
      )
      const res = await authService.me()
      expect(res).toEqual({ userId: 1, role: 'ADMIN' })
    })

    it('3. forgotPassword() -> POST /auth/forgot-password', async () => {
      let capturedBody: any
      server.use(
        http.post('*/auth/forgot-password', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: 'OTP sent' })
        })
      )
      await authService.forgotPassword({ email: 'test@gmail.com', newPassword: '123' })
      expect(capturedBody).toEqual({ email: 'test@gmail.com', newPassword: '123' })
    })

    it('4. verifyForgotPassword() -> POST /auth/verify-forgot-password', async () => {
      let capturedBody: any
      server.use(
        http.post('*/auth/verify-forgot-password', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true, data: 'OK' })
        })
      )
      await authService.verifyForgotPassword({ email: 'test@gmail.com', otpCode: '123456' })
      expect(capturedBody).toEqual({ email: 'test@gmail.com', otpCode: '123456' })
    })
  })

  // ============================================
  // 2. AuthContext
  // ============================================
  describe('AuthContext', () => {
    const TestComponent = () => {
      const { user, isAuthenticated, loading, login, logout, refreshMe } = useAuth()
      if (loading) return <div>Loading...</div>
      return (
        <div>
          <span data-testid="isAuth">{String(isAuthenticated)}</span>
          <span data-testid="username">{user?.username || 'null'}</span>
          <button onClick={() => login('new-token', { userId: 2, username: 'testuser', role: 'USER', email: '', employeeName: 'Test' })}>LoginBtn</button>
          <button onClick={logout}>LogoutBtn</button>
        </div>
      )
    }

    it('1. Không có token -> user=null, loading=false', async () => {
      ;(tokenStorage.get as jest.Mock).mockReturnValue(null)
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      expect(screen.getByTestId('isAuth')).toHaveTextContent('false')
      expect(screen.getByTestId('username')).toHaveTextContent('null')
    })

    it('2. Có token -> gọi me(), set user từ response', async () => {
      ;(tokenStorage.get as jest.Mock).mockReturnValue('token')
      server.use(
        http.get('*/auth/me', () => {
          return HttpResponse.json({ success: true, data: { userId: 1, username: 'adminuser', role: 'ADMIN' } })
        })
      )
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByTestId('isAuth')).toHaveTextContent('true')
        expect(screen.getByTestId('username')).toHaveTextContent('adminuser')
      })
    })

    it('3. Có token nhưng me() fail -> clear token, user=null', async () => {
      ;(tokenStorage.get as jest.Mock).mockReturnValue('bad-token')
      server.use(
        http.get('*/auth/me', () => {
          return HttpResponse.json({ success: false, message: 'Invalid token' })
        })
      )
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      await waitFor(() => {
        expect(screen.getByTestId('isAuth')).toHaveTextContent('false')
        expect(tokenStorage.clear).toHaveBeenCalled()
      })
    })

    it('4. login() -> lưu token + set user', async () => {
      ;(tokenStorage.get as jest.Mock).mockReturnValue(null)
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      await userEvent.click(screen.getByText('LoginBtn'))
      expect(tokenStorage.set).toHaveBeenCalledWith('new-token')
      expect(screen.getByTestId('isAuth')).toHaveTextContent('true')
      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
    })

    it('5. logout() -> xóa token + user=null', async () => {
      ;(tokenStorage.get as jest.Mock).mockReturnValue('token')
      server.use(
        http.get('*/auth/me', () => HttpResponse.json({ success: true, data: { userId: 1, username: 'admin' } }))
      )
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      await waitFor(() => expect(screen.getByTestId('isAuth')).toHaveTextContent('true'))
      
      await userEvent.click(screen.getByText('LogoutBtn'))
      expect(tokenStorage.clear).toHaveBeenCalled()
      expect(screen.getByTestId('isAuth')).toHaveTextContent('false')
    })

    it('6. useAuth() ngoài AuthProvider -> throw Error', () => {
      // suppress console.error for expected error
      const originalError = console.error
      console.error = jest.fn()
      expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')
      console.error = originalError
    })
  })

  // ============================================
  // 3. RequireAuth
  // ============================================
  describe('RequireAuth', () => {
    const renderWithContext = (contextValue: any, props: any = {}) => {
      return render(
        <AuthContext.Provider value={contextValue}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route path="/login" element={<div data-testid="login-page">LoginPage</div>} />
              <Route path="/" element={<div data-testid="home-page">HomePage</div>} />
              <Route
                path="/protected"
                element={
                  <RequireAuth allowedRoles={props.allowedRoles}>
                    <div data-testid="protected-content">Protected Content</div>
                  </RequireAuth>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      )
    }

    it('1. loading=true -> hiện loading indicator', () => {
      renderWithContext({ loading: true, isAuthenticated: false })
      expect(screen.getByText('Dang tai du lieu dang nhap...')).toBeInTheDocument()
    })

    it('2. Chưa login -> redirect /login', () => {
      renderWithContext({ loading: false, isAuthenticated: false })
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('3. Đã login + đúng role -> render children', () => {
      renderWithContext(
        { loading: false, isAuthenticated: true, user: { role: 'ADMIN' } },
        { allowedRoles: ['ADMIN'] }
      )
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('4. Đã login + sai role -> redirect /', () => {
      renderWithContext(
        { loading: false, isAuthenticated: true, user: { role: 'USER' } },
        { allowedRoles: ['ADMIN'] }
      )
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('5. Không truyền allowedRoles -> cho phép mọi authenticated user', () => {
      renderWithContext({ loading: false, isAuthenticated: true, user: { role: 'USER' } })
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  // ============================================
  // 4. LoginPage
  // ============================================
  describe('LoginPage', () => {
    const renderLoginPage = (contextValue: any = {}) => {
      const defaultContext = {
        isAuthenticated: false,
        loading: false,
        login: jest.fn(),
        ...contextValue
      }
      return render(
        <AuthContext.Provider value={defaultContext}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<div data-testid="home">Home</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      )
    }

    it('1. Render form: input username, password, button ĐĂNG NHẬP', () => {
      renderLoginPage()
      expect(screen.getByPlaceholderText('TÊN ĐĂNG NHẬP')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('MẬT KHẨU')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ĐĂNG NHẬP/i })).toBeInTheDocument()
    })

    it('2. Đã authenticated -> redirect /', () => {
      renderLoginPage({ isAuthenticated: true })
      expect(screen.getByTestId('home')).toBeInTheDocument()
    })

    it('3. Submit form trống -> lỗi "Vui lòng nhập đầy đủ..."', async () => {
      renderLoginPage()
      await userEvent.click(screen.getByRole('button', { name: /ĐĂNG NHẬP/i }))
      expect(screen.getByText(/Vui lòng nhập đầy đủ/i)).toBeInTheDocument()
    })

    it('4 & 5. Submit hợp lệ -> gọi login() API + gọi login() context + navigate', async () => {
      const mockLoginContext = jest.fn()
      server.use(
        http.post('*/auth/login', () => {
          return HttpResponse.json({ success: true, data: { accessToken: 'token123', username: 'admin' } })
        })
      )
      renderLoginPage({ login: mockLoginContext })
      
      await userEvent.type(screen.getByPlaceholderText('TÊN ĐĂNG NHẬP'), 'admin')
      await userEvent.type(screen.getByPlaceholderText('MẬT KHẨU'), '123456')
      await userEvent.click(screen.getByRole('button', { name: /ĐĂNG NHẬP/i }))
      
      await waitFor(() => {
        expect(mockLoginContext).toHaveBeenCalledWith('token123', expect.objectContaining({ username: 'admin' }))
        expect(screen.getByTestId('home')).toBeInTheDocument()
      })
    })

    it('6. Login response không có accessToken -> hiện lỗi', async () => {
      server.use(
        http.post('*/auth/login', () => {
          return HttpResponse.json({ success: true, data: { username: 'admin' } }) // missing accessToken
        })
      )
      renderLoginPage()
      await userEvent.type(screen.getByPlaceholderText('TÊN ĐĂNG NHẬP'), 'admin')
      await userEvent.type(screen.getByPlaceholderText('MẬT KHẨU'), '123456')
      await userEvent.click(screen.getByRole('button', { name: /ĐĂNG NHẬP/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Đăng nhập thất bại (không nhận được token)')).toBeInTheDocument()
      })
    })

    it('7. Login thất bại -> hiện error message', async () => {
      server.use(
        http.post('*/auth/login', () => {
          return HttpResponse.json({ success: false, message: 'Sai mật khẩu' })
        })
      )
      renderLoginPage()
      await userEvent.type(screen.getByPlaceholderText('TÊN ĐĂNG NHẬP'), 'admin')
      await userEvent.type(screen.getByPlaceholderText('MẬT KHẨU'), 'wrong')
      await userEvent.click(screen.getByRole('button', { name: /ĐĂNG NHẬP/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Sai mật khẩu')).toBeInTheDocument()
      })
    })

    it('8. Button disabled khi submitting', async () => {
      server.use(
        http.post('*/auth/login', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({ success: true, data: { accessToken: 'token' } })
        })
      )
      renderLoginPage()
      await userEvent.type(screen.getByPlaceholderText('TÊN ĐĂNG NHẬP'), 'admin')
      await userEvent.type(screen.getByPlaceholderText('MẬT KHẨU'), '123456')
      
      const btn = screen.getByRole('button', { name: /ĐĂNG NHẬP/i })
      await userEvent.click(btn)
      
      expect(btn).toBeDisabled()
      await waitFor(() => expect(btn).not.toBeDisabled()) // wait for completion
    })

    it('9. Click "Quên mật khẩu?" -> mở modal', async () => {
      renderLoginPage()
      await userEvent.click(screen.getByText('Quên mật khẩu?'))
      expect(screen.getByText('Quên Mật Khẩu')).toBeInTheDocument() // Modal title
    })

    it('10. Forgot: password !== confirm -> hiện lỗi', async () => {
      renderLoginPage()
      await userEvent.click(screen.getByText('Quên mật khẩu?'))
      
      const emailInput = screen.getByPlaceholderText('vd: nguyenvan@gmail.com')
      const pwdInputs = screen.getAllByPlaceholderText('••••••••')
      
      await userEvent.type(emailInput, 'test@gmail.com')
      await userEvent.type(pwdInputs[0], '123')
      await userEvent.type(pwdInputs[1], '456')
      
      await userEvent.click(screen.getByRole('button', { name: /GỬI MÃ XÁC NHẬN/i }))
      expect(screen.getByText('Xác nhận mật khẩu mới không khớp')).toBeInTheDocument()
    })

    it('11. Forgot: submit OK -> chuyển step 2 (OTP)', async () => {
      server.use(
        http.post('*/auth/forgot-password', () => HttpResponse.json({ success: true }))
      )
      renderLoginPage()
      await userEvent.click(screen.getByText('Quên mật khẩu?'))
      
      const emailInput = screen.getByPlaceholderText('vd: nguyenvan@gmail.com')
      const pwdInputs = screen.getAllByPlaceholderText('••••••••')
      
      await userEvent.type(emailInput, 'test@gmail.com')
      await userEvent.type(pwdInputs[0], '123')
      await userEvent.type(pwdInputs[1], '123')
      
      await userEvent.click(screen.getByRole('button', { name: /GỬI MÃ XÁC NHẬN/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Xác Minh OTP')).toBeInTheDocument() // Step 2 title
      })
    })

    it('12. Forgot: verify OTP thành công -> success message + đóng modal', async () => {
      jest.useFakeTimers()
      server.use(
        http.post('*/auth/forgot-password', () => HttpResponse.json({ success: true })),
        http.post('*/auth/verify-forgot-password', () => HttpResponse.json({ success: true }))
      )
      renderLoginPage()
      await userEvent.click(screen.getByText('Quên mật khẩu?'))
      
      // Step 1
      await userEvent.type(screen.getByPlaceholderText('vd: nguyenvan@gmail.com'), 't@g.com')
      const pwds = screen.getAllByPlaceholderText('••••••••')
      await userEvent.type(pwds[0], '1')
      await userEvent.type(pwds[1], '1')
      await userEvent.click(screen.getByRole('button', { name: /GỬI MÃ XÁC NHẬN/i }))
      
      // Wait for step 2
      await waitFor(() => screen.getByText('Xác Minh OTP'))
      
      // Step 2
      await userEvent.type(screen.getByPlaceholderText('000000'), '123456')
      await userEvent.click(screen.getByRole('button', { name: /XÁC NHẬN RESET MẬT KHẨU/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Mật khẩu đã được đặt lại thành công!')).toBeInTheDocument()
      })
      
      // Trigger timeout to close modal
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Quên Mật Khẩu')).not.toBeInTheDocument()
      })
      jest.useRealTimers()
    })
  })
})
