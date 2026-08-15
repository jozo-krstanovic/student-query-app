import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SessionProvider } from '@/lib/SessionContext'
import AuthGate from '@/components/layout/AuthGate'
import Dashboard from '@/components/Dashboard'
import AccountPage from '@/components/AccountPage'
import ResetPasswordPage from '@/components/ResetPasswordPage'
import NotFoundPage from '@/components/NotFoundPage'

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
                <Dashboard />
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
