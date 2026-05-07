import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, User } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/token'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (getToken()) {
      authApi.me().then(res => setUser(res.data)).catch(() => removeToken()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (token: string) => {
    setToken(token)
    const res = await authApi.me()
    setUser(res.data)
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
