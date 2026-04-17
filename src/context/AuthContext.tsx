import { createContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '../types/auth'
import { authService } from '../services/authService'
import { tokenStorage } from '../services/tokenStorage'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  refreshMe: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = async () => {
    try {
      const me = await authService.me()
      setUser({
        userId: me.userId,
        username: me.username,
        email: me.email,
        role: me.role,
        employeeName: me.employeeName,
      })
    } catch {
      tokenStorage.clear()
      setUser(null)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      if (!tokenStorage.get()) {
        setLoading(false)
        return
      }

      await refreshMe()
      setLoading(false)
    }

    void bootstrap()
  }, [])

  const login = (token: string, nextUser: AuthUser) => {
    tokenStorage.set(token)
    setUser(nextUser)
  }

  const logout = () => {
    tokenStorage.clear()
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      refreshMe,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
