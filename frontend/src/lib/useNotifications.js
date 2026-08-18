import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSession } from './SessionContext'
import { apiFetch } from './api'
import { echo } from './echo'

export function useNotifications() {
  const { profile } = useSession()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!profile) return

    let cancelled = false

    apiFetch('/api/notifications').then((body) => {
      if (!cancelled) setNotifications(body.notifications)
    })

    const channel = echo.private(`user.${profile.id}`)
    channel.listen('.notification.created', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      toast(notification.message, {
        action: {
          label: 'View',
          onClick: () => navigate(`/${notification.inquiry_id}`),
        },
      })
    })

    return () => {
      cancelled = true
      echo.leave(`user.${profile.id}`)
    }
  }, [profile?.id])

  async function markRead(id) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    await apiFetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, unreadCount, markRead, markAllRead }
}
