import { useEffect, useState, useCallback } from 'react'
import { pb } from '../lib/pocketbase'
import type { Order, OrderStatus } from '../types'

function friendlyError(err: any): string {
  if (!navigator.onLine) return 'İnternet bağlantınız yok.'
  if (err?.status === 0 || err?.message?.includes('Failed to fetch'))
    return 'Sunucuya bağlanılamadı. PocketBase sunucusunu kontrol edin.'
  if (err?.message?.includes('timeout'))
    return 'Bağlantı zaman aşımına uğradı.'
  return err?.message || 'Beklenmeyen bir hata.'
}

const ORDERS_EXPAND = 'brand,assignee,creator'

export function useOrders(statusFilter?: OrderStatus, assignedTo?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filterParts: string[] = []
      if (statusFilter) filterParts.push(`status = '${statusFilter}'`)
      if (assignedTo) filterParts.push(`assigned_to = '${assignedTo}'`)
      const filter = filterParts.join(' && ')

      const list = await pb.collection('orders').getList(1, 200, {
        sort: '-created',
        filter: filter || undefined,
        expand: ORDERS_EXPAND,
      })
      setOrders(list.items as unknown as Order[])
    } catch (err: any) {
      setError(friendlyError(err))
    }
    setLoading(false)
  }, [statusFilter, assignedTo])

  useEffect(() => {
    fetchOrders()

    const unsub = pb.collection('orders').subscribe('*', () => {
      fetchOrders()
    })

    return () => { unsub.then(fn => fn()) }
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}

export async function createOrder(data: {
  customer_name: string
  customer_address: string
  customer_phone?: string
  brand?: string
  quantity: number
  note?: string
  assigned_to: string
  created_by: string
}) {
  if (!navigator.onLine) return { error: 'İnternet bağlantınız yok.' }
  try {
    await pb.collection('orders').create({
      ...data,
      customer_phone: data.customer_phone || '',
      note: data.note || '',
      brand: data.brand || '',
      status: 'pending',
      quantity: Math.max(1, data.quantity),
    })
    return { error: null }
  } catch (err: any) {
    return { error: friendlyError(err) }
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId: string
) {
  if (!navigator.onLine) return { error: 'İnternet bağlantınız yok.' }

  try {
    await pb.collection('order_status_logs').create({
      order: orderId,
      to_status: status,
      changed_by: userId,
    })

    const updates: Record<string, any> = { status, updated: new Date().toISOString() }
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()

    await pb.collection('orders').update(orderId, updates)
    return { error: null }
  } catch (err: any) {
    return { error: friendlyError(err) }
  }
}

export function useDistributorOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!navigator.onLine) {
      setError('İnternet bağlantınız yok.')
      setLoading(false)
      return
    }

    const user = pb.authStore.model as { id: string } | null
    if (!user) { setLoading(false); return }

    setLoading(true)
    setError(null)
    try {
      const list = await pb.collection('orders').getList(1, 50, {
        sort: '-created',
        filter: `assigned_to = '${user.id}' && status != 'cancelled'`,
        expand: ORDERS_EXPAND,
      })
      setOrders(list.items as unknown as Order[])
    } catch (err: any) {
      setError(friendlyError(err))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()

    const unsub = pb.collection('orders').subscribe('*', (e) => {
      const record = e.record as unknown as Order
      const currentUserId = (pb.authStore.model as { id: string } | null)?.id
      if (currentUserId && record.assigned_to === currentUserId) {
        if (e.action === 'create') playNotificationSound()
        fetch()
      }
    })

    return () => { unsub.then(fn => fn()) }
  }, [fetch])

  return { orders, loading, error, refetch: fetch }
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* audio not supported */ }
}
