import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ComingSoonProps {
  title: string
  description: string
  backUrl: string
  backLabel: string
}

export function ComingSoon({ title, description, backUrl, backLabel }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>

      <Card className="border-border/50 max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Construction className="h-16 w-16 text-muted-foreground/50" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Esta funcionalidad está en desarrollo y estará disponible próximamente. La estructura de base de datos ya
            está preparada para su implementación.
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link href={backUrl}>Volver</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
