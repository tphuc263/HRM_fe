import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
      setError('Vui long nhap day du ten dang nhap va mat khau')
      return
    }

    setSubmitting(true)
    try {
      const response = await authService.login({ username: username.trim(), password })
      if (!response.accessToken) {
        setError('Backend khong tra ve access token')
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
      setError((err as Error).message || 'Dang nhap that bai')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Dang nhap HRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Su dung tai khoan backend de truy cap he thong.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Ten dang nhap</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nhap username" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Mat khau</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhap mat khau"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Dang nhap
          </Button>
        </form>
      </div>
    </div>
  )
}
