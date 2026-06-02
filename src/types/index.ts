export type UserRole = 'secretary' | 'distributor'

export type OrderStatus = 'pending' | 'accepted' | 'on_the_way' | 'delivered' | 'cancelled'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string
  is_active: boolean
  created: string
  updated: string
}

export interface Brand {
  id: string
  name: string
  is_active: boolean
  created: string
  updated: string
}

export interface Order {
  id: string
  customer_name: string
  customer_address: string
  customer_phone: string
  brand: string
  quantity: number
  note: string
  status: OrderStatus
  created_by: string
  assigned_to: string
  created: string
  updated: string
  delivered_at: string
  expand?: {
    brand?: Brand
    assignee?: User
    creator?: User
  }
}

export interface OrderStatusLog {
  id: string
  order: string
  from_status: string
  to_status: string
  changed_by: string
  created: string
}

export interface DashboardStats {
  today_total: number
  today_delivered: number
  today_pending: number
  today_active_distributors: number
  weekly_data: { date: string; count: number }[]
  brand_distribution: { name: string; count: number }[]
}
