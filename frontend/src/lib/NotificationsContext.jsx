import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSession } from './SessionContext'
import { apiFetch } from './api'
import { echo } from './echo'

const NotificationsContext = createContext(undefined)

export function NotificationsProvider({ children }) {
  const { profile } = useSession()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  // The most recently live-pushed notification (not the initial REST batch)
  // -- lets a page already showing that inquiry refresh itself immediately,
  // rather than only picking up new data on the next navigation/mount.
  const [lastEvent, setLastEvent] = useState(null)

  async function markRead(id) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    await apiFetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  useEffect(() => {
    if (!profile) {
      setNotifications([])
      return
    }

    let cancelled = false

    apiFetch('/api/notifications').then((body) => {
      if (!cancelled) setNotifications(body.notifications)
    })

    const channel = echo.private(`user.${profile.id}`)
    // Defends against a double-bound listener if this effect ever fires
    // twice for the same channel (React StrictMode's mount/cleanup/mount in
    // dev, or a stale leave()/resubscribe race) -- without this, one real
    // event fires the handler twice.
    channel.stopListening('.notification.created')
    channel.listen('.notification.created', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setLastEvent(notification)
      toast(notification.message, {
        action: {
          label: 'View',
          onClick: () => {
            markRead(notification.id)
            navigate(`/${notification.inquiry_id}`)
          },
        },
        onDismiss: () => markRead(notification.id),
      })
    })

    return () => {
      cancelled = true
      echo.leave(`user.${profile.id}`)
    }
  }, [profile?.id])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, lastEvent, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (ctx === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return ctx
}
