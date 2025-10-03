import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecepcionForm } from "@/components/acopio/recepcion-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function RecepcionPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (!user || userError) {
    redirect("/auth/login")
  }

  // Verificar permisos del usuario para el módulo acopio
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read")
    .eq("user_id", user.id)
    .eq("module_name", "acopio")
    .single()

  // Si no tiene permisos específicos, verificar rol por defecto
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  const hasPermission = permissions?.can_read || (profile && ["admin", "operador"].includes(profile.rol))

  if (profileError || !hasPermission) {
    redirect("/dashboard")
  }

  // Obtener recepciones con información del responsable y lote
  const { data: recepciones, error: recepcionesError } = await supabase
    .from("acopio_recepcion")
    .select(`
      *,
      profiles (
        nombre,
        apellido
      ),
      lotes (
        nombre,
        fundos (
          nombre
        )
      )
    `)
    .order("fecha_recepcion", { ascending: false })

  if (recepcionesError) {
    console.error("Error fetching recepciones:", recepcionesError)
  }

  const getCalidadBadge = (calidad: string | null) => {
    if (!calidad) return <Badge variant="secondary">Sin evaluar</Badge>
    if (calidad.toLowerCase().includes("excelente")) return <Badge variant="default">Excelente</Badge>
    if (calidad.toLowerCase().includes("buena")) return <Badge variant="secondary">Buena</Badge>
    if (calidad.toLowerCase().includes("regular")) return <Badge variant="outline">Regular</Badge>
    return <Badge variant="secondary">Evaluada</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/acopio">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Acopio
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Recepción</h1>
        <p className="text-muted-foreground">Control de recepción de productos desde campo</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecepcionForm userId={user.id} />
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Recepciones</CardTitle>
              <CardDescription>Registro completo de recepciones realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Cantidad (kg)</TableHead>
                      <TableHead>Calidad</TableHead>
                      <TableHead>Responsable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recepciones?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay recepciones registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      recepciones?.map((recepcion) => (
                        <TableRow key={recepcion.id}>
                          <TableCell className="font-medium">
                            {format(new Date(recepcion.fecha_recepcion), "dd/MM/yyyy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {recepcion.lotes
                              ? `${recepcion.lotes.nombre} - ${recepcion.lotes.fundos?.[0]?.nombre || "Sin fundo"}`
                              : "Lote no encontrado"}
                          </TableCell>
                          <TableCell>{recepcion.cantidad_recibida.toLocaleString()}</TableCell>
                          <TableCell>{getCalidadBadge(recepcion.calidad)}</TableCell>
                          <TableCell>
                            {recepcion.profiles
                              ? `${recepcion.profiles.nombre} ${recepcion.profiles.apellido}`
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
