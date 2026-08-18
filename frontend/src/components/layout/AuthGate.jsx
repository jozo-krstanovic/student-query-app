import { Outlet } from 'react-router-dom'
import Auth from '@/components/Auth'
import { useSession } from '@/lib/SessionContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AppHeader from './AppHeader'
import LoadingState from './LoadingState'

export default function AuthGate() {
  const { session, profile, profileError } = useSession()

  if (session === undefined) {
    return <LoadingState className="min-h-svh" />
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-svh">
      <AppHeader />

      {profileError ? (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>Backend error: {profileError}</AlertDescription>
          </Alert>
        </div>
      ) : (
        profile && <Outlet />
      )}
    </div>
  )
}
