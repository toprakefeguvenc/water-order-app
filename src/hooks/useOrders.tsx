import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const ORDERS_QUERY = `
  *,
  brands:brand_id (id, name),
  assignee:assigned_to (id, full_name, phone),
  creator:created_by (id, full_name)
`

export function useOrders(statusFilter?: OrderStatus, assignedTo?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select(ORDERS_QUERY)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
    } else {
      setOrders((data as Order[]) || [])
    }
    setLoading(false)
  }, [statusFilter, assignedTo])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}

export async function createOrder(data: {
  customer_name: string
  customer_address: string
  customer_phone?: string
  brand_id?: number
  quantity: number
  note?: string
  assigned_to: string
  created_by: string
}) {
  const { error } = await supabase.from('orders').insert({
    ...data,
    status: 'pending',
  })
  return { error: error?.message ?? null }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId: string
) {
  const updates: Partial<Order> = { status, updated_at: new Date().toISOString() }
  if (status === 'delivered') updates.delivered_at = new Date().toISOString()

  const { error } = await supabase
    .from('order_status_logs')
    .insert({ order_id: orderId, from_status: null, to_status: status, changed_by: userId })

  if (error) return { error: error.message }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)

  return { error: updateError?.message ?? null }
}

export function useDistributorOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('orders')
      .select(ORDERS_QUERY)
      .eq('assigned_to', user.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(50)

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
    } else {
      setOrders((data as Order[]) || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()

    let currentUser: string | null = null
    supabase.auth.getUser().then(({ data }) => {
      currentUser = data.user?.id ?? null
    })

    const channel = supabase
      .channel('distributor-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          const newOrder = payload.new as Order
          if (currentUser && newOrder.assigned_to === currentUser) {
            if (payload.eventType === 'INSERT') playNotificationSound()
            fetch()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
  } catch {
    // Audio not supported
  }
}
