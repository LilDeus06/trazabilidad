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
import { Loader2, ArrowLeft, FileText, Truck, AlertCircle, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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
  id_lotes?: string[]
  loteQuantities?: Record<string, number>
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
    id_lotes: guia?.id_lotes || [],
    loteQuantities: guia?.loteQuantities || {} as Record<string, number>,
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
    // Reset id_lotes if they don't belong to the selected camión's fundo
    if (formData.id_lotes.length > 0 && selectedCamion) {
      const compatibleLotes = formData.id_lotes.filter((loteId) =>
        filteredLotes.some((l) => l.id === loteId)
      )
      if (compatibleLotes.length !== formData.id_lotes.length) {
        setFormData((prev) => ({ ...prev, id_lotes: compatibleLotes }))
      }
    }
  }, [selectedCamion, formData.id_lotes, filteredLotes])

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
        fecha_hora: new Date(formData.fecha_hora + 'Z').toISOString(),
        id_camion: formData.id_camion,
        id_fundo: selectedCamion?.id_fundo,
        id_lotes: formData.id_lotes.length > 0 ? formData.id_lotes : null,
        enviadas: formData.enviadas,
        guias: formData.guias,
        usuario_id: user.id,
      }

      let guiaId = guia?.id

      if (guia?.id) {
        // Actualizar guía existente
        const { error } = await supabase.from("guias").update(guiaData).eq("id", guia.id)

        if (error) throw error

        // Delete existing guia_lotes and insert new ones
        await supabase.from("guia_lotes").delete().eq("guia_id", guia.id)
      } else {
        // Crear nueva guía
        const { data, error } = await supabase.from("guias").insert(guiaData).select("id").single()

        if (error) throw error
        guiaId = data.id
      }

      // Insert guia_lotes if multiple lotes
      if (formData.id_lotes.length > 1 && guiaId) {
        const guiaLotesData = formData.id_lotes.map(loteId => ({
          guia_id: guiaId,
          lote_id: loteId,
          cantidad: formData.loteQuantities[loteId] || 0
        }))

        const { error: loteError } = await supabase.from("guia_lotes").insert(guiaLotesData)

        if (loteError) throw loteError
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
                  <Label>Lotes</Label>
                  {selectedCamion ? (
                    filteredLotes.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                        {filteredLotes.map((lote) => (
                          <div key={lote.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lote-${lote.id}`}
                              checked={formData.id_lotes.includes(lote.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    id_lotes: [...prev.id_lotes, lote.id]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    id_lotes: prev.id_lotes.filter(id => id !== lote.id)
                                  }))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`lote-${lote.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {lote.nombre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md">
                        No hay lotes activos disponibles para el fundo del camión seleccionado.
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded-md">
                      Selecciona un camión primero
                    </div>
                  )}
                  {formData.id_lotes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formData.id_lotes.length} lote{formData.id_lotes.length > 1 ? 's' : ''} seleccionado{formData.id_lotes.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {formData.id_lotes.length > 1 && (
                  <div className="space-y-2">
                    <Label>Cantidades por Lote</Label>
                    <div className="space-y-2">
                      {formData.id_lotes.map((loteId) => {
                        const lote = filteredLotes.find(l => l.id === loteId)
                        return (
                          <div key={loteId} className="flex items-center gap-2">
                            <Label className="w-32 text-sm">{lote?.nombre || 'Lote'}</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={formData.loteQuantities[loteId] || ""}
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 0
                                setFormData(prev => ({
                                  ...prev,
                                  loteQuantities: { ...prev.loteQuantities, [loteId]: value },
                                  enviadas: Object.values({ ...prev.loteQuantities, [loteId]: value }).reduce((sum, qty) => sum + (qty || 0), 0)
                                }))
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">jabas</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {formData.enviadas} jabas
                    </div>
                  </div>
                )}

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
