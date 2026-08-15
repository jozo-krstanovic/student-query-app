import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { apiFetch } from '@/lib/api'
import Auth from '@/components/Auth'
import AdminPanel from '@/components/admin/AdminPanel'
import StudentDashboard from '@/components/student/StudentDashboard'
import FacultyDashboard from '@/components/faculty/FacultyDashboard'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileError(null)
      return
    }
    apiFetch('/api/me')
      .then((body) => setProfile(body.user))
      .catch((err) => setProfileError(err.message))
  }, [session])

  if (session === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm text-muted-foreground">Signed in as {session.user.email}</span>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
          Log out
        </Button>
      </header>

      {profileError ? (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>Backend error: {profileError}</AlertDescription>
          </Alert>
        </div>
      ) : (
        profile &&
        (profile.user_type === 'superuser' ? (
          <AdminPanel />
        ) : profile.user_type === 'faculty' ? (
          <FacultyDashboard />
        ) : (
          <StudentDashboard />
        ))
      )}
    </div>
  )
}

export default App
