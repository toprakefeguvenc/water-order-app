import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { format, startOfWeek, startOfMonth, parseISO, eachDayOfInterval, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface DailyStats {
  date: string
  total: number
  delivered: number
}

interface BrandStats {
  name: string
  count: number
}

interface DistributorStats {
  name: string
  total: number
  delivered: number
}

export function Reports() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dailyData, setDailyData] = useState<DailyStats[]>([])
  const [brandData, setBrandData] = useState<BrandStats[]>([])
  const [distributorData, setDistributorData] = useState<DistributorStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [period])

  const loadReports = async () => {
    setLoading(true)

    let startDate: Date
    const now = new Date()

    if (period === 'daily') startDate = subDays(now, 7)
    else if (period === 'weekly') startDate = subDays(now, 28)
    else startDate = subDays(now, 90)

    const startStr = startDate.toISOString()

    const { data: orders } = await supabase
      .from('orders')
      .select('*, brands:brand_id(name), assignee:assigned_to(full_name)')
      .gte('created_at', startStr)
      .order('created_at', { ascending: true })

    if (!orders) { setLoading(false); return }

    const days = eachDayOfInterval({ start: startDate, end: now })
    const dailyMap = new Map<string, { total: number; delivered: number }>()

    days.forEach((d) => {
      dailyMap.set(format(d, 'yyyy-MM-dd'), { total: 0, delivered: 0 })
    })

    const brandMap = new Map<string, number>()
    const distMap = new Map<string, { total: number; delivered: number }>()

    for (const o of orders) {
      const dayKey = format(parseISO(o.created_at), 'yyyy-MM-dd')
      if (dailyMap.has(dayKey)) {
        const entry = dailyMap.get(dayKey)!
        entry.total++
        if (o.status === 'delivered') entry.delivered++
      }

      const brandName = o.brands?.name || 'Belirtilmemiş'
      brandMap.set(brandName, (brandMap.get(brandName) || 0) + 1)

      const distName = o.assignee?.full_name || 'Belirtilmemiş'
      const dist = distMap.get(distName) || { total: 0, delivered: 0 }
      dist.total++
      if (o.status === 'delivered') dist.delivered++
      distMap.set(distName, dist)
    }

    setDailyData(
      Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date: format(parseISO(date), 'd MMM', { locale: tr }),
        total: stats.total,
        delivered: stats.delivered,
      }))
    )

    setBrandData(
      Array.from(brandMap.entries()).map(([name, count]) => ({ name, count }))
    )

    setDistributorData(
      Array.from(distMap.entries()).map(([name, stats]) => ({
        name,
        total: stats.total,
        delivered: stats.delivered,
      }))
    )

    setLoading(false)
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Raporlar yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Raporlar</h1>
        <button onClick={handlePrint} className="btn-secondary text-sm">
          📄 PDF Çıktı
        </button>
      </div>

      <div className="flex gap-1.5">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              period === p
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : 'Aylık'}
          </button>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-sm text-gray-900 mb-3">Sipariş Grafiği</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="total" name="Toplam" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivered" name="Teslim" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Marka Dağılımı</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}
                >
                  {brandData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Dağıtımcı Performans</h2>
          <div className="space-y-3">
            {distributorData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{d.name}</span>
                <div className="text-right">
                  <span className="text-sm text-gray-900">{d.delivered}/{d.total}</span>
                  <span className="text-xs text-gray-400 ml-1">
                    (%{d.total > 0 ? ((d.delivered / d.total) * 100).toFixed(0) : 0})
                  </span>
                </div>
              </div>
            ))}
            {distributorData.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Veri bulunamadı</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-sm text-gray-900 mb-3">Dağıtımcı Sıralaması</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-600">#</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">Dağıtımcı</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Toplam</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Teslim</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Başarı</th>
              </tr>
            </thead>
            <tbody>
              {[...distributorData]
                .sort((a, b) => b.delivered - a.delivered)
                .map((d, i) => (
                  <tr key={d.name} className="border-b border-gray-50">
                    <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 px-2 font-medium">{d.name}</td>
                    <td className="py-2 px-2 text-right">{d.total}</td>
                    <td className="py-2 px-2 text-right text-emerald-600">{d.delivered}</td>
                    <td className="py-2 px-2 text-right">
                      {d.total > 0 ? ((d.delivered / d.total) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
