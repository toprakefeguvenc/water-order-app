import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090'

export const pb = new PocketBase(pbUrl)

// Auto-cancellation'ı kapat (React StrictMode'da çift render sorununu önler)
pb.autoCancellation(false)
