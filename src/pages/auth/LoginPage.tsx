import { useState, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, User, Lock } from 'lucide-react'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/useAuth'

type LocationState = {
  from?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1: Input details, 2: Input OTP
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const forgotLockRef = useRef(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const state = location.state as LocationState | null
  const redirectTo = state?.from || '/'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu')
      return
    }

    setSubmitting(true)
    try {
      const response = await authService.login({ username: username.trim(), password })
      if (!response.accessToken) {
        setError('Đăng nhập thất bại (không nhận được token)')
        return
      }

      login(response.accessToken, {
        userId: response.userId,
        username: response.username,
        email: response.email,
        role: response.role,
        employeeName: response.employeeName,
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập thất bại')
    } finally {
      setSubmitting(false)
    } 
  }

  const handleInitiateForgot = async () => {
    if (forgotLockRef.current) return
    setForgotError('')
    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập email tài khoản')
      return
    }
    if (!forgotNewPassword) {
      setForgotError('Vui lòng thiết lập mật khẩu mới')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Xác nhận mật khẩu mới không khớp')
      return
    }

    forgotLockRef.current = true
    setForgotSubmitting(true)
    try {
      await authService.forgotPassword({
        email: forgotEmail.trim(),
        newPassword: forgotNewPassword
      })
      setForgotStep(2)
    } catch (err) {
      setForgotError((err as Error).message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setForgotSubmitting(false)
      forgotLockRef.current = false
    }
  }

  const handleVerifyForgot = async () => {
    if (forgotLockRef.current) return
    setForgotError('')
    setForgotSuccess('')
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Mã OTP phải gồm 6 chữ số')
      return
    }

    forgotLockRef.current = true
    setForgotSubmitting(true)
    try {
      await authService.verifyForgotPassword({
        email: forgotEmail.trim(),
        otpCode: forgotOtp.trim()
      })
      setForgotSuccess('Mật khẩu đã được đặt lại thành công!')
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotEmail('')
        setForgotNewPassword('')
        setForgotConfirmPassword('')
        setForgotOtp('')
        setForgotSuccess('')
      }, 2000)
    } catch (err) {
      setForgotError((err as Error).message || 'Xác thực mã OTP thất bại')
    } finally {
      setForgotSubmitting(false)
      forgotLockRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-blue-700 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <img src="/logo_hrm.png" alt="Logo" className="w-24 h-auto object-contain drop-shadow-md" />
        </div>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/70">
              <User className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="TÊN ĐĂNG NHẬP"
              className="w-full bg-transparent border border-white/40 focus:border-white focus:ring-1 focus:ring-white rounded-md py-3 pl-10 pr-4 text-white placeholder:text-white/60 outline-none transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/70">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="MẬT KHẨU"
              className="w-full bg-transparent border border-white/40 focus:border-white focus:ring-1 focus:ring-white rounded-md py-3 pl-10 pr-4 text-white placeholder:text-white/60 outline-none transition-all"
            />
          </div>

          {error && <p className="text-sm text-red-300 text-center bg-red-900/40 p-2 rounded">{error}</p>}

          {/* Login Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white hover:bg-gray-100 text-blue-700 font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center shadow-lg"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-700" />
            ) : null}
            ĐĂNG NHẬP
          </button>

          {/* Forgot Password */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true)
                setForgotStep(1)
                setForgotError('')
                setForgotSuccess('')
              }}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-2xl text-white relative transition-all duration-300 transform scale-100">

            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false)
                setForgotStep(1)
                setForgotEmail('')
                setForgotNewPassword('')
                setForgotConfirmPassword('')
                setForgotOtp('')
                setForgotError('')
                setForgotSuccess('')
              }}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>

            {forgotStep === 1 ? (
              <div>
                <h3 className="text-xl font-bold mb-2 text-center text-white">Quên Mật Khẩu</h3>
                <p className="text-sm text-slate-400 mb-6 text-center">Nhập email tài khoản và thiết lập mật khẩu mới</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email của bạn</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="vd: nguyenvan@gmail.com"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {forgotError && <p className="text-xs text-red-300 mt-4 text-center bg-red-900/40 p-2 rounded">{forgotError}</p>}

                <button
                  type="button"
                  disabled={forgotSubmitting}
                  onClick={handleInitiateForgot}
                  className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center shadow-md shadow-blue-900/30"
                >
                  {forgotSubmitting && <Loader2 className="h-5 w-5 animate-spin mr-2 text-white" />}
                  GỬI MÃ XÁC NHẬN
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-2 text-center text-white">Xác Minh OTP</h3>
                <p className="text-sm text-slate-400 mb-4 text-center">Một mã OTP 6 chữ số đã được gửi tới email <br /><strong className="text-white">{forgotEmail}</strong></p>
                <p className="text-xs text-yellow-400 text-center mb-6 font-medium bg-yellow-950/40 p-2 border border-yellow-800/30 rounded-lg">⚠️ Vui lòng kiểm tra kỹ cả thư mục Spam/Hòm thư rác nếu không thấy thư xác nhận.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase text-center mb-2">Nhập mã xác thực OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest text-white placeholder:text-slate-600 focus:border-green-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {forgotError && <p className="text-xs text-red-300 mt-4 text-center bg-red-900/40 p-2 rounded">{forgotError}</p>}
                {forgotSuccess && <p className="text-xs text-green-300 mt-4 text-center bg-green-900/40 p-2 rounded">{forgotSuccess}</p>}

                <button
                  type="button"
                  disabled={forgotSubmitting}
                  onClick={handleVerifyForgot}
                  className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center shadow-md shadow-green-900/30"
                >
                  {forgotSubmitting && <Loader2 className="h-5 w-5 animate-spin mr-2 text-white" />}
                  XÁC NHẬN RESET MẬT KHẨU
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="w-full mt-3 bg-transparent text-slate-400 font-semibold py-2 rounded-lg hover:text-white transition-colors text-center text-sm"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
