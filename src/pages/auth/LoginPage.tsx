import { useState } from 'react'
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
            <button type="button" className="text-sm text-white/80 hover:text-white transition-colors">
              Quên mật khẩu?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
