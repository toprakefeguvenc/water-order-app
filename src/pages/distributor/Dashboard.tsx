import { useState } from 'react'
import { useDistributorOrders, updateOrderStatus } from '../../hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Order, OrderStatus } from '../../types'

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor',
  accepted: 'Teslim Alındı',
  on_the_way: 'Yolda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
}

const nextStatus: Record<string, OrderStatus> = {
  pending: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'delivered',
}

const statusColors: Record<string, string> = {
  pending: 'border-l-amber-400',
  accepted: 'border-l-blue-400',
  on_the_way: 'border-l-indigo-400',
  delivered: 'border-l-emerald-400',
}

export function DistributorDashboard() {
  const { user } = useAuth()
  const { orders, loading, refetch } = useDistributorOrders()
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter)

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    if (!user) return
    setUpdating(orderId)
    await updateOrderStatus(orderId, status, user.id)
    await refetch()
    setUpdating(null)
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleNavigate = (address: string) => {
    const encoded = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/${encoded}`, '_blank')
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="page-title">Siparişlerim</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {orders.filter((o) => o.status !== 'delivered').length} aktif sipariş
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(['all', 'pending', 'accepted', 'on_the_way', 'delivered'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === s
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'Tümü' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {filter === 'all' ? 'Henüz siparişiniz yok' : 'Bu durumda sipariş yok'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className={`card border-l-4 ${statusColors[order.status]} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{order.customer_name}</h3>
                    <span className={`status-badge status-${order.status}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{order.customer_address}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                {order.brands && <span>💧 {order.brands.name}</span>}
                <span>×{order.quantity}</span>
                <span>🕐 {format(parseISO(order.created_at), 'HH:mm')}</span>
              </div>

              {order.note && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">
                  📝 {order.note}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {order.customer_phone && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCall(order.customer_phone!) }}
                    className="flex-1 btn-primary text-sm !py-1.5 flex items-center justify-center gap-1"
                  >
                    📞 Ara
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleNavigate(order.customer_address) }}
                  className="flex-1 btn-secondary text-sm !py-1.5 flex items-center justify-center gap-1"
                >
                  🗺️ Yol Tarifi
                </button>
              </div>

              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = nextStatus[order.status]
                    if (next) handleStatusUpdate(order.id, next)
                  }}
                  disabled={updating === order.id}
                  className="w-full mt-2 bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {updating === order.id
                    ? 'Güncelleniyor...'
                    : order.status === 'pending'
                      ? '✅ Teslim Alındı'
                      : order.status === 'accepted'
                        ? '🚚 Yola Çıktı'
                        : '✅ Teslim Edildi'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-semibold">Sipariş Detayı</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Müşteri</label>
                <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Adres</label>
                <p className="text-sm text-gray-700">{selectedOrder.customer_address}</p>
              </div>

              {selectedOrder.customer_phone && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Telefon</label>
                  <p className="text-sm font-medium text-primary-600">{selectedOrder.customer_phone}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Marka</label>
                  <p className="text-sm font-medium">{selectedOrder.brands?.name || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Adet</label>
                  <p className="text-sm font-medium">×{selectedOrder.quantity}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Durum</label>
                <span className={`status-badge status-${selectedOrder.status} mt-1`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              {selectedOrder.note && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Not</label>
                  <p className="text-sm text-amber-700 bg-amber-50 rounded p-2">{selectedOrder.note}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {selectedOrder.customer_phone && (
                  <button
                    onClick={() => handleCall(selectedOrder.customer_phone!)}
                    className="btn-primary flex-1 flex items-center justify-center gap-1"
                  >
                    📞 Ara
                  </button>
                )}
                <button
                  onClick={() => handleNavigate(selectedOrder.customer_address)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1"
                >
                  🗺️ Yol Tarifi
                </button>
              </div>

              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    const next = nextStatus[selectedOrder.status]
                    if (next) {
                      handleStatusUpdate(selectedOrder.id, next)
                      setSelectedOrder(null)
                    }
                  }}
                  disabled={updating === selectedOrder.id}
                  className="btn-success w-full"
                >
                  {selectedOrder.status === 'pending'
                    ? '✅ Teslim Alındı'
                    : selectedOrder.status === 'accepted'
                      ? '🚚 Yola Çıktı'
                      : '✅ Teslim Edildi'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
