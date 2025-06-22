
"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { type RehearsalData, getRehearsals } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function RehearsalsPage() {
  const [rehearsals, setRehearsals] = useState<RehearsalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRehearsals = async () => {
      setIsLoading(true);
      try {
        const data = await getRehearsals();
        setRehearsals(data);
      } catch (error) {
        console.error("Failed to fetch rehearsals", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRehearsals();
  }, []);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Ensayos
        </h1>
        <Button asChild>
            <Link href="/dashboard/rehearsals/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Programar Ensayo
            </Link>
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
              {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
              ) : rehearsals.length > 0 ? (
                rehearsals.map((rehearsal) => (
                  <TableRow key={rehearsal.id}>
                    <TableCell className="font-medium">{format(new Date(rehearsal.date), 'dd/MM/yyyy')}</TableCell>
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
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron ensayos.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
