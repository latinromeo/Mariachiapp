
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Calendar,
  LayoutGrid,
  Music,
  Image,
  Users,
  BookOpen,
  DollarSign,
  UserCog,
  UserCircle2,
  LogOut,
  Moon,
  Bot,
  Menu,
  Receipt,
} from "lucide-react"
import { useState, type ReactNode } from "react"

import {
  SidebarProvider,
  Sidebar,
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
import { cn } from "@/lib/utils"
import { useUser, USERS, UserContext, ROLES_CONFIG, type User } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AssistantChat } from "./assistant-chat"

function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(USERS.admin);

    const permissions = {
        hasAccess: (page: string): boolean => {
            const roleConfig = ROLES_CONFIG[user.role];
            return roleConfig?.pages.includes(page) ?? false;
        },
        ...ROLES_CONFIG[user.role]
    };

    return (
        <UserContext.Provider value={{ user, setUser, permissions }}>
            {children}
        </UserContext.Provider>
    );
}

function UserSwitcher() {
    const { user, setUser } = useUser();
    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="user-switcher" className="text-sm font-medium whitespace-nowrap">Ver como:</Label>
            <Select value={user.id} onValueChange={(userId) => setUser(USERS[userId])}>
                <SelectTrigger id="user-switcher" className="w-[180px]">
                    <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                    {Object.values(USERS).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}


function BottomNav() {
    const pathname = usePathname();
    const { user, permissions } = useUser();

    let navItems;

    if (user.role === 'Músico') {
        navItems = [
            { href: '/dashboard', icon: LayoutGrid, label: 'Panel' },
            { href: '/dashboard/events', icon: Calendar, label: 'Calendario' },
            { href: '/dashboard/rehearsals', icon: Music, label: 'Ensayos' },
            { href: '/dashboard/my-income', icon: DollarSign, label: 'Finanzas' },
        ];
    } else {
        navItems = [
            { href: '/dashboard', icon: LayoutGrid, label: 'Panel' },
            { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
            { href: '/dashboard/events', icon: Calendar, label: 'Calendario' },
            { href: '/dashboard/finance', icon: DollarSign, label: 'Finanzas' },
            { href: '/dashboard/invoices', icon: Receipt, label: 'Facturas' },
        ];
    }

    const visibleNavItems = navItems.filter(item => permissions.hasAccess(item.href));
    
    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === path;
        return pathname.startsWith(path);
    }

    return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex h-16 items-center justify-around">
        {visibleNavItems.map((item) => (
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

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter();
  const { user, permissions } = useUser();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = () => {
    router.push('/login');
  };

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }

  return (
    <>
      <Sidebar>
        <SidebarContent className="p-0 flex flex-col pt-4">
          <div>
            <SidebarMenu className="px-4">
              <SidebarGroup>
                  <SidebarGroupLabel>PRINCIPAL</SidebarGroupLabel>
                  {permissions.hasAccess("/dashboard") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                            <Link href="/dashboard">
                                <LayoutGrid />
                                <span>Panel Principal</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.hasAccess("/dashboard/clients") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/clients")}>
                            <Link href="/dashboard/clients">
                                <Users />
                                <span>Clientes</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
              </SidebarGroup>

              <SidebarGroup>
                  <SidebarGroupLabel>GESTIÓN</SidebarGroupLabel>
                  {permissions.hasAccess("/dashboard/events") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/events")}>
                            <Link href="/dashboard/events">
                                <Calendar />
                                <span>Calendario Eventos</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.hasAccess("/dashboard/rehearsals") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/rehearsals")}>
                            <Link href="/dashboard/rehearsals">
                                <Music />
                                <span>Ensayos</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
              </SidebarGroup>
              
              <SidebarGroup>
                  <SidebarGroupLabel>RECURSOS</SidebarGroupLabel>
                  {permissions.hasAccess("/dashboard/repertoire") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/repertoire")}>
                            <Link href="/dashboard/repertoire">
                                <BookOpen />
                                <span>Repertorio</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.hasAccess("/dashboard/media") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/media")}>
                            <Link href="/dashboard/media">
                                <Image />
                                <span>Multimedia</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
              </SidebarGroup>
              
                <SidebarGroup>
                  <SidebarGroupLabel>ADMINISTRACIÓN</SidebarGroupLabel>
                  {permissions.hasAccess("/dashboard/invoices") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/invoices")}>
                            <Link href="/dashboard/invoices">
                                <Receipt />
                                <span>Facturas de Gastos</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.hasAccess("/dashboard/finance") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/finance")}>
                            <Link href="/dashboard/finance">
                                <DollarSign />
                                <span>Finanzas (Admin)</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.hasAccess("/dashboard/my-income") && (
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/my-income")}>
                            <Link href="/dashboard/my-income">
                                <DollarSign />
                                <span>Mis Ingresos</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.hasAccess("/dashboard/users") && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/dashboard/users")}>
                            <Link href="/dashboard/users">
                                <UserCog />
                                <span>Administrar Usuarios</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
              </SidebarGroup>
            </SidebarMenu>
          </div>
          
          <div className="mt-auto">
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
                      <SidebarMenuButton onClick={handleLogout}>
                          <LogOut />
                          <span>Cerrar Sesión</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarGroup>
            </SidebarMenu>
            <div className="text-center text-sm font-semibold p-4 pt-2">
              <p>{user.name}</p>
            </div>
             <div className="text-center text-xs text-muted-foreground p-4 pt-0">
                  © 2025 Mariachi Reyes
              </div>
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
           <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Logo />
          </div>
          <UserSwitcher />
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
      </SidebarInset>
       <BottomNav />
       {user.role === 'Administrador General' && (
         <>
            <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
              {!isChatOpen && (
                <Button
                  size="lg"
                  className="group rounded-full h-16 w-16 shadow-2xl bg-gradient-to-br from-primary to-blue-700 text-white transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/50"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Bot className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="sr-only">Abrir Asistente AI</span>
                </Button>
              )}
            </div>
            <AssistantChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
         </>
       )}
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <UserProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </UserProvider>
    </SidebarProvider>
  )
}
