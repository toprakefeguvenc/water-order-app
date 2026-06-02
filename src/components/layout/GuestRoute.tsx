import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (user) {
    // Rol tanımlı değilse login sayfasında kal, yönlendirme yapma
    if (!user.role) {
      return <>{children}</>
    }
    return <Navigate to={user.role === 'secretary' ? '/sekreter' : '/dagiticim'} replace />
  }

  return <>{children}</>
}
