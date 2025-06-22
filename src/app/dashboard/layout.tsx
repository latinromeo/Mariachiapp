
"use client"

import Link from "next/link"
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
  Moon,
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
import { cn } from "@/lib/utils"

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

function BottomNav() {
    const pathname = usePathname();

    const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Panel' },
    { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
    { href: '/dashboard/events', icon: Calendar, label: 'Calendario' },
    { href: '/dashboard/finance', icon: DollarSign, label: 'Finanzas' },
    { href: '/dashboard/profile', icon: UserCircle2, label: 'Perfil' },
    ];
    
    const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path);
    }

    return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
            <Link
            key={item.href}
            href={item.href}
            className={cn(
                "flex flex-col items-center justify-center gap-1 w-full text-sm text-muted-foreground transition-colors",
                isActive(item.href) ? "text-primary font-semibold" : "hover:text-primary"
            )}
            >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
            </Link>
        ))}
        </div>
    </nav>
    );
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
                    <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                        <Link href="/dashboard">
                            <LayoutGrid />
                            <span>Panel Principal</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/clients")}>
                        <Link href="/dashboard/clients">
                            <Users />
                            <span>Clientes</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>GESTIÓN</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/events")}>
                        <Link href="/dashboard/events">
                            <Calendar />
                            <span>Calendario Eventos</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/rehearsals")}>
                        <Link href="/dashboard/rehearsals">
                            <Music />
                            <span>Ensayos</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
            
            <SidebarGroup>
                <SidebarGroupLabel>RECURSOS</SidebarGroupLabel>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/repertoire")}>
                        <Link href="/dashboard/repertoire">
                            <Library />
                            <span>Repertorio</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/media")}>
                        <Link href="/dashboard/media">
                            <Image />
                            <span>Multimedia</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
            
             <SidebarGroup>
                <SidebarGroupLabel>ADMINISTRACIÓN</SidebarGroupLabel>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/finance")}>
                        <Link href="/dashboard/finance">
                            <DollarSign />
                            <span>Finanzas (Admin)</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/users")}>
                        <Link href="/dashboard/users">
                            <UserCog />
                            <span>Administrar Usuarios</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
          
          <SidebarSeparator className="mx-4 my-2" />

          <SidebarMenu className="px-4">
             <SidebarGroup>
                <SidebarGroupLabel>CUENTA</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/profile")}>
                        <Link href="/dashboard/profile">
                            <UserCircle2 />
                            <span>Mi Perfil</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton>
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
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
           <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">Mariachi Manager</h1>
          </div>
           <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Moon className="h-4 w-4" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">MA</AvatarFallback>
                </Avatar>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
      </SidebarInset>
       <BottomNav />
    </SidebarProvider>
  )
}
