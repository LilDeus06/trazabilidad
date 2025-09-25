import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PalletForm } from "@/components/acopio/pallet-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PalletsPage() {
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

  // Obtener pallets
  const { data: pallets, error: palletsError } = await supabase
    .from("acopio_pallets")
    .select("*")
    .order("codigo_pallet", { ascending: true })

  if (palletsError) {
    console.error("Error fetching pallets:", palletsError)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "vacio":
        return <Badge variant="outline">Vacío</Badge>
      case "parcial":
        return <Badge variant="secondary">Parcial</Badge>
      case "lleno":
        return <Badge variant="default">Lleno</Badge>
      case "despachado":
        return <Badge variant="destructive">Despachado</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
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
        <h1 className="text-3xl font-bold text-foreground">Gestión de Pallets</h1>
        <p className="text-muted-foreground">Administra el inventario de pallets y ubicaciones</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PalletForm />
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Inventario de Pallets</CardTitle>
              <CardDescription>Lista completa de pallets registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Capacidad (kg)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pallets?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay pallets registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      pallets?.map((pallet) => (
                        <TableRow key={pallet.id}>
                          <TableCell className="font-medium">{pallet.codigo_pallet}</TableCell>
                          <TableCell>{pallet.capacidad.toLocaleString()}</TableCell>
                          <TableCell>{getEstadoBadge(pallet.estado)}</TableCell>
                          <TableCell>{pallet.ubicacion || "Sin asignar"}</TableCell>
                          <TableCell>{new Date(pallet.created_at).toLocaleDateString("es-ES")}</TableCell>
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
