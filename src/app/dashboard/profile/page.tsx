
"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Mi Perfil
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Información de la Cuenta</CardTitle>
                    <CardDescription>Actualiza los detalles de tu perfil y tu información de contacto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 border">
                            <AvatarFallback className="text-4xl font-bold bg-muted text-muted-foreground">AD</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                             <h2 className="text-xl font-semibold">Administrador</h2>
                             <Badge variant="outline" className="border-primary/50 text-primary font-medium">Administrador General</Badge>
                        </div>
                    </div>

                    <form className="grid gap-6 max-w-2xl">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input id="name" defaultValue="Administrador" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="admin@mariachireyes.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">Contraseña Actual</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                            <Input id="new-password" type="password" />
                        </div>
                         <div>
                            <Button>Guardar Cambios</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
