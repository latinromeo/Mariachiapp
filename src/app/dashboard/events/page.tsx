
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  

const events = [
    { name: "Boda en Salón La Candelaria", date: "20 de Julio, 2024", venue: "Salón La Candelaria", status: "Confirmado" },
    { name: "Celebración de Quinceañera", date: "22 de Julio, 2024", venue: "Salón Imperial", status: "Confirmado" },
    { name: "Gala Corporativa", date: "1 de Agosto, 2024", venue: "Centro de Convenciones", status: "Pendiente" },
    { name: "Fiesta Privada de Cumpleaños", date: "5 de Agosto, 2024", venue: "Residencia del Cliente", status: "Confirmado" },
    { name: "Festival del Sol", date: "15 de Agosto, 2024", venue: "Plaza Mayor", status: "Tentativo" },
    { name: "Cena de Aniversario", date: "2 de Septiembre, 2024", venue: "Restaurante La Hacienda", status: "Confirmado" },
];

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Calendario de Eventos
        </h1>
        <Button asChild>
            <a href="/dashboard/events/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Evento
            </a>
        </Button>
       </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>
            Una lista de todos tus eventos próximos y pasados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Evento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.name}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === "Confirmado" ? "default" : event.status === "Pendiente" ? "secondary" : "outline"}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
