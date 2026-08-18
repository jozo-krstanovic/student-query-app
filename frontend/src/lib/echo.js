import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { supabase } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

window.Pusher = Pusher

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  // Custom authorizer instead of Echo's cookie-based default: this API is
  // stateless bearer-token auth (SupabaseGuard), so the private-channel auth
  // request needs the same Authorization header apiFetch attaches elsewhere.
  // Fetching the session token fresh on every call (rather than once at
  // startup) is also what makes this keep working across a Supabase token
  // refresh mid-connection, with no separate reconnect handling needed.
  authorizer: (channel) => ({
    authorize: async (socketId, callback) => {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token

        const response = await fetch(`${API_BASE_URL}/broadcasting/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })

        if (!response.ok) {
          callback(true, null)
          return
        }

        callback(false, await response.json())
      } catch (err) {
        callback(true, err)
      }
    },
  }),
})
