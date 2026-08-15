import { Link, useLocation } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/lib/SessionContext'
import { Button } from '@/components/ui/button'

function NavButton({ to, children }) {
  const { pathname } = useLocation()
  // "/" also covers /new and /:id -- the inquiries list, new-inquiry form,
  // and a specific inquiry's detail are all part of the same section.
  const active = to === '/' ? pathname === '/' || pathname === '/new' || /^\/\d+$/.test(pathname) : pathname === to

  return (
    <Button variant={active ? 'secondary' : 'ghost'} size="sm" asChild>
      <Link to={to}>{children}</Link>
    </Button>
  )
}

export default function AppHeader() {
  const { session, profile } = useSession()

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <GraduationCap className="size-5" />
          Student Query
        </Link>
        <nav className="flex items-center gap-1">
          {profile?.user_type === 'superuser' ? (
            <>
              <NavButton to="/">Inquiries</NavButton>
              <NavButton to="/admin">Admin panel</NavButton>
            </>
          ) : (
            profile && <span className="px-2.5 text-sm text-muted-foreground">Inquiries</span>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Signed in as {session.user.email}</span>
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
