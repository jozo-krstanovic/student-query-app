import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { apiFetch } from './lib/api'
import Auth from './components/Auth'
import './App.css'

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
    return <p>Loading...</p>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="dashboard">
      <h1>Signed in as {session.user.email}</h1>
      {profileError && <p className="error">Backend error: {profileError}</p>}
      {profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}
      <button type="button" onClick={() => supabase.auth.signOut()}>
        Log out
      </button>
    </div>
  )
}

export default App
