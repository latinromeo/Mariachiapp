"use client"

import { usePathname } from "next/navigation"
import {
  Calendar,
  LayoutGrid,
  Music,
  Image,
  Users,
  Library,
  DollarSign,
  UserCog,
  UserCircle2,
  LogOut,
  PlusCircle,
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

function SidebarUserProfile() {
    return (
        <div className="flex flex-col items-center text-center p-4 gap-2">
            <Avatar className="h-16 w-16 border">
                <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
                <p className="font-semibold text-sm capitalize">administrador</p>
                <Badge variant="outline" className="border-primary/50 text-primary font-medium">Administrador General</Badge>
            </div>
        </div>
    )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="p-0">
          <SidebarHeader className="p-2 pt-4">
            <Logo />
          </SidebarHeader>
          <SidebarUserProfile />
          <SidebarSeparator className="mx-4 my-2" />
          <SidebarMenu className="flex-1 px-4">
            <SidebarGroup>
                <SidebarGroupLabel>PRINCIPAL</SidebarGroupLabel>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard" isActive={isActive("/dashboard")}>
                        <LayoutGrid />
                        <span>Panel Principal</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/clients" isActive={isActive("/dashboard/clients")}>
                        <Users />
                        <span>Clientes</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>GESTIÓN</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/events" isActive={isActive("/dashboard/events")}>
                        <Calendar />
                        <span>Calendario Eventos</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/rehearsals" isActive={isActive("/dashboard/rehearsals")}>
                        <Music />
                        <span>Ensayos</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
            
            <SidebarGroup>
                <SidebarGroupLabel>RECURSOS</SidebarGroupLabel>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/repertoire" isActive={isActive("/dashboard/repertoire")}>
                        <Library />
                        <span>Repertorio</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/media" isActive={isActive("/dashboard/media")}>
                        <Image />
                        <span>Multimedia</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
            
             <SidebarGroup>
                <SidebarGroupLabel>ADMINISTRACIÓN</SidebarGroupLabel>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/finance" isActive={isActive("/dashboard/finance")}>
                        <DollarSign />
                        <span>Finanzas (Admin)</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/users" isActive={isActive("/dashboard/users")}>
                        <UserCog />
                        <span>Administrar Usuarios</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
          
          <SidebarSeparator className="mx-4 my-2" />

          <SidebarMenu className="px-4">
             <SidebarGroup>
                <SidebarGroupLabel>CUENTA</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/profile" isActive={isActive("/dashboard/profile")}>
                        <UserCircle2 />
                        <span>Mi Perfil</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="#">
                        <LogOut />
                        <span>Cerrar Sesión</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
           <div className="text-center text-xs text-muted-foreground p-4 mt-4">
                © 2025 Mariachi Reyes
            </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
           <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
          </div>
          <Button asChild>
            <a href="/dashboard/events/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Evento
            </a>
          </Button>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
