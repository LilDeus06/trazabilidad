"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/contexts/user-context'

interface ModulePermission {
  module_name: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
}

interface FundoPermission {
  fundo_id: string
  fundo_name?: string
}

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([])
  const [fundoPermissions, setFundoPermissions] = useState<FundoPermission[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useUser()
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('[v0] Permissions fetch timeout, using defaults')
        setPermissions(getDefaultPermissions(user.id))
        setFundoPermissions([])
        setLoading(false)
      }, 10000) // 10 second timeout

      try {
        console.log('[v0] Fetching user module permissions')
        const { data: moduleData, error: moduleError } = await supabase
          .from('user_module_permissions')
          .select('module_name, can_read, can_write, can_delete')
          .eq('user_id', user.id)

        if (moduleError || !moduleData || moduleData.length === 0) {
          if (moduleError) console.error('[v0] Error fetching module permissions:', moduleError)
          // Fallback to role-based permissions
          setPermissions(getDefaultPermissions(user.id))
        } else {
          setPermissions(moduleData)
        }

        // Fetch fundo permissions
        console.log('[v0] Fetching user fundo permissions')
        const { data: fundoData, error: fundoError } = await supabase
          .from('user_fundo_permissions')
          .select(`
            fundo_id,
            fundos!inner (
              nombre
            )
          `)
          .eq('user_id', user.id)

        if (fundoError) {
          console.error('[v0] Error fetching fundo permissions:', fundoError)
          setFundoPermissions([])
        } else {
          const formattedFundoPermissions = (fundoData || []).map(item => ({
            fundo_id: item.fundo_id,
            fundo_name: (item.fundos as any)?.nombre
          }))
          setFundoPermissions(formattedFundoPermissions)
        }

        clearTimeout(timeoutId)
      } catch (error) {
        console.error('[v0] Error in fetchPermissions:', error)
        setPermissions(getDefaultPermissions(user.id))
        setFundoPermissions([])
        clearTimeout(timeoutId)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user?.id, profile?.rol])

  const getDefaultPermissions = (userId: string): ModulePermission[] => {
    const role = profile?.rol || 'usuario'
    const basePermissions: ModulePermission[] = [
      { module_name: 'dashboard', can_read: true, can_write: false, can_delete: false },
    ]

    switch (role) {
      case 'admin':
        return [
          ...basePermissions,
          { module_name: 'admin', can_read: true, can_write: true, can_delete: true },
          { module_name: 'usuarios', can_read: true, can_write: true, can_delete: true },
          { module_name: 'fundos', can_read: true, can_write: true, can_delete: true },
          { module_name: 'lotes', can_read: true, can_write: true, can_delete: true },
          { module_name: 'camiones', can_read: true, can_write: true, can_delete: true },
          { module_name: 'guias', can_read: true, can_write: true, can_delete: true },
          { module_name: 'campo', can_read: true, can_write: true, can_delete: true },
          { module_name: 'acopio', can_read: true, can_write: true, can_delete: true },
          { module_name: 'packing', can_read: true, can_write: true, can_delete: true },
        ]
      case 'operador':
        return [
          ...basePermissions,
          { module_name: 'fundos', can_read: true, can_write: true, can_delete: false },
          { module_name: 'lotes', can_read: true, can_write: true, can_delete: false },
          { module_name: 'camiones', can_read: true, can_write: true, can_delete: false },
          { module_name: 'guias', can_read: true, can_write: true, can_delete: false },
          { module_name: 'campo', can_read: true, can_write: true, can_delete: false },
          { module_name: 'acopio', can_read: true, can_write: true, can_delete: false },
          { module_name: 'packing', can_read: true, can_write: true, can_delete: false },
        ]
      default: // usuario
        return [
          ...basePermissions,
          { module_name: 'guias', can_read: true, can_write: false, can_delete: false },
        ]
    }
  }

  const hasPermission = (moduleName: string, permission: 'read' | 'write' | 'delete' = 'read'): boolean => {
    const modulePerm = permissions.find(p => p.module_name === moduleName)
    if (!modulePerm) return false

    switch (permission) {
      case 'read':
        return modulePerm.can_read
      case 'write':
        return modulePerm.can_write
      case 'delete':
        return modulePerm.can_delete
      default:
        return false
    }
  }

  const canAccessModule = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'read')
  }

  const canAccessFundo = (fundoId: string): boolean => {
    // If user has no specific fundo permissions, they can access all fundos
    if (fundoPermissions.length === 0) return true
    return fundoPermissions.some(fp => fp.fundo_id === fundoId)
  }

  const getAccessibleFundos = (): FundoPermission[] => {
    return fundoPermissions
  }

  return {
    permissions,
    fundoPermissions,
    loading,
    hasPermission,
    canAccessModule,
    canAccessFundo,
    getAccessibleFundos
  }
}
