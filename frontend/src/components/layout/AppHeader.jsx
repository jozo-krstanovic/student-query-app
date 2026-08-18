import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/lib/SessionContext'
import { useNotifications } from '@/lib/useNotifications'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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

function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  function handleSelect(notification) {
    if (!notification.is_read) {
      markRead(notification.id)
    }
    setOpen(false)
    navigate(`/${notification.inquiry_id}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-2.5">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-2.5">
          {notifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleSelect(notification)}
                  className="block w-full rounded-md p-2 text-left text-sm hover:bg-muted"
                >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                    <div className={notification.is_read ? 'text-muted-foreground' : ''}>
                      <p>{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
        <NotificationBell />
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
