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
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, DollarSign, Edit } from "lucide-react"
import { createMusicianExpense } from "@/services/eventService"
import { MUSICIAN_EXPENSE_CATEGORIES } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/lib/auth"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  description: z.string().min(3, { message: "La descripción es obligatoria." }),
  category: z.string({ required_error: "Debe seleccionar una categoría." }),
  amount: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
})

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { toast } = useToast()
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
    },
  })
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const valuesWithDate = {
            ...values,
            date: new Date().toISOString().split('T')[0]
        };
        const result = await createMusicianExpense(user.id, valuesWithDate);

        if (result.success) {
            toast({
                title: "¡Egreso Registrado!",
                description: "El nuevo gasto ha sido guardado exitosamente.",
            });
            form.reset();
            onSuccess?.();
        } else {
             toast({
                variant: "destructive",
                title: "Error al registrar egreso",
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
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categoría</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {MUSICIAN_EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Edit className="h-4 w-4 text-muted-foreground" />Descripción</FormLabel>
                        <FormControl><Textarea placeholder="Ej: Compra de cuerdas de guitarra, almuerzo, etc." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />Monto</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <p className="text-xs text-center text-muted-foreground">El gasto se registrará con la fecha de hoy.</p>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar Gasto"}
        </Button>
      </form>
    </Form>
  )
}
