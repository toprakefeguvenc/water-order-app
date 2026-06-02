import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090'
export const pb = new PocketBase(pbUrl)

// Auto-refresh auth on page load
pb.authStore.isValid && pb.collection('users').authRefresh()
