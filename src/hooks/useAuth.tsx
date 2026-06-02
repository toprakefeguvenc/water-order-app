import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { pb } from '../lib/pocketbase'
import type { User, UserRole } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(pb.authStore.model as User | null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
    const unsub = pb.authStore.onChange((_token, model) => {
      const u = model as User | null
      setUser(u && u.is_active ? u : null)
    })
    return unsub
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      const u = authData.record as unknown as User
      if (!u.is_active) {
        pb.authStore.clear()
        return 'Bu hesap devre dışı bırakılmış.'
      }
      return null
    } catch (err: any) {
      if (err?.status === 400) return 'Hatalı e-posta veya şifre.'
      if (!navigator.onLine) return 'İnternet bağlantınız yok.'
      return 'Sunucuya bağlanılamadı. PocketBase sunucusunun çalıştığından emin olun.'
    }
  }

  const signOut = async () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function useRequireAuth(role?: UserRole) {
  const { user, loading } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user || !user.is_active) {
        setAuthorized(false)
        return
      }
      if (role && user.role !== role) {
        setAuthorized(false)
        return
      }
      setAuthorized(true)
    }
  }, [user, loading, role])

  return { authorized, loading, user }
}
