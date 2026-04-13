'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// useSearchParams must be inside a Suspense boundary in Next.js 14
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const errorParam = searchParams.get('error')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message || 'Invalid credentials')
      setLoading(false)
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      toast.error('Login succeeded, but no session was returned. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('must_reset_pw, is_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      toast.error('Your account profile could not be loaded.')
      setLoading(false)
      return
    }

    if (!profile?.is_active) {
      toast.error('Your account is disabled. Contact IT.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    window.location.assign(profile?.must_reset_pw ? '/reset-password' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center text-white font-bold text-xl rounded-2xl mx-auto mb-4"
            style={{ width: 60, height: 60, background: '#CE1126' }}
          >
            RT
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">RebelTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Ole Miss Athletics</p>
        </div>

        {errorParam === 'account_disabled' && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            Your account has been disabled. Contact IT.
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
          <div className="mb-4">
            <label className="form-label">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@olemiss.edu"
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center py-2.5"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Account access is managed by IT Administration.<br />
          Contact <a href="mailto:athletics-it@olemiss.edu" className="underline">athletics-it@olemiss.edu</a> for access.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
