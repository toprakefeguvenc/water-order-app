import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { pb } from '../../lib/pocketbase'
import { useAuth } from '../../hooks/useAuth'
import { createOrder } from '../../hooks/useOrders'
import type { Brand, User } from '../../types'

export function NewOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [distributors, setDistributors] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    brand: '',
    quantity: '1',
    note: '',
    assigned_to: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const b = await pb.collection('brands').getList(1, 50, {
        filter: 'is_active = true',
      })
      setBrands(b.items as unknown as Brand[])

      const d = await pb.collection('users').getList(1, 50, {
        filter: "role = 'distributor' && is_active = true",
      })
      setDistributors(d.items as unknown as User[])
    } catch {
      setError('Veriler yüklenirken hata oluştu.')
    }
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.assigned_to) {
      setError('Lütfen bir dağıtımcı seçin')
      return
    }

    setLoading(true)
    setError(null)

    const { error: err } = await createOrder({
      customer_name: form.customer_name,
      customer_address: form.customer_address,
      customer_phone: form.customer_phone || undefined,
      brand: form.brand || undefined,
      quantity: Math.max(1, Number(form.quantity) || 1),
      note: form.note || undefined,
      assigned_to: form.assigned_to,
      created_by: user.id,
    })

    if (err) {
      setError(err)
    } else {
      setSuccess(true)
      setForm({
        customer_name: '', customer_address: '', customer_phone: '',
        brand: '', quantity: '1', note: '', assigned_to: '',
      })
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const handleCall = (phone: string) => {
    if (phone) window.location.href = `tel:${phone}`
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="page-title">Yeni Sipariş</h1>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
          Sipariş başarıyla oluşturuldu!
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı *</label>
          <input className="input-field" value={form.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} placeholder="Ad soyad" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
          <textarea className="input-field resize-none" rows={3} value={form.customer_address} onChange={(e) => handleChange('customer_address', e.target.value)} placeholder="Mahalle, sokak, no, daire, kat..." required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <div className="flex gap-2">
            <input className="input-field flex-1" type="tel" value={form.customer_phone} onChange={(e) => handleChange('customer_phone', e.target.value)} placeholder="05XX XXX XX XX" />
            {form.customer_phone && (
              <button type="button" onClick={() => handleCall(form.customer_phone)} className="btn-primary !px-3 text-lg" title="Ara">📞</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
            <select className="input-field" value={form.brand} onChange={(e) => handleChange('brand', e.target.value)}>
              <option value="">Seçiniz</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adet</label>
            <input className="input-field" type="number" min="1" value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dağıtımcı *</label>
          <select className="input-field" value={form.assigned_to} onChange={(e) => handleChange('assigned_to', e.target.value)} required>
            <option value="">Dağıtımcı seçin</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş Notu</label>
          <textarea className="input-field resize-none" rows={2} value={form.note} onChange={(e) => handleChange('note', e.target.value)} placeholder="Varsa ek bilgi..." />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Gönderiliyor...' : 'Siparişi Gönder'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
