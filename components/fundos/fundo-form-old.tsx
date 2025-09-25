"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface FundoFormData {
  nombre: string
  ubicacion: string
  area_hectareas: string
}

interface FundoFormProps {
  fundo?: {
    id: string
    nombre: string
    ubicacion: string | null
    area_hectareas: number | null
  }
}

export function FundoForm({ fundo }: FundoFormProps) {
  const [formData, setFormData] = useState<FundoFormData>({
    nombre: fundo?.nombre || "",
    ubicacion: fundo?.ubicacion || "",
    area_hectareas: fundo?.area_hectareas?.toString() || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del fundo es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        nombre: formData.nombre.trim(),
        ubicacion: formData.ubicacion.trim() || null,
        area_hectareas: formData.area_hectareas ? parseFloat(formData.area_hectareas) : null,
      }

      if (fundo) {
        // Update existing fundo
        const { error } = await supabase
          .from("fundos")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", fundo.id)

        if (error) throw error

        toast({
          title: "Fundo actualizado",
          description: "El fundo ha sido actualizado correctamente",
        })
      } else {
        // Create new fundo
        const { error } = await supabase.from("fundos").insert(data)

        if (error) throw error

        toast({
          title: "Fundo creado",
          description: "El fundo ha sido creado correctamente",
        })
      }

      router.push("/dashboard/fundos")
    } catch (error) {
      console.error("Error saving fundo:", error)
      toast({
        title: "Error",
        description: fundo ? "No se pudo actualizar el fundo" : "No se pudo crear el fundo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FundoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/fundos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Fundos
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{fundo ? "Editar Fundo" : "Nuevo Fundo"}</CardTitle>
          <CardDescription>
            {fundo ? "Modifica la información del fundo" : "Ingresa la información del nuevo fundo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Fundo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: Fundo Los Alamos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion}
                onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                placeholder="Ej: Región Metropolitana, Chile"
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
                placeholder="Ej: 150.5"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {fundo ? "Actualizar Fundo" : "Crear Fundo"}
              </Button>
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/dashboard/fundos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
