export type UserRole = 'secretary' | 'distributor'

export type OrderStatus = 'pending' | 'accepted' | 'on_the_way' | 'delivered' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  is_active: boolean
  created_at: string
}

export interface Brand {
  id: number
  name: string
  is_active: boolean
}

export interface Order {
  id: string
  customer_name: string
  customer_address: string
  customer_phone: string | null
  brand_id: number | null
  quantity: number
  note: string | null
  status: OrderStatus
  created_by: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  delivered_at: string | null
  brands?: Brand | null
  assignee?: Profile | null
  creator?: Profile | null
}

export interface OrderStatusLog {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: string | null
  created_at: string
}

export interface DashboardStats {
  today_total: number
  today_delivered: number
  today_pending: number
  active_distributors: number
  weekly_data: { date: string; count: number }[]
  brand_distribution: { name: string; count: number }[]
}
