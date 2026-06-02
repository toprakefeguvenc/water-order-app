import { useRequireAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface Props {
  children: React.ReactNode
  role?: UserRole
}

export function ProtectedRoute({ children, role }: Props) {
  const { authorized, loading } = useRequireAuth(role)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!authorized) {
    window.location.href = '/login'
    return null
  }

  return <>{children}</>
}
