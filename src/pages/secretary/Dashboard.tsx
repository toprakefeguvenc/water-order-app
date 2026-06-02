import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pb } from '../../lib/pocketbase'
import { useAuth } from '../../hooks/useAuth'
import { format, parseISO, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Order } from '../../types'

interface Stats {
  todayTotal: number
  todayDelivered: number
  todayPending: number
  totalOrders: number
  pendingOrders: Order[]
}

export function SecretaryDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    todayTotal: 0, todayDelivered: 0, todayPending: 0, totalOrders: 0, pendingOrders: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const today = startOfDay(new Date()).toISOString()

      const allOrders = await pb.collection('orders').getList(1, 200, {
        sort: '-created',
        expand: 'brand,assignee,creator',
      })
      const orders = allOrders.items as unknown as Order[]

      const todayOrders = orders.filter((o) => o.created >= today)

      setStats({
        todayTotal: todayOrders.length,
        todayDelivered: todayOrders.filter((o) => o.status === 'delivered').length,
        todayPending: orders.filter((o) => o.status === 'pending').length,
        totalOrders: allOrders.totalItems,
        pendingOrders: orders
          .filter((o) => o.status === 'pending')
          .slice(0, 5),
      })
    } catch {
      // silent fail
    }
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
        <h1 className="page-title">Hoş geldiniz, {user?.full_name}</h1>
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
                to="/sekreter/siparisler"
                className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{order.customer_name}</span>
                  <span className={`status-badge status-${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {order.expand?.brand && <span>{order.expand.brand.name}</span>}
                  {order.expand?.assignee && <span>→ {order.expand.assignee.full_name}</span>}
                  <span>{format(parseISO(order.created), 'HH:mm')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
