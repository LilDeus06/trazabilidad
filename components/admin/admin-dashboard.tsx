"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, Truck, FileText, Activity, Plus, Settings, Shield } from "lucide-react"
import Link from "next/link"
import { UserCreateModal } from "./user-create-modal"

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalCamiones: number
    totalGuias: number
  }
  recentUsers: any[]
  systemActivity: any[]
}

export function AdminDashboard({ stats, recentUsers, systemActivity }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">Gestiona usuarios, roles y configuración del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/configuracion">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </Button>
          <UserCreateModal />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} activos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Camiones</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCamiones}</div>
            <p className="text-xs text-muted-foreground">Flota registrada</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guías Emitidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuias}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios Recientes
            </CardTitle>
            <CardDescription>Últimos usuarios registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={user.rol === "admin" ? "destructive" : user.rol === "operador" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.rol}
                    </Badge>
                    <Badge
                      variant={user.activo ? "default" : "secondary"}
                      className={user.activo ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                    >
                      {user.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay usuarios recientes</p>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dashboard/usuarios">Ver Todos los Usuarios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad del Sistema
            </CardTitle>
            <CardDescription>Últimas guías y movimientos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Guía #{activity.numero_guia}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.camiones?.placa} - {activity.camiones?.chofer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.cantidad_enviada} jabas</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              ))}
              {systemActivity.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay actividad reciente</p>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dashboard/guias">Ver Todas las Guías</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a funciones administrativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/dashboard/usuarios">
                <Users className="h-6 w-6 mb-2" />
                Gestionar Usuarios
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/dashboard/camiones">
                <Truck className="h-6 w-6 mb-2" />
                Gestionar Camiones
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/dashboard/admin/reportes">
                <FileText className="h-6 w-6 mb-2" />
                Ver Reportes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
