import { useConnection } from '../../hooks/useConnection'

export function ConnectionBanner() {
  const { online, serverConnected, showBanner, setShowBanner } = useConnection()

  if (!showBanner) return null

  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-between shadow-lg">
        <span>⚠️ İnternet bağlantısı yok. Uygulama çevrimdışı modda.</span>
        <button onClick={() => setShowBanner(false)} className="ml-2 text-white/80 hover:text-white">✕</button>
      </div>
    )
  }

  if (!serverConnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-between shadow-lg">
        <span>⚠️ Sunucuya bağlanılamıyor. Yeniden deneniyor...</span>
        <button onClick={() => setShowBanner(false)} className="ml-2 text-white/80 hover:text-white">✕</button>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-between shadow-lg animate-fadeIn">
      <span>✅ Bağlantı yeniden kuruldu</span>
      <button onClick={() => setShowBanner(false)} className="ml-2 text-white/80 hover:text-white">✕</button>
    </div>
  )
}
