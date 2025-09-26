"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, FileText, Truck, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Camion {
  id: string
  chofer: string
  placa: string
  capacidad: number
  id_fundo: string
}

interface Lote {
  id: string
  id_fundo: string
  nombre: string
}

interface Guia {
  id?: string
  fecha_hora: string
  id_camion: string
  id_fundo?: string
  id_lote?: string
  enviadas: number
  guias: string
}

interface GuiaFormProps {
  camiones: Camion[]
  lotes: Lote[]
  guia?: Guia
}

export function GuiaForm({ camiones, lotes, guia }: GuiaFormProps) {
  // Función auxiliar para formatear una fecha a la cadena YYYY-MM-DDTHH:mm en la zona horaria local
  const getLocalISOString = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState({
    fecha_hora: guia?.fecha_hora ? getLocalISOString(new Date(guia.fecha_hora)) : getLocalISOString(new Date()),
    id_camion: guia?.id_camion || "",
    id_lote: guia?.id_lote || "",
    enviadas: guia?.enviadas || 0,
    guias: guia?.guias || "",
  })
  const [selectedCamion, setSelectedCamion] = useState<Camion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const filteredLotes = (lotes || []).filter((l) => !selectedCamion || l.id_fundo === selectedCamion.id_fundo)

  useEffect(() => {
    if (formData.id_camion) {
      const camion = camiones.find((c) => c.id === formData.id_camion)
      setSelectedCamion(camion || null)
    }
  }, [formData.id_camion, camiones])

  useEffect(() => {
    // Reset id_lote if it doesn't belong to the selected camión's fundo
    if (formData.id_lote && selectedCamion) {
      const isCompatible = filteredLotes.some((l) => l.id === formData.id_lote)
      if (!isCompatible) {
        setFormData((prev) => ({ ...prev, id_lote: "" }))
      }
    }
  }, [selectedCamion, formData.id_lote, filteredLotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      const guiaData = {
        fecha_hora: new Date(formData.fecha_hora).toISOString(),
        id_camion: formData.id_camion,
        id_fundo: selectedCamion?.id_fundo,
        id_lote: formData.id_lote || null,
        enviadas: formData.enviadas,
        guias: formData.guias,
        usuario_id: user.id,
      }

      if (guia?.id) {
        // Actualizar guía existente
        const { error } = await supabase.from("guias").update(guiaData).eq("id", guia.id)

        if (error) throw error
      } else {
        // Crear nueva guía
        const { error } = await supabase.from("guias").insert(guiaData)

        if (error) throw error
      }

      router.push("/dashboard/guias")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  const getCapacityPercentage = () => {
    if (!selectedCamion || !formData.enviadas) return 0
    return Math.min((formData.enviadas / selectedCamion.capacidad) * 100, 100)
  }

  const isOverCapacity = () => {
    if (!selectedCamion) return false
    return formData.enviadas > selectedCamion.capacidad
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/guias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Guías
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {guia ? "Editar Guía" : "Nueva Guía"}
              </CardTitle>
              <CardDescription>
                {guia
                  ? "Modifica la información de la guía"
                  : "Completa la información para registrar una nueva salida"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_hora">Fecha y Hora</Label>
                    <Input
                      id="fecha_hora"
                      type="datetime-local"
                      required
                      value={formData.fecha_hora}
                      onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_camion">Camión</Label>
                    <Select
                      value={formData.id_camion}
                      onValueChange={(value) => setFormData({ ...formData, id_camion: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un camión" />
                      </SelectTrigger>
                      <SelectContent>
                        {camiones.map((camion) => (
                          <SelectItem key={camion.id} value={camion.id}>
                            {camion.placa} - {camion.chofer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="id_lote">Lote</Label>
                    <Select
                      value={formData.id_lote}
                      onValueChange={(value) => setFormData({ ...formData, id_lote: value })}
                      disabled={filteredLotes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCamion ? "Selecciona un lote" : "Selecciona un camión primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLotes.map((lote) => (
                          <SelectItem key={lote.id} value={lote.id}>
                            {lote.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCamion && filteredLotes.length === 0 && (
                      <div className="text-xs text-muted-foreground">
                        No hay lotes activos disponibles para el fundo del camión seleccionado.
                      </div>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="enviadas">Jabas Enviadas</Label>
                    <Input
                      id="enviadas"
                      type="number"
                      placeholder="0"
                      required
                      min="1"
                      value={formData.enviadas || ""}
                      onChange={(e) => setFormData({ ...formData, enviadas: Number.parseInt(e.target.value) || 0 })}
                      className={isOverCapacity() ? "border-destructive" : ""}
                    />
                    {isOverCapacity() && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Excede la capacidad del camión
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guias">Número de Guía</Label>
                    <Input
                      id="guias"
                      type="text"
                      placeholder="GU-001"
                      required
                      value={formData.guias}
                      onChange={(e) => setFormData({ ...formData, guias: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading || isOverCapacity()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {guia ? "Actualizando..." : "Registrando..."}
                      </>
                    ) : guia ? (
                      "Actualizar Guía"
                    ) : (
                      "Registrar Guía"
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/guias">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral con información del camión */}
        <div className="space-y-4">
          {selectedCamion && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5" />
                  Información del Camión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Placa</Label>
                  <p className="font-mono font-semibold">{selectedCamion.placa}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Chofer</Label>
                  <p className="font-medium">{selectedCamion.chofer}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Capacidad</Label>
                  <p className="font-medium">{selectedCamion.capacidad} jabas</p>
                </div>
                {formData.enviadas > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Utilización</Label>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formData.enviadas} jabas</span>
                        <span>{Math.round(getCapacityPercentage())}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOverCapacity() ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(getCapacityPercentage(), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {camiones.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Truck className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No hay camiones activos disponibles</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
