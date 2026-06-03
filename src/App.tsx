import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

const basename = import.meta.env.VITE_BASE_URL || '/'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { GuestRoute } from './components/layout/GuestRoute'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/Login'
import { SecretaryDashboard } from './pages/secretary/Dashboard'
import { NewOrder } from './pages/secretary/NewOrder'
import { Orders } from './pages/secretary/Orders'
import { Reports } from './pages/secretary/Reports'
import { DistributorDashboard } from './pages/distributor/Dashboard'

function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

          <Route
            path="/sekreter"
            element={
              <ProtectedRoute role="secretary">
                <ErrorBoundary>
                  <AppLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<ErrorBoundary><SecretaryDashboard /></ErrorBoundary>} />
            <Route path="yeni-siparis" element={<ErrorBoundary><NewOrder /></ErrorBoundary>} />
            <Route path="siparisler" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
            <Route path="raporlar" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
          </Route>

          <Route
            path="/dagiticim"
            element={
              <ProtectedRoute role="distributor">
                <ErrorBoundary>
                  <AppLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<ErrorBoundary><DistributorDashboard /></ErrorBoundary>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
