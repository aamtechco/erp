import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import useAuthStore from '../lib/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [accountType, setAccountType] = useState('client') // 'client' | 'user'
  const [registerNumber, setRegisterNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const { loginAsClient, loginAsUser, loading } = useAuthStore()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const rn = registerNumber.trim()
    if (!rn) return setError('Register number is required')

    const result =
      accountType === 'client'
        ? await loginAsClient(rn)
        : await loginAsUser(rn, password)

    if (!result.success) return setError(result.error || 'Login failed')

    toast.success('Welcome!')
    navigate(accountType === 'client' ? '/clients/dashboard' : '/users/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-950 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
            AE
          </div>
          <span className="text-white font-semibold text-lg">AccountEdge</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-snug">
            Office management,<br />
            <span className="text-brand-400">simplified.</span>
          </h1>
          <p className="text-white/50 mt-4 text-base max-w-sm">
            Manage clients, track tasks, set reminders, and generate reports — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['Clients', 'Tasks', 'Reports'].map((f) => (
            <div key={f} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/80 text-sm font-medium">{f}</p>
              <p className="text-white/30 text-xs mt-0.5">Fully integrated</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">AE</div>
            <span className="font-semibold">AccountEdge ERP</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900">Sign in</h2>
          <p className="text-surface-500 text-sm mt-1">Enter your register number to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Account type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('client')}
                  className={`btn w-full justify-center py-2 ${
                    accountType === 'client'
                      ? 'bg-surface-900 text-white hover:bg-surface-900'
                      : 'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50'
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('user')}
                  className={`btn w-full justify-center py-2 ${
                    accountType === 'user'
                      ? 'bg-surface-900 text-white hover:bg-surface-900'
                      : 'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50'
                  }`}
                >
                  User
                </button>
              </div>
            </div>

            <div>
              <label className="label">Register number</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. REG-100234"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                required
                autoFocus
              />
            </div>

            {accountType === 'user' ? (
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ) : null}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in…' : accountType === 'client' ? 'Enter client dashboard' : 'Enter user dashboard'}
            </button>
          </form>

          <p className="text-xs text-surface-400 mt-6 text-center">
            Clients: no password required. Users: password required.
          </p>
        </div>
      </div>
    </div>
  )
}
