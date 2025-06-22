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
    { date: "July 18, 2024", time: "6:00 PM - 8:00 PM", location: "Community Hall", focus: "New Wedding Setlist" },
    { date: "July 25, 2024", time: "7:00 PM - 9:00 PM", location: "Music Studio A", focus: "Festival Performance" },
    { date: "August 2, 2024", time: "6:30 PM - 8:30 PM", location: "Community Hall", focus: "Vocal Harmonies" },
    { date: "August 9, 2024", time: "7:00 PM - 9:00 PM", location: "Music Studio A", focus: "Instrumental Solos" },
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
