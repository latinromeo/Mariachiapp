"use client"

import { Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // For now, just redirect to the dashboard
        router.push('/dashboard');
    }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4 pt-8">
            <div className="flex justify-center">
                <Logo />
            </div>
            <CardTitle className="text-3xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu panel de Mariachi Manager.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="username" placeholder="Tu nombre de usuario" required className="pl-10" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Tu contraseña" required className="pl-10" />
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
                <Button className="w-full" type="submit">Acceder</Button>
                <p className="text-xs text-muted-foreground">© 2025 Mariachi Reyes Manager. Todos los derechos reservados.</p>
            </CardFooter>
        </form>
      </Card>
    </div>
  )
}
