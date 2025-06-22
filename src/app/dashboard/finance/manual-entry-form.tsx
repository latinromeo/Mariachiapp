
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
import { Loader2, CalendarIcon, DollarSign, Edit } from "lucide-react"
import { createManualFinanceEntry } from "@/services/eventService"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FINANCE_CATEGORIES } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  type: z.enum(["income", "expense"], { required_error: "Debe seleccionar un tipo." }),
  description: z.string().min(3, { message: "La descripción es obligatoria (mín. 3 caracteres)." }),
  amount: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  date: z.string().min(1, { message: "La fecha es obligatoria." }),
  category: z.string().optional(),
})

interface ManualEntryFormProps {
  onSuccess?: () => void;
  defaultType?: 'income' | 'expense';
}

export function ManualEntryForm({ onSuccess, defaultType = "expense" }: ManualEntryFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType,
      description: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: "",
    },
  })
  
  useEffect(() => {
    form.reset({
        ...form.getValues(),
        type: defaultType,
        description: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: "",
    });
  }, [defaultType, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const result = await createManualFinanceEntry(values);
        if (result.success) {
            toast({
                title: "¡Asiento Creado!",
                description: "El nuevo asiento financiero ha sido guardado.",
            });
            form.reset();
            onSuccess?.();
        } else {
             toast({
                variant: "destructive",
                title: "Error al crear asiento",
                description: "Hubo un problema al guardar. Inténtalo de nuevo.",
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
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Tipo de Asiento</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="income" /></FormControl>
                            <FormLabel className="font-normal">Ingreso</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="expense" /></FormControl>
                            <FormLabel className="font-normal">Gasto</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Edit className="h-4 w-4" />Descripción</FormLabel>
                        <FormControl><Input placeholder="Ej: Compra de cuerdas" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Monto</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Fecha</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {FINANCE_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar Asiento"}
        </Button>
      </form>
    </Form>
  )
}
