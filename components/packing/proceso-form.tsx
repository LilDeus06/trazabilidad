"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { packingSchema, type PackingFormData } from "@/lib/validations/packing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ProcesoFormProps {
  userId: string
  onSuccess?: () => void
}

interface Pallet {
  id: string
  codigo_pallet: string
  estado: string
}

export function ProcesoForm({ userId, onSuccess }: ProcesoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pallets, setPallets] = useState<Pallet[]>([])
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PackingFormData>({
    resolver: zodResolver(packingSchema),
    defaultValues: {
      responsable_id: userId,
    },
  })

  const selectedPallet = watch("id_pallet")

  useEffect(() => {
    const fetchPallets = async () => {
      const { data, error } = await supabase
        .from("acopio_pallets")
        .select("id, codigo_pallet, estado")
        .in("estado", ["lleno", "parcial"])
        .order("codigo_pallet")

      if (!error && data) {
        setPallets(data)
      }
    }

    fetchPallets()
  }, [supabase])

  const onSubmit = async (data: PackingFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("packing").insert([data])

      if (error) throw error

      // Actualizar estado del pallet a despachado
      await supabase.from("acopio_pallets").update({ estado: "despachado" }).eq("id", data.id_pallet)

      reset()
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error creating packing:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Proceso de Packing</CardTitle>
        <CardDescription>Registra un nuevo proceso de empaque y procesamiento</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_pallet">Pallet</Label>
            <Select value={selectedPallet} onValueChange={(value) => setValue("id_pallet", value)}>
              <SelectTrigger className={errors.id_pallet ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona un pallet" />
              </SelectTrigger>
              <SelectContent>
                {pallets.map((pallet) => (
                  <SelectItem key={pallet.id} value={pallet.id}>
                    {pallet.codigo_pallet} - {pallet.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_pallet && <p className="text-sm text-red-500">{errors.id_pallet.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad_procesada">Cantidad Procesada (kg)</Label>
              <Input
                id="cantidad_procesada"
                type="number"
                min="1"
                placeholder="Ej: 800"
                {...register("cantidad_procesada", { valueAsNumber: true })}
                className={errors.cantidad_procesada ? "border-red-500" : ""}
              />
              {errors.cantidad_procesada && <p className="text-sm text-red-500">{errors.cantidad_procesada.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_empaque">Tipo de Empaque</Label>
              <Select onValueChange={(value) => setValue("tipo_empaque", value)}>
                <SelectTrigger className={errors.tipo_empaque ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecciona tipo de empaque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caja_5kg">Caja 5kg</SelectItem>
                  <SelectItem value="caja_10kg">Caja 10kg</SelectItem>
                  <SelectItem value="bolsa_1kg">Bolsa 1kg</SelectItem>
                  <SelectItem value="bolsa_2kg">Bolsa 2kg</SelectItem>
                  <SelectItem value="granel">Granel</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_empaque && <p className="text-sm text-red-500">{errors.tipo_empaque.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destino">Destino</Label>
            <Input
              id="destino"
              placeholder="Ej: Mercado Central, Exportación"
              {...register("destino")}
              className={errors.destino ? "border-red-500" : ""}
            />
            {errors.destino && <p className="text-sm text-red-500">{errors.destino.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Proceso
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
