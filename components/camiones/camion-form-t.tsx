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
import { Loader2, ArrowLeft, Truck } from "lucide-react"
import Link from "next/link"

interface Fundo {
  id: string
  nombre: string
}

interface Lote {
  id: string
  nombre: string
  id_fundo: string
}

interface Camion {
  id?: string
  chofer: string
  placa: string
  capacidad: number
  activo: boolean
  id_fundo?: string
  id_lote?: string
}

interface CamionFormProps {
  camion?: Camion
}

export function CamionForm({ camion }: CamionFormProps) {
  const [formData, setFormData] = useState({
    chofer: camion?.chofer || "",
    placa: camion?.placa || "",
    capacidad: camion?.capacidad || 0,
    activo: camion?.activo ?? true,
    id_fundo: camion?.id_fundo || "",
    id_lote: camion?.id_lote || "",
  })
  const [fundos, setFundos] = useState<Fundo[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingFundos, setLoadingFundos] = useState(true)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchFundos = async () => {
      try {
        const { data, error } = await supabase
          .from("fundos")
          .select("id, nombre")
          .eq("activo", true)
          .order("nombre")

        if (error) throw error
        setFundos(data || [])
      } catch (error) {
        console.error("Error fetching fundos:", error)
      } finally {
        setLoadingFundos(false)
      }
    }

    fetchFundos()
  }, [])

  useEffect(() => {
    if (formData.id_fundo) {
      const fetchLotes = async () => {
        setLoadingLotes(true)
        try {
          const { data, error } = await supabase
            .from("lotes")
            .select("id, nombre, id_fundo")
            .eq("id_fundo", formData.id_fundo)
            .eq("estado", "activo")
            .order("nombre")

          if (error) throw error
          setLotes(data || [])
        } catch (error) {
          console.error("Error fetching lotes:", error)
        } finally {
          setLoadingLotes(false)
        }
      }

      fetchLotes()
    } else {
      setLotes([])
    }
  }, [formData.id_fundo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (camion?.id) {
        // Actualizar camión existente
        const { error } = await supabase
          .from("camiones")
          .update({
            chofer: formData.chofer,
            placa: formData.placa.toUpperCase(),
            capacidad: formData.capacidad,
            activo: formData.activo,
            id_fundo: formData.id_fundo || null,
            id_lote: formData.id_lote || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", camion.id)

        if (error) throw error
      } else {
        // Crear nuevo camión
        const { error } = await supabase.from("camiones").insert({
          chofer: formData.chofer,
          placa: formData.placa.toUpperCase(),
          capacidad: formData.capacidad,
          activo: formData.activo,
          id_fundo: formData.id_fundo || null,
          id_lote: formData.id_lote || null,
        })

        if (error) throw error
      }

      router.push("/dashboard/camiones")
      router.refresh()
    } catch (error: any) {
      if (error.code === "23505") {
        setError("Ya existe un camión con esa placa")
      } else {
        setError(error.message || "Ocurrió un error")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/camiones">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Camiones
          </Link>
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {camion ? "Editar Camión" : "Nuevo Camión"}
          </CardTitle>
          <CardDescription>
            {camion ? "Modifica la información del camión" : "Completa la información para registrar un nuevo camión"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chofer">Chofer</Label>
                <Input
                  id="chofer"
                  type="text"
                  placeholder="Nombre del chofer"
                  required
                  value={formData.chofer}
                  onChange={(e) => setFormData({ ...formData, chofer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  type="text"
                  placeholder="ABC-123"
                  required
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad (jabas)</Label>
                <Input
                  id="capacidad"
                  type="number"
                  placeholder="100"
                  required
                  min="1"
                  value={formData.capacidad || ""}
                  onChange={(e) => setFormData({ ...formData, capacidad: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activo">Estado</Label>
                <Select
                  value={formData.activo.toString()}
                  onValueChange={(value) => setFormData({ ...formData, activo: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="id_fundo">Fundo (Opcional)</Label>
                <Select
                  value={formData.id_fundo}
                  onValueChange={(value) => setFormData({ ...formData, id_fundo: value, id_lote: "" })}
                  disabled={loadingFundos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFundos ? "Cargando fundos..." : "Selecciona un fundo"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {fundos.map((fundo) => (
                      <SelectItem key={fundo.id} value={fundo.id}>
                        {fundo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_lote">Lote (Opcional)</Label>
                <Select
                  value={formData.id_lote}
                  onValueChange={(value) => setFormData({ ...formData, id_lote: value })}
                  disabled={!formData.id_fundo || loadingLotes}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.id_fundo
                          ? "Primero selecciona un fundo"
                          : loadingLotes
                          ? "Cargando lotes..."
                          : "Selecciona un lote"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {lotes.map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {camion ? "Actualizando..." : "Creando..."}
                  </>
                ) : camion ? (
                  "Actualizar Camión"
                ) : (
                  "Crear Camión"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/camiones">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
