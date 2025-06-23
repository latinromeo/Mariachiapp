
"use client"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Users, PlusCircle, Search, Phone, Edit, Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { type ClientData, getClients } from "@/services/eventService";
import { ClientForm } from "./client-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    fetchClients();
  }

  const handleDeleteClient = (id: string) => {
    console.log(`Deleting client ${id}`);
    // In a real app, this would call a service to delete the client
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Users className="h-10 w-10 text-primary" />
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Gestión de Clientes
            </h1>
            <p className="text-muted-foreground">
                Visualiza, busca y administra la información de tus clientes.
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="h-4 w-4 sm:mr-2" />
                    <span>Agregar Nuevo Cliente</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Completa la información para registrar un nuevo cliente manualmente.
                    </DialogDescription>
                </DialogHeader>
                <ClientForm onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>

       </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
            <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar por nombre, teléfono o evento..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Motivo (Último)</TableHead>
                <TableHead>Fecha Evento</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="flex flex-col gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><div className="flex gap-4"><Skeleton className="h-5 w-5" /><Skeleton className="h-5 w-20" /></div></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </TableCell>
                    <TableCell>
                       <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </a>
                    </TableCell>
                    <TableCell>{index % 2 === 0 ? "Cumpleaños" : "Boda"}</TableCell>
                    <TableCell>{index % 2 === 0 ? "2025-01-15" : "2025-02-20"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Link href="#" className="text-primary">
                          <Edit className="h-4 w-4" />
                        </Link>
                         <button onClick={() => handleDeleteClient(client.id)} className="flex items-center gap-1 text-destructive hover:underline">
                           <Check className="h-4 w-4" />
                           Eliminar
                         </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron clientes.
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
