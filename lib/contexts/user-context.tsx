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
  _updated?: number
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
          return { data, isExpired: false }
        } else {
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

  const fetchProfileFromDatabase = async (user: User): Promise<UserProfile | null> => {
    const userId = user.id
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, avatar_url, rol')
        .eq('id', userId)
        .single()

      if (error) {
        // Try to create profile if it doesn't exist
        if (error.code === 'PGRST116') { // Row not found

          // Try to get name from user metadata
          const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
          const [nombre, ...apellidoParts] = fullName.split(' ')
          const apellido = apellidoParts.join(' ')

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              nombre: nombre || '',
              apellido: apellido || '',
              rol: 'usuario'
            })
            .select('id, nombre, apellido, avatar_url, rol')
            .single()

          if (insertError) {
            return null
          }

          const profileData = {
            ...newProfile,
            email: user?.email || ''
          }

          return profileData
        } else {
          return null
        }
      }

      const profileData = {
        ...data,
        email: user?.email || ''
      }

      return profileData
    } catch (error) {
      return null
    }
  }

  const loadProfile = async (user: User, forceRefresh: boolean = false): Promise<UserProfile | null> => {
    const userId = user.id
    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = loadUserFromCache()
      if (cached.data && cached.data.id === userId) {
        setProfile(cached.data)
        // If expired, load in background to update
        if (cached.isExpired) {
          // Load in background without setting profile again
          fetchProfileFromDatabase(user).then(newProfile => {
            if (newProfile) {
              saveUserToCache(newProfile)
              setProfile({ ...newProfile, _updated: Date.now() })
            }
          }).catch(error => {
            // Error updating profile in background
          })
        }
        return cached.data
      }
    }

    // Fetch from database
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, avatar_url, rol')
        .eq('id', userId)
        .single()

      if (error) {
        // Try to create profile if it doesn't exist
        if (error.code === 'PGRST116') { // Row not found

          // Try to get name from user metadata
          const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
          const [nombre, ...apellidoParts] = fullName.split(' ')
          const apellido = apellidoParts.join(' ')

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              nombre: nombre || '',
              apellido: apellido || '',
              rol: 'usuario'
            })
            .select('id, nombre, apellido, avatar_url, rol')
            .single()

          if (insertError) {
            // If we have cached data and not expired, use it as fallback
            const cached = loadUserFromCache()
            if (cached.data && cached.data.id === userId && !cached.isExpired) {
              setProfile(cached.data)
              return cached.data
            }
            // No valid cache available, clear and return null
            localStorage.removeItem(CACHE_KEY)
            return null
          }

          const profileData = {
            ...newProfile,
            email: user?.email || ''
          }

          // Cache the new profile
          saveUserToCache(profileData)
          setProfile({ ...profileData, _updated: Date.now() })
          return profileData
        } else {
          // Other error, use cache if available
          const cached = loadUserFromCache()
          if (cached.data && cached.data.id === userId && !cached.isExpired) {
            setProfile(cached.data)
            return cached.data
          }
          // No valid cache available, clear and return null
          localStorage.removeItem(CACHE_KEY)
          return null
        }
      }

      const profileData = {
        ...data,
        email: user?.email || ''
      }

      // Cache the profile
      saveUserToCache(profileData)
      setProfile({ ...profileData, _updated: Date.now() })
      return profileData
    } catch (error) {
      // If we have cached data and not expired, use it as fallback
      const cached = loadUserFromCache()
      if (cached.data && cached.data.id === userId && !cached.isExpired) {
        setProfile(cached.data)
        return cached.data
      }
      // No valid cache available
      localStorage.removeItem(CACHE_KEY)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      setIsLoading(true)
      await loadProfile(user, true) // Force refresh from database
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (error) {
          setIsLoading(false)
          return
        }

        setUser(authUser)
        setIsLoading(false) // Set loading false after user is set

        if (authUser) {
          // Load profile in background
          loadProfile(authUser).catch(error => {
            // Error loading profile in background
          })
        }
      } catch (error) {
        setIsLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        setIsLoading(false) // Set loading false immediately

        if (session?.user) {
          // Load profile in background
          loadProfile(session.user).catch(error => {
            // Error loading profile in background
          })
        } else {
          setProfile(null)
          localStorage.removeItem(CACHE_KEY)
        }
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
