
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, Mail, MapPin, Phone, User, Hash } from "lucide-react"
import { createClient } from "@/services/eventService"

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre es obligatorio (mín. 3 caracteres)." }),
  phone: z.string().min(10, { message: "El teléfono debe tener al menos 10 dígitos." }).regex(/^\d+$/, "El teléfono solo debe contener números."),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal("")),
  address: z.string().optional(),
  sector: z.string().optional(),
  notes: z.string().optional(),
})

interface ClientFormProps {
  onSuccess?: () => void;
}

export function ClientForm({ onSuccess }: ClientFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      sector: "",
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const result = await createClient(values);
        if (result.success) {
            toast({
                title: "¡Cliente Creado!",
                description: "El nuevo cliente ha sido guardado exitosamente.",
            });
            form.reset();
            onSuccess?.();
        } else {
             toast({
                variant: "destructive",
                title: "Error al crear cliente",
                description: result.error || "Hubo un problema al guardar. Inténtalo de nuevo.",
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error de Red",
            description: "No se pudo conectar con el servidor.",
        });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Ej: Carlos Ramírez" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" />Teléfono</FormLabel>
                        <FormControl><Input type="tel" placeholder="Ej: 5551234567" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" />Email (Opcional)</FormLabel>
                        <FormControl><Input type="email" placeholder="Ej: cliente@email.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" />Sector / Colonia (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Ej: Polanco" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />Dirección (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Ej: Av. Siempre Viva 123" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                        <FormControl><Textarea placeholder="Preferencias del cliente, historial, etc." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar Cliente"}
        </Button>
      </form>
    </Form>
  )
}
