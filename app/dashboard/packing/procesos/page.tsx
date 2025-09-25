import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProcesoForm } from "@/components/packing/proceso-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function ProcesosPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (!user || userError) {
    redirect("/auth/login")
  }

  // Verificar rol del usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  if (!profile || profileError || !["admin", "operador"].includes(profile.rol)) {
    redirect("/dashboard")
  }

  // Obtener procesos de packing con información del pallet y responsable
  const { data: procesos, error: procesosError } = await supabase
    .from("packing")
    .select(`
      *,
      acopio_pallets (
        codigo_pallet
      ),
      profiles (
        nombre,
        apellido
      )
    `)
    .order("fecha_packing", { ascending: false })

  if (procesosError) {
    console.error("Error fetching procesos:", procesosError)
  }

  const getTipoEmpaqueBadge = (tipo: string) => {
    switch (tipo) {
      case "caja_5kg":
        return <Badge variant="default">Caja 5kg</Badge>
      case "caja_10kg":
        return <Badge variant="default">Caja 10kg</Badge>
      case "bolsa_1kg":
        return <Badge variant="secondary">Bolsa 1kg</Badge>
      case "bolsa_2kg":
        return <Badge variant="secondary">Bolsa 2kg</Badge>
      case "granel":
        return <Badge variant="outline">Granel</Badge>
      default:
        return <Badge variant="secondary">{tipo}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/packing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Packing
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Procesos de Packing</h1>
        <p className="text-muted-foreground">Gestión de procesos de empaque y procesamiento</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProcesoForm userId={user.id} />
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Procesos</CardTitle>
              <CardDescription>Registro completo de procesos de packing realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Pallet</TableHead>
                      <TableHead>Cantidad (kg)</TableHead>
                      <TableHead>Tipo Empaque</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Responsable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procesos?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay procesos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      procesos?.map((proceso) => (
                        <TableRow key={proceso.id}>
                          <TableCell className="font-medium">
                            {format(new Date(proceso.fecha_packing), "dd/MM/yyyy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>{proceso.acopio_pallets?.codigo_pallet || "N/A"}</TableCell>
                          <TableCell>{proceso.cantidad_procesada.toLocaleString()}</TableCell>
                          <TableCell>{getTipoEmpaqueBadge(proceso.tipo_empaque)}</TableCell>
                          <TableCell>{proceso.destino || "Sin especificar"}</TableCell>
                          <TableCell>
                            {proceso.profiles
                              ? `${proceso.profiles.nombre} ${proceso.profiles.apellido}`
                              : "No asignado"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
