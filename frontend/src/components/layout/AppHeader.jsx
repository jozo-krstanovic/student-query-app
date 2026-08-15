import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/lib/SessionContext'
import { Button } from '@/components/ui/button'

export default function AppHeader() {
  const { session } = useSession()

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <span className="text-sm text-muted-foreground">Signed in as {session.user.email}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/account">Account</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
          Log out
        </Button>
      </div>
    </header>
  )
}
