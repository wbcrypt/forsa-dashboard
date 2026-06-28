import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState(localStorage.getItem('lastTenantId') || '')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !tenantId) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(email, password, tenantId)
      localStorage.setItem('lastTenantId', tenantId)
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (msg === 'Invalid credentials') {
        setError('Invalid email or password')
      } else if (err?.response?.status === 429) {
        setError('Too many login attempts. Please wait 15 minutes.')
      } else {
        setError(msg || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-navy-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-500 rounded-2xl mb-4 shadow-lg shadow-teal-500/20">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-white font-semibold text-xl">FORSA OS</h1>
          <p className="text-navy-400 text-sm mt-1">Educational Financing Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-8">
          <h2 className="text-gray-900 font-semibold text-lg mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-6">Access your admin dashboard</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@forsa.tn"
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Tenant ID</label>
              <input
                type="text"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                className="input font-mono text-xs"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-400 mt-1">
                From your organization setup
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-500 text-xs mt-6">
          © 2026 FORSA. All rights reserved.
        </p>
      </div>
    </div>
  )
}
