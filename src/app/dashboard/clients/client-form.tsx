
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
import { useState, useEffect } from "react"
import { Loader2, Mail, MapPin, Phone, User, Hash } from "lucide-react"
import { createClient, updateClient, type ClientData } from "@/services/eventService"

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre es obligatorio (mín. 3 caracteres)." }),
  phone: z.string().min(10, { message: "El teléfono debe tener al menos 10 dígitos." }).regex(/^\d+$/, "El teléfono solo debe contener números."),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal("")),
  address: z.string().optional(),
  sector: z.string().optional(),
  notes: z.string().optional(),
})

type ClientInput = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSuccess?: () => void;
  initialData?: ClientData;
  clientId?: string;
}

export function ClientForm({ onSuccess, initialData, clientId }: ClientFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!clientId;

  const form = useForm<ClientInput>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      email: "",
      address: "",
      sector: "",
      notes: "",
    },
  })
  
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);


  async function onSubmit(values: ClientInput) {
    setIsSubmitting(true);
    try {
        let result;
        if (isEditMode && clientId) {
            result = await updateClient(clientId, values);
            if (result.success) {
                toast({
                    title: "¡Cliente Actualizado!",
                    description: "Los datos del cliente se han guardado exitosamente.",
                });
            }
        } else {
            result = await createClient(values);
            if (result.success) {
                toast({
                    title: "¡Cliente Creado!",
                    description: "El nuevo cliente ha sido guardado exitosamente.",
                });
                form.reset({
                  name: "",
                  phone: "",
                  email: "",
                  address: "",
                  sector: "",
                  notes: "",
                });
            }
        }

        if(result.success) {
          onSuccess?.();
        } else {
             toast({
                variant: "destructive",
                title: isEditMode ? "Error al actualizar" : "Error al crear cliente",
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
                        <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" />Sector (Opcional)</FormLabel>
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
            {isSubmitting ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Guardar Cliente")}
        </Button>
      </form>
    </Form>
  )
}
