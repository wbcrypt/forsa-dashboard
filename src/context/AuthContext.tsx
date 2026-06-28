import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'

interface User {
  id: string
  email: string
  tenantId: string
  permissions: string[]
}

interface AuthContextValue {
  user: User | null
  tenantId: string | null
  loading: boolean
  login: (email: string, password: string, tenantId: string) => Promise<{ requiresMfa?: boolean; mfaToken?: string }>
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      authApi.me()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.clear()
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string, tenantId: string) => {
    const res = await authApi.login(email, password, tenantId)
    const data = res.data

    if (data.requiresMfa) {
      return { requiresMfa: true, mfaToken: data.mfaToken }
    }

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('tenantId', tenantId)

    const meRes = await authApi.me()
    setUser(meRes.data)
    return {}
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    localStorage.clear()
    setUser(null)
    window.location.href = '/login'
  }, [])

  const hasPermission = useCallback((permission: string) => {
    return user?.permissions?.includes(permission) ?? false
  }, [user])

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(p => user?.permissions?.includes(p) ?? false)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      tenantId: user?.tenantId ?? localStorage.getItem('tenantId'),
      loading,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
