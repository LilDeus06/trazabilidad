"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Truck, Users, FileText, Wheat, Package, PackageCheck, Menu, X, LogOut, Home, Shield, User, MapPin, Grid3X3, Grape } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/contexts/user-context"
import { useUserPermissions } from "@/hooks/use-user-permissions"

interface SidebarProps {
  userRole?: string
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    module: "dashboard",
    roles: ["admin", "usuario", "operador"],
  },
  {
    title: "Administración",
    href: "/dashboard/admin",
    icon: Shield,
    module: "admin",
    roles: ["admin"],
  },
  {
    title: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    module: "usuarios",
    roles: ["admin"],
  },
  {
    title: "Fundos",
    href: "/dashboard/fundos",
    icon: MapPin,
    module: "fundos",
    roles: ["admin", "operador"],
  },
  {
    title: "Lotes",
    href: "/dashboard/lotes",
    icon: Grid3X3,
    module: "lotes",
    roles: ["admin", "operador"],
  },
  {
    title: "Camiones",
    href: "/dashboard/camiones",
    icon: Truck,
    module: "camiones",
    roles: ["admin", "operador"],
  },
  {
    title: "Guías",
    href: "/dashboard/guias",
    icon: FileText,
    module: "guias",
    roles: ["admin", "usuario", "operador"],
  },
  {
    title: "Campo",
    href: "/dashboard/campo",
    icon: Wheat,
    module: "campo",
    roles: ["admin", "operador"],
  },
  {
    title: "Acopio",
    href: "/dashboard/acopio",
    icon: Package,
    module: "acopio",
    roles: ["admin", "operador"],
  },
  {
    title: "Packing",
    href: "/dashboard/packing",
    icon: PackageCheck,
    module: "packing",
    roles: ["admin", "operador"],
  },
]

function getFilteredMenuItems(permissions: any[]) {
  return menuItems.filter(item => {
    // Check if user has read permission for this module
    const hasAccess = permissions.some(p => p.module_name === item.module && p.can_read)
    return hasAccess
  })
}

export function Sidebar({ userRole = "usuario" }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const { profile: userProfile } = useUser()
  const { permissions, canAccessModule, loading: permissionsLoading } = useUserPermissions()

  const handleLogout = async () => {
    console.log("[v0] Cerrando sesión")
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // If permissions are still loading, show default menu items based on role
  const filteredMenuItems = permissionsLoading
    ? menuItems.filter(item => item.roles.includes(userRole))
    : getFilteredMenuItems(permissions)

  const getUserDisplayName = () => {
    if (userProfile?.nombre && userProfile?.apellido) return `${userProfile.nombre} ${userProfile.apellido}`
    if (userProfile?.apellido) return userProfile.apellido
    if (userProfile?.email) return userProfile.email
    return "Usuario"
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "operador":
        return "Operador"
      default:
        return "Usuario"
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar text-sidebar-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-sidebar-border">
            <Grape className="h-8 w-8 text-sidebar-primary" />
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">UvaTracer</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestión Información</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            {/* Perfil del usuario */}
            <Link
              href="/dashboard/perfil"
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg mb-3 transition-colors",
                pathname === "/dashboard/perfil"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userProfile?.avatar_url || undefined}
                  alt={getUserDisplayName()}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-sidebar-foreground/60">{getRoleLabel(userRole)}</p>
              </div>
              <User className="h-4 w-4 text-sidebar-foreground/60" />
            </Link>

            {/* Botón de cerrar sesión */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
