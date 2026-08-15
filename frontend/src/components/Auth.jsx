import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        setResetSent(true)
      }
      return
    }

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setSignedUp(true)
    }
  }

  function switchMode(newMode) {
    setMode(newMode)
    setError(null)
    setResetSent(false)
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        {signedUp ? (
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Check your email to confirm your account, then log in.
          </CardContent>
        ) : resetSent ? (
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Check your email for a link to reset your password.
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle>
                {mode === 'login' ? 'Log in' : mode === 'signup' ? 'Sign up' : 'Reset password'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Sign in to your account to continue.'
                  : mode === 'signup'
                    ? 'Create a student account to submit inquiries.'
                    : "Enter your email and we'll send you a reset link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Log in'
                      : mode === 'signup'
                        ? 'Sign up'
                        : 'Send reset link'}
                </Button>
              </form>

              {mode === 'login' && (
                <Button
                  type="button"
                  variant="link"
                  className="mt-1 w-full"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot your password?
                </Button>
              )}

              <Button
                type="button"
                variant="link"
                className="mt-1 w-full"
                onClick={() => switchMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup')}
              >
                {mode === 'signup'
                  ? 'Already have an account? Log in'
                  : mode === 'forgot'
                    ? 'Back to log in'
                    : "Don't have an account? Sign up"}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
