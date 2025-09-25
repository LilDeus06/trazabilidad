"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Database, Shield } from "lucide-react"

export function ConfiguracionForm() {
  const [config, setConfig] = useState({
    nombreEmpresa: "LogiSystem",
    emailNotificaciones: "admin@logisystem.com",
    registroPublico: false,
    rolPorDefecto: "usuario",
    backupAutomatico: true,
    mantenimiento: false,
    mensajeMantenimiento: "Sistema en mantenimiento. Vuelve pronto.",
  })

  const handleSave = async () => {
    // Aquí implementarías la lógica para guardar la configuración
    console.log("Guardando configuración:", config)
  }

  return (
    <div className="space-y-6">
      {/* Configuración General */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración General
          </CardTitle>
          <CardDescription>Configuración básica del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
            <Input
              id="nombreEmpresa"
              value={config.nombreEmpresa}
              onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emailNotificaciones">Email para Notificaciones</Label>
            <Input
              id="emailNotificaciones"
              type="email"
              value={config.emailNotificaciones}
              onChange={(e) => setConfig({ ...config, emailNotificaciones: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Usuarios */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuración de Usuarios
          </CardTitle>
          <CardDescription>Configuración de registro y roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registro Público</Label>
              <p className="text-sm text-muted-foreground">Permitir que cualquiera se registre en el sistema</p>
            </div>
            <Switch
              checked={config.registroPublico}
              onCheckedChange={(checked) => setConfig({ ...config, registroPublico: checked })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rolPorDefecto">Rol por Defecto</Label>
            <Select
              value={config.rolPorDefecto}
              onValueChange={(value) => setConfig({ ...config, rolPorDefecto: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuario</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Configuración del Sistema */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuración del Sistema
          </CardTitle>
          <CardDescription>Configuración de mantenimiento y respaldos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-muted-foreground">Realizar respaldos automáticos de la base de datos</p>
            </div>
            <Switch
              checked={config.backupAutomatico}
              onCheckedChange={(checked) => setConfig({ ...config, backupAutomatico: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Mantenimiento</Label>
              <p className="text-sm text-muted-foreground">Activar modo mantenimiento para todos los usuarios</p>
            </div>
            <Switch
              checked={config.mantenimiento}
              onCheckedChange={(checked) => setConfig({ ...config, mantenimiento: checked })}
            />
          </div>
          {config.mantenimiento && (
            <div className="grid gap-2">
              <Label htmlFor="mensajeMantenimiento">Mensaje de Mantenimiento</Label>
              <Textarea
                id="mensajeMantenimiento"
                value={config.mensajeMantenimiento}
                onChange={(e) => setConfig({ ...config, mensajeMantenimiento: e.target.value })}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
