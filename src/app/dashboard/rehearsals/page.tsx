
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

const rehearsals = [
    { date: "18 de Julio, 2024", time: "6:00 PM - 8:00 PM", location: "Salón Comunitario", focus: "Nuevo Setlist de Boda" },
    { date: "25 de Julio, 2024", time: "7:00 PM - 9:00 PM", location: "Estudio de Música A", focus: "Actuación en Festival" },
    { date: "2 de Agosto, 2024", time: "6:30 PM - 8:30 PM", location: "Salón Comunitario", focus: "Armonías Vocales" },
    { date: "9 de Agosto, 2024", time: "7:00 PM - 9:00 PM", location: "Estudio de Música A", focus: "Solos Instrumentales" },
];

export default function RehearsalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Ensayos
        </h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Programar Ensayo
        </Button>
       </div>
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Ensayos</CardTitle>
          <CardDescription>
            Planea y sigue las sesiones de práctica de tu banda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Enfoque</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rehearsals.map((rehearsal) => (
                <TableRow key={rehearsal.date}>
                  <TableCell className="font-medium">{rehearsal.date}</TableCell>
                  <TableCell>{rehearsal.time}</TableCell>
                  <TableCell>{rehearsal.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rehearsal.focus}</Badge>
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
