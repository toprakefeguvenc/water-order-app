import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '../../hooks/useOrders'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { OrderStatus } from '../../types'

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor',
  accepted: 'Teslim Alındı',
  on_the_way: 'Yolda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
}

const statusFilter: (OrderStatus | 'all')[] = ['all', 'pending', 'accepted', 'on_the_way', 'delivered', 'cancelled']

export function Orders() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const statusParam = filter === 'all' ? undefined : filter
  const { orders, loading } = useOrders(statusParam)
  const [search, setSearch] = useState('')

  const filtered = search
    ? orders.filter((o) =>
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_address.toLowerCase().includes(search.toLowerCase()) ||
        o.expand?.assignee?.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Tüm Siparişler</h1>
        <Link to="/sekreter/yeni-siparis" className="btn-primary text-sm">+ Yeni</Link>
      </div>

      <input className="input-field" placeholder="Müşteri adı, adres veya dağıtımcı ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {statusFilter.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'Tümü' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {search ? 'Aramanızla eşleşen sipariş bulunamadı' : 'Henüz sipariş yok'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="card hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{order.customer_name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{order.customer_address}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {order.customer_phone && (
                    <a href={`tel:${order.customer_phone}`} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Ara">📞</a>
                  )}
                  <span className={`status-badge status-${order.status}`}>{statusLabels[order.status] || order.status}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                {order.expand?.brand && <span>💧 {order.expand.brand.name}</span>}
                <span>×{order.quantity}</span>
                {order.expand?.assignee && <span>🚚 {order.expand.assignee.full_name}</span>}
                <span>🕐 {format(parseISO(order.created), 'd MMM HH:mm', { locale: tr })}</span>
              </div>

              {order.note && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">📝 {order.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
