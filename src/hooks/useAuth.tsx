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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const model = pb.authStore.model as User | null
    setUser(model)

    const unsub = pb.authStore.onChange((_token, model) => {
      setUser(model as User | null)
    })

    // Hızlı bir şekilde auth durumunu kontrol et
    const init = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          pb.authStore.clear()
        }
      }
      setLoading(false)
    }
    init()

    return () => unsub()
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      const u = authData.record as unknown as User
      if (!u.role) {
        pb.authStore.clear()
        return 'Bu kullanıcıya yetki (rol) atanmamış. Lütfen admin panelden rol ekleyin.'
      }
      setUser(u)
      return null
    } catch (err: any) {
      if (err?.status === 400) return 'Hatalı e-posta veya şifre.'
      if (!navigator.onLine) return 'İnternet bağlantınız yok.'
      return 'Sunucuya bağlanılamadı. PocketBase sunucusunun çalıştığından emin olun.'
    }
  }

  const signOut = async () => {
    pb.authStore.clear()
    setUser(null)
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

  const authorized = !loading && !!user && (!role || user.role === role)

  return { authorized, loading, user }
}
