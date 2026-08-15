import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession } from '@/lib/SessionContext'
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
      <SessionProvider>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <AuthGate>
                <InquiriesPage />
              </AuthGate>
            }
          />
          <Route
            path="/new"
            element={
              <AuthGate>
                <InquiriesPage />
              </AuthGate>
            }
          />
          <Route
            path="/:id"
            element={
              <AuthGate>
                <InquiriesPage />
              </AuthGate>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthGate>
                <AdminRoute />
              </AuthGate>
            }
          />
          <Route
            path="/account"
            element={
              <AuthGate>
                <AccountPage />
              </AuthGate>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
