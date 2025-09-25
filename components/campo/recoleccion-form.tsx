"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { recoleccionSchema, type RecoleccionFormData } from "@/lib/validations/campo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Lote {
  id: string
  nombre: string
  fundos: {
    nombre: string
  }[]
}

interface RecoleccionFormProps {
  userId: string
  onSuccess?: () => void
}

export function RecoleccionForm({ userId, onSuccess }: RecoleccionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingLotes, setLoadingLotes] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const { data, error } = await supabase
          .from("lotes")
          .select(`
            id,
            nombre,
            fundos (
              nombre
            )
          `)
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
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<RecoleccionFormData>({
    resolver: zodResolver(recoleccionSchema),
    defaultValues: {
      responsable_id: userId,
    },
  })

  const onSubmit = async (data: RecoleccionFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("campo_recoleccion").insert([data])

      if (error) throw error

      reset()
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error creating recoleccion:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Recolección</CardTitle>
        <CardDescription>Registra una nueva actividad de recolección en campo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register("fecha")} className={errors.fecha ? "border-red-500" : ""} />
              {errors.fecha && <p className="text-sm text-red-500">{errors.fecha.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_lote">Lote</Label>
              <Select onValueChange={(value) => setValue("id_lote", value)} disabled={loadingLotes}>
                <SelectTrigger className={errors.id_lote ? "border-red-500" : ""}>
                  <SelectValue placeholder={loadingLotes ? "Cargando lotes..." : "Selecciona un lote"} />
                </SelectTrigger>
                <SelectContent>
                  {lotes.map((lote) => (
                    <SelectItem key={lote.id} value={lote.id}>
                      {lote.nombre} - {lote.fundos?.[0]?.nombre || "Sin fundo"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_lote && <p className="text-sm text-red-500">{errors.id_lote.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad_recolectada">Cantidad Recolectada (kg)</Label>
            <Input
              id="cantidad_recolectada"
              type="number"
              min="1"
              placeholder="Ej: 1500"
              {...register("cantidad_recolectada", { valueAsNumber: true })}
              className={errors.cantidad_recolectada ? "border-red-500" : ""}
            />
            {errors.cantidad_recolectada && (
              <p className="text-sm text-red-500">{errors.cantidad_recolectada.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="calidad">Observaciones de Calidad</Label>
            <Textarea
              id="calidad"
              placeholder="Observaciones sobre la calidad de la recolección..."
              {...register("calidad")}
              className={errors.calidad ? "border-red-500" : ""}
            />
            {errors.calidad && <p className="text-sm text-red-500">{errors.calidad.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Recolección
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
