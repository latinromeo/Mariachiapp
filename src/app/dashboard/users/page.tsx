
"use client"

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
import { MoreHorizontal, PlusCircle, Shield, Music, BarChart3, UserCog, Wand2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser, UserRole } from "@/lib/auth";

const userRoleDetails: Record<string, { icon: React.ElementType, color: string }> = {
  'Administrador General': { icon: Shield, color: "text-destructive" },
  'Director Musical': { icon: Music, color: "text-orange-500" },
  'Coordinador de Eventos': { icon: UserCog, color: "text-blue-500" },
  'Músico': { icon: Music, color: "text-purple-500" },
  'Contador': { icon: BarChart3, color: "text-green-500" },
  'Beta Tester': { icon: Wand2, color: "text-yellow-500" },
};


const users = [
    { name: "Admin General", email: "admin@mariachireyes.com", role: "Administrador General" as UserRole, avatar: "AG", status: "Active" },
    { name: "Director Musical", email: "director@mariachireyes.com", role: "Director Musical" as UserRole, avatar: "DM", status: "Active" },
    { name: "Coordinador de Eventos", email: "coordinador@mariachireyes.com", role: "Coordinador de Eventos" as UserRole, avatar: "CE", status: "Active" },
    { name: "Juan Pérez", email: "juan.perez@email.com", role: "Músico" as UserRole, avatar: "JP", status: "Active" },
    { name: "Sofía Gómez", email: "sofia.gomez@email.com", role: "Músico" as UserRole, avatar: "SG", status: "Suspended" },
    { name: "Contador Jefe", email: "contador@email.com", role: "Contador" as UserRole, avatar: "CJ", status: "Active" },
    { name: "Beta Tester", email: "tester@mariachireyes.com", role: "Beta Tester" as UserRole, avatar: "BT", status: "Active" },
];

export default function UsersPage() {
  const { user } = useUser();

  if (user.role !== 'Administrador General') {
      return (
          <div className="flex flex-col gap-6">
              <h1 className="font-headline text-3xl font-bold tracking-tight text-destructive">
                  Acceso Denegado
              </h1>
              <Card>
                  <CardHeader>
                      <CardTitle>No tienes permiso para ver esta página.</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p>Solo los administradores generales pueden gestionar usuarios. Por favor, contacta a un administrador si crees que esto es un error.</p>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Administrar Usuarios
        </h1>
        <Button>
            <PlusCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Invitar Usuario</span>
        </Button>
       </div>
      <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
          <CardDescription>
            Gestiona los miembros de tu banda y sus roles de acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const roleInfo = userRoleDetails[u.role];
                const RoleIcon = roleInfo?.icon || Music;
                const roleColor = roleInfo?.color || "text-foreground";
                
                return (
                  <TableRow key={u.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarFallback>{u.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-medium">{u.name}</span>
                              <span className="text-sm text-muted-foreground">{u.email}</span>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-2 w-fit">
                        <RoleIcon className={cn("h-4 w-4", roleColor)} />
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Badge variant={u.status === "Active" ? "secondary" : "destructive"} className={cn(u.status === 'Active' && 'text-green-600 border-green-300 bg-green-50')}>
                          {u.status}
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
                          <DropdownMenuItem>Editar Usuario</DropdownMenuItem>
                          <DropdownMenuItem>Restablecer Contraseña</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                           {u.status === 'Active' ? 'Suspender Usuario' : 'Activar Usuario'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Eliminar del Equipo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
