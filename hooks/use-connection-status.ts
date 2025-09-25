"use client"

import { useState, useEffect } from "react"

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
      if (!navigator.onLine) {
        setIsConnecting(false)
      }
    }

    const handleOnline = () => {
      setIsConnecting(true)
      setTimeout(() => {
        setIsOnline(true)
        setIsConnecting(false)
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsConnecting(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial status
    updateOnlineStatus()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isOnline, isConnecting }
}
