import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { apiFetch } from './api'

const SessionContext = createContext(undefined)

export function SessionProvider({ children }) {
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

  return (
    <SessionContext.Provider value={{ session, profile, profileError }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (ctx === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return ctx
}
