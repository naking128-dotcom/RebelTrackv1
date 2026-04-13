'use client'
import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Password rules
const RULES = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'One uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',   test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p: string) => /\d/.test(p) },
  { label: 'One special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function ResetForm() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const passed  = RULES.filter(r => r.test(password))
  const allPass = passed.length === RULES.length
  const matches = password === confirm && confirm.length > 0

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!allPass) { toast.error('Password does not meet all requirements'); return }
    if (!matches) { toast.error('Passwords do not match'); return }

    setLoading(true)

    // 1. Update the password in Supabase Auth
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      toast.error(pwError.message || 'Failed to update password')
      setLoading(false)
      return
    }

    // 2. Clear the must_reset_pw flag on the profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ must_reset_pw: false })
        .eq('id', user.id)
    }

    toast.success('Password updated — redirecting to dashboard')
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center text-white font-bold text-xl rounded-2xl mx-auto mb-4"
            style={{ width: 60, height: 60, background: '#CE1126' }}
          >
            RT
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Set your password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your account requires a new password before you can continue.
          </p>
        </div>

        <form
          onSubmit={handleReset}
          className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm"
        >
          {/* New password */}
          <div className="mb-4">
            <label className="form-label">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••••"
              autoComplete="new-password"
            />
          </div>

          {/* Rule checklist */}
          {password.length > 0 && (
            <ul className="mb-4 space-y-1">
              {RULES.map(r => {
                const ok = r.test(password)
                return (
                  <li key={r.label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                    <span className={`inline-block w-4 h-4 rounded-full border text-center leading-4 text-xs font-bold flex-shrink-0 ${ok ? 'bg-green-100 border-green-400 text-green-700' : 'border-slate-300'}`}>
                      {ok ? '✓' : ''}
                    </span>
                    {r.label}
                  </li>
                )
              })}
            </ul>
          )}

          {/* Confirm password */}
          <div className="mb-6">
            <label className="form-label">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`form-input ${confirm.length > 0 ? (matches ? 'border-green-400' : 'border-red-400') : ''}`}
              placeholder="••••••••••"
              autoComplete="new-password"
            />
            {confirm.length > 0 && !matches && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allPass || !matches}
            className="btn btn-primary w-full justify-center py-2.5 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    }>
      <ResetForm />
    </Suspense>
  )
}
