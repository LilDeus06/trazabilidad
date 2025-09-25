"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getPeruTimestamp } from "@/lib/utils/date-peru"

interface Fundo {
  id: string
  nombre: string
}

interface LoteFormData {
  id_fundo: string
  nombre: string
  area_hectareas: string
  tipo_cultivo: string
  variedad: string
  fecha_siembra: string
}

interface LoteFormProps {
  lote?: {
    id: string
    id_fundo: string
    nombre: string
    area_hectareas: number | null
    tipo_cultivo: string | null
    variedad: string | null
    fecha_siembra: string | null
  }
}

export function LoteForm({ lote }: LoteFormProps) {
  const [formData, setFormData] = useState<LoteFormData>({
    id_fundo: lote?.id_fundo || "",
    nombre: lote?.nombre || "",
    area_hectareas: lote?.area_hectareas?.toString() || "",
    tipo_cultivo: lote?.tipo_cultivo || "",
    variedad: lote?.variedad || "",
    fecha_siembra: lote?.fecha_siembra || "",
  })
  const [fundos, setFundos] = useState<Fundo[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingFundos, setLoadingFundos] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadFundos()
  }, [])

  const loadFundos = async () => {
    try {
      const { data, error } = await supabase
        .from("fundos")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")

      if (error) throw error
      setFundos(data || [])
    } catch (error) {
      console.error("Error loading fundos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los fundos",
        variant: "destructive",
      })
    } finally {
      setLoadingFundos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.id_fundo || !formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El fundo y nombre del lote son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        id_fundo: formData.id_fundo,
        nombre: formData.nombre.trim(),
        area_hectareas: formData.area_hectareas ? parseFloat(formData.area_hectareas) : null,
        tipo_cultivo: formData.tipo_cultivo.trim() || null,
        variedad: formData.variedad.trim() || null,
        fecha_siembra: formData.fecha_siembra || null,
      }

      if (lote) {
        // Update existing lote
        const { error } = await supabase
          .from("lotes")
          .update({
            ...data,
            updated_at: getPeruTimestamp(), // ✅ Zona horaria de Perú
          })
          .eq("id", lote.id)

        if (error) throw error

        toast({
          title: "Lote actualizado",
          description: "El lote ha sido actualizado correctamente",
        })
      } else {
        // Create new lote
        const { error } = await supabase.from("lotes").insert({
          ...data,
          estado: "activo",
          created_at: getPeruTimestamp(), // ✅ Zona horaria de Perú
          updated_at: getPeruTimestamp(), // ✅ Zona horaria de Perú
        })

        if (error) throw error

        toast({
          title: "Lote creado",
          description: "El lote ha sido creado correctamente",
        })
      }

      router.push("/dashboard/lotes")
    } catch (error) {
      console.error("Error saving lote:", error)
      toast({
        title: "Error",
        description: lote ? "No se pudo actualizar el lote" : "No se pudo crear el lote",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof LoteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/lotes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Lotes
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{lote ? "Editar Lote" : "Nuevo Lote"}</CardTitle>
          <CardDescription>
            {lote ? "Modifica la información del lote" : "Ingresa la información del nuevo lote"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="id_fundo">Fundo *</Label>
              <Select
                value={formData.id_fundo}
                onValueChange={(value) => handleInputChange("id_fundo", value)}
                disabled={loadingFundos}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingFundos ? "Cargando fundos..." : "Selecciona un fundo"} />
                </SelectTrigger>
                <SelectContent>
                  {fundos.map((fundo) => (
                    <SelectItem key={fundo.id} value={fundo.id}>
                      {fundo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Lote *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: Lote A1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_hectareas">Área (Hectáreas)</Label>
              <Input
                id="area_hectareas"
                type="number"
                step="0.01"
                min="0"
                value={formData.area_hectareas}
                onChange={(e) => handleInputChange("area_hectareas", e.target.value)}
                placeholder="Ej: 25.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_cultivo">Tipo de Cultivo</Label>
              <Input
                id="tipo_cultivo"
                value={formData.tipo_cultivo}
                onChange={(e) => handleInputChange("tipo_cultivo", e.target.value)}
                placeholder="Ej: Manzana"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variedad">Variedad</Label>
              <Input
                id="variedad"
                value={formData.variedad}
                onChange={(e) => handleInputChange("variedad", e.target.value)}
                placeholder="Ej: Fuji"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_siembra">Fecha de Siembra</Label>
              <Input
                id="fecha_siembra"
                type="date"
                value={formData.fecha_siembra}
                onChange={(e) => handleInputChange("fecha_siembra", e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || loadingFundos} className="flex-1">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {lote ? "Actualizar Lote" : "Crear Lote"}
              </Button>
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/dashboard/lotes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
