"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  nombre?: string
  apellido?: string
  avatar_url?: string
  email?: string
  rol?: string
}

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const CACHE_KEY = 'user_profile_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()

  const loadUserFromCache = (): { data: UserProfile | null, isExpired: boolean } => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const isExpired = Date.now() - timestamp >= CACHE_DURATION
        if (!isExpired) {
          console.log('[v0] Loading user profile from cache')
          return { data, isExpired: false }
        } else {
          console.log('[v0] Cache expired, will fetch from database')
          return { data, isExpired: true }
        }
      }
    } catch (error) {
      console.warn('[v0] Error loading user profile from cache:', error)
      // Clear corrupted cache
      localStorage.removeItem(CACHE_KEY)
    }
    return { data: null, isExpired: false }
  }

  const saveUserToCache = (profileData: UserProfile) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: profileData,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('[v0] Error saving user profile to cache:', error)
    }
  }

  const loadProfile = async (userId: string, forceRefresh: boolean = false): Promise<UserProfile | null> => {
    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = loadUserFromCache()
      if (cached.data && cached.data.id === userId && !cached.isExpired) {
        setProfile(cached.data)
        return cached.data
      }
    }

    // Fetch from database
    try {
      console.log('[v0] Loading user profile from database', forceRefresh ? '(forced refresh)' : '')
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, avatar_url, rol')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[v0] Error loading profile:', error)
        // If we have cached data (even expired), use it as fallback
        const cached = loadUserFromCache()
        if (cached.data && cached.data.id === userId) {
          console.log('[v0] Using cached profile due to fetch error')
          setProfile(cached.data)
          return cached.data
        }
        // No cache available, clear and return null
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      const profileData = {
        ...data,
        email: user?.email || ''
      }

      // Cache the profile
      saveUserToCache(profileData)
      setProfile(profileData)
      return profileData
    } catch (error) {
      console.error('[v0] Error in loadProfile:', error)
      // If we have cached data (even expired), use it as fallback
      const cached = loadUserFromCache()
      if (cached.data && cached.data.id === userId) {
        console.log('[v0] Using cached profile due to fetch error')
        setProfile(cached.data)
        return cached.data
      }
      // No cache available
      localStorage.removeItem(CACHE_KEY)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      console.log('[v0] Forcing profile refresh from cache')
      setIsLoading(true)
      await loadProfile(user.id, true) // Force refresh from database
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('[v0] Error getting user:', error)
          setIsLoading(false)
          return
        }

        setUser(authUser)

        if (authUser) {
          await loadProfile(authUser.id)
        }
      } catch (error) {
        console.error('[v0] Error initializing user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[v0] Auth state changed:', event)
        setUser(session?.user || null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          localStorage.removeItem(CACHE_KEY)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: UserContextType = {
    user,
    profile,
    isLoading,
    refreshProfile
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
