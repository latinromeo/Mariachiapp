
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
import { MoreHorizontal, PlusCircle, Shield, Music, BarChart3, UserCog } from "lucide-react";
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

const userRoles = {
  Admin: { icon: Shield, color: "text-destructive" },
  Assistant: { icon: UserCog, color: "text-blue-500" },
  Accountant: { icon: BarChart3, color: "text-green-500" },
  Musician: { icon: Music, color: "text-orange-500" },
};

type UserRole = keyof typeof userRoles;

const users = [
    { name: "Administrador", email: "admin@mariachireyes.com", role: "Admin" as UserRole, avatar: "AD", status: "Active" },
    { name: "Asistente General", email: "asistente@email.com", role: "Assistant" as UserRole, avatar: "AG", status: "Active" },
    { name: "Contador Jefe", email: "contador@email.com", role: "Accountant" as UserRole, avatar: "CJ", status: "Active" },
    { name: "Juan Pérez", email: "juan.perez@email.com", role: "Musician" as UserRole, avatar: "JP", status: "Active" },
    { name: "Sofía Gómez", email: "sofia.gomez@email.com", role: "Musician" as UserRole, avatar: "SG", status: "Suspended" },
    { name: "Miguel Hernández", email: "miguel.h@email.com", role: "Musician" as UserRole, avatar: "MH", status: "Active" },
];

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Administrar Usuarios
        </h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Invitar Usuario
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
              {users.map((user) => {
                const RoleIcon = userRoles[user.role]?.icon || Music;
                const roleColor = userRoles[user.role]?.color || "text-foreground";
                
                return (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarFallback>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-2 w-fit">
                        <RoleIcon className={cn("h-4 w-4", roleColor)} />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Badge variant={user.status === "Active" ? "secondary" : "destructive"} className={cn(user.status === 'Active' && 'text-green-600 border-green-300 bg-green-50')}>
                          {user.status}
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
                           {user.status === 'Active' ? 'Suspender Usuario' : 'Activar Usuario'}
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
