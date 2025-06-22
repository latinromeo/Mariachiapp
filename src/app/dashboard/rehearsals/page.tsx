
"use client"

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
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
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";

export default function RehearsalsPage() {
  const [allRehearsals, setAllRehearsals] = useState<RehearsalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRehearsals = async () => {
      setIsLoading(true);
      try {
        const data = await getRehearsals();
        setAllRehearsals(data);
      } catch (error) {
        console.error("Failed to fetch rehearsals", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRehearsals();
  }, []);

  const filteredRehearsals = useMemo(() => {
    if (!searchTerm) {
      return allRehearsals;
    }
    return allRehearsals.filter(
      (rehearsal) =>
        rehearsal.focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rehearsal.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRehearsals, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Ensayos
        </h1>
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
           <div className="relative w-full max-w-sm">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Buscar por tema o lugar..."
               className="pl-8"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
            <Button asChild>
                <Link href="/dashboard/rehearsals/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Programar Ensayo
                </Link>
            </Button>
        </div>
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
                <TableHead>Tema</TableHead>
                <TableHead className="text-center">Canciones</TableHead>
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
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
              ) : filteredRehearsals.length > 0 ? (
                filteredRehearsals.map((rehearsal) => (
                  <TableRow key={rehearsal.id}>
                    <TableCell className="font-medium">{format(new Date(rehearsal.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{rehearsal.time}</TableCell>
                    <TableCell>{rehearsal.location}</TableCell>
                    <TableCell>{rehearsal.focus}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="secondary">{rehearsal.songs?.length || 0}</Badge>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                        {searchTerm ? "No se encontraron ensayos con ese criterio." : "No se encontraron ensayos."}
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
