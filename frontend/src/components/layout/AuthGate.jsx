import Auth from '@/components/Auth'
import { useSession } from '@/lib/SessionContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AppHeader from './AppHeader'

export default function AuthGate({ children }) {
  const { session, profile, profileError } = useSession()

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
      <AppHeader />

      {profileError ? (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>Backend error: {profileError}</AlertDescription>
          </Alert>
        </div>
      ) : (
        profile && children
      )}
    </div>
  )
}
