import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession } from '@/lib/SessionContext'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import { Toaster } from '@/components/ui/sonner'
import AuthGate from '@/components/layout/AuthGate'
import InquiriesPage from '@/components/InquiriesPage'
import AdminPanel from '@/components/admin/AdminPanel'
import AccountPage from '@/components/AccountPage'
import ResetPasswordPage from '@/components/ResetPasswordPage'
import NotFoundPage from '@/components/NotFoundPage'

function AdminRoute() {
  const { profile } = useSession()

  if (profile.user_type !== 'superuser') {
    return <Navigate to="/" replace />
  }

  return <AdminPanel />
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" closeButton />
      <SessionProvider>
        <NotificationsProvider>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Pathless layout route: AuthGate has no URL segment of its own, it
                just wraps every authenticated page in one persistent instance
                (header, session gate) via <Outlet/>, instead of being repeated
                per-route and remounting on every navigation between them. */}
            <Route element={<AuthGate />}>
              <Route index element={<InquiriesPage />} />
              <Route path="new" element={<InquiriesPage />} />
              <Route path=":id" element={<InquiriesPage />} />
              <Route path="admin" element={<AdminRoute />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </NotificationsProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
