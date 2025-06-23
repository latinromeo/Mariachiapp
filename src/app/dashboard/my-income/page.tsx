import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyIncomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Mis Ingresos
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Página en Construcción</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Esta sección está diseñada para que los músicos puedan ver sus pagos por eventos y gestionar sus finanzas. ¡Próximamente disponible!</p>
        </CardContent>
      </Card>
    </div>
  );
}
