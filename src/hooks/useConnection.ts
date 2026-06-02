import { useState, useEffect, useCallback } from 'react'

export function useConnection() {
  const [online, setOnline] = useState(navigator.onLine)
  const [serverConnected, setServerConnected] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3000)
    }
    const goOffline = () => {
      setOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    setOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const setApiStatus = useCallback((connected: boolean) => {
    setServerConnected(connected)
    if (!connected) setShowBanner(true)
  }, [])

  return { online, serverConnected, showBanner, setShowBanner, setApiStatus }
}
