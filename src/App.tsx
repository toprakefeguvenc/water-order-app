import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/Login'
import { SecretaryDashboard } from './pages/secretary/Dashboard'
import { NewOrder } from './pages/secretary/NewOrder'
import { Orders } from './pages/secretary/Orders'
import { Reports } from './pages/secretary/Reports'
import { DistributorDashboard } from './pages/distributor/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/sekreter"
            element={
              <ProtectedRoute role="secretary">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SecretaryDashboard />} />
            <Route path="yeni-siparis" element={<NewOrder />} />
            <Route path="siparisler" element={<Orders />} />
            <Route path="raporlar" element={<Reports />} />
          </Route>

          <Route
            path="/dagiticim"
            element={
              <ProtectedRoute role="distributor">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DistributorDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
