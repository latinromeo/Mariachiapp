"use client"

import { usePathname } from "next/navigation"
import {
  Calendar,
  LayoutDashboard,
  Music,
  FileAudio,
  PlusCircle,
  Users,
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="p-2">
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard"
                isActive={isActive("/dashboard")}
                tooltip="Dashboard"
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/events"
                isActive={isActive("/dashboard/events")}
                tooltip="Events"
              >
                <Calendar />
                <span>Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/rehearsals"
                isActive={isActive("/dashboard/rehearsals")}
                tooltip="Rehearsals"
              >
                <Users />
                <span>Rehearsals</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/repertoire"
                isActive={isActive("/dashboard/repertoire")}
                tooltip="Repertoire"
              >
                <Music />
                <span>Repertoire</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/media"
                isActive={isActive("/dashboard/media")}
                tooltip="Media"
              >
                <FileAudio />
                <span>Media</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
             <SidebarMenuItem>
                <Button asChild className="w-full justify-start">
                  <a href="/dashboard/events/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Event
                  </a>
                </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            {/* Can add search or other header elements here */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
