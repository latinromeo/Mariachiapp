"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "lucide-react"

export default function DashboardPage() {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const currentMonth = months[new Date().getMonth()].toLowerCase();
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="flex flex-col gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <LayoutGridIcon className="h-5 w-5" />
                </div>
                Panel Principal
            </h1>
            <p className="text-muted-foreground mt-1">Resumen de tu actividad y accesos directos.</p>
        </div>
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1">
                      <CardTitle>Actividades Pendientes (0)</CardTitle>
                       <CardDescription className="mt-1">
                          Eventos y ensayos para Junio 2025.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select defaultValue="junio">
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map(month => (
                                <SelectItem key={month} value={month.toLowerCase()}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                        </Select>
                        <Select defaultValue="2025">
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center py-20 min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No hay actividades pendientes para el mes seleccionado.</h3>
                <p className="text-muted-foreground text-sm">Intenta seleccionar otro mes o año, o agrega nuevas actividades.</p>
            </CardContent>
        </Card>
    </div>
  )
}

function LayoutGridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  )
}
