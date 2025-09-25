import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CarretaForm } from "@/components/campo/carreta-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CarretasPage() {
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

  // Obtener carretas
  const { data: carretas, error: carretasError } = await supabase
    .from("campo_carreta")
    .select("*")
    .order("numero_carreta", { ascending: true })

  if (carretasError) {
    console.error("Error fetching carretas:", carretasError)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "disponible":
        return <Badge variant="default">Disponible</Badge>
      case "en_uso":
        return <Badge variant="secondary">En Uso</Badge>
      case "mantenimiento":
        return <Badge variant="outline">Mantenimiento</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/campo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Campo
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Carretas</h1>
        <p className="text-muted-foreground">Administra el inventario y estado de carretas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CarretaForm />
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Carretas</CardTitle>
              <CardDescription>Inventario completo de carretas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Capacidad (kg)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registrada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carretas?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay carretas registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      carretas?.map((carreta) => (
                        <TableRow key={carreta.id}>
                          <TableCell className="font-medium">{carreta.numero_carreta}</TableCell>
                          <TableCell>{carreta.capacidad.toLocaleString()}</TableCell>
                          <TableCell>{getEstadoBadge(carreta.estado)}</TableCell>
                          <TableCell>{new Date(carreta.created_at).toLocaleDateString("es-ES")}</TableCell>
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
