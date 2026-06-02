import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { startOfDay, format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Stats {
  todayTotal: number
  todayDelivered: number
  todayPending: number
  totalOrders: number
  pendingOrders: OrderPreview[]
}

interface OrderPreview {
  id: string
  customer_name: string
  status: string
  created_at: string
  brands?: { name: string } | null
  assignee?: { full_name: string } | null
}

export function SecretaryDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    todayTotal: 0, todayDelivered: 0, todayPending: 0, totalOrders: 0, pendingOrders: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const today = startOfDay(new Date()).toISOString()

    const { count: todayTotal } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: todayDelivered } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
      .eq('status', 'delivered')

    const { count: todayPending } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('*, brands:brand_id(name), assignee:assigned_to(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    setStats({
      todayTotal: todayTotal || 0,
      todayDelivered: todayDelivered || 0,
      todayPending: todayPending || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: (pendingOrders as OrderPreview[]) || [],
    })
    setLoading(false)
  }

  const statCards = [
    { label: "Bugün Toplam", value: stats.todayTotal, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: "Bugün Teslim", value: stats.todayDelivered, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: "Bekleyen", value: stats.todayPending, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "Toplam Sipariş", value: stats.totalOrders, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor', accepted: 'Teslim Alındı', on_the_way: 'Yolda', delivered: 'Teslim Edildi', cancelled: 'İptal',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Hoş geldiniz, {profile?.full_name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bugünün sipariş özeti</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-600 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Bekleyen Siparişler</h2>
          <Link to="/sekreter/siparisler" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Tümünü Gör
          </Link>
        </div>
        {stats.pendingOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Bekleyen sipariş yok</p>
        ) : (
          <div className="space-y-2">
            {stats.pendingOrders.map((order) => (
              <Link
                key={order.id}
                to={`/sekreter/siparisler`}
                className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{order.customer_name}</span>
                  <span className={`status-badge status-${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {order.brands && <span>{order.brands.name}</span>}
                  {order.assignee && <span>→ {order.assignee.full_name}</span>}
                  <span>{format(parseISO(order.created_at), 'HH:mm')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
