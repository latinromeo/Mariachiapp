
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
import { useState, useMemo } from "react"
import { Loader2, CalendarIcon, Clock, MapPin, Music } from "lucide-react"
import { createRehearsal } from "@/services/eventService"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  date: z.string().min(1, { message: "La fecha es obligatoria." }),
  time: z.string().min(1, { message: "La hora es obligatoria." }),
  location: z.string().min(2, { message: "La ubicación es obligatoria." }),
  focus: z.string().min(3, { message: "El enfoque es obligatorio." }),
  notes: z.string().optional(),
})

export function RehearsalForm() {
  const { toast } = useToast()
  const searchParams = useSearchParams();
  const dateFromQuery = searchParams.get('date');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: dateFromQuery || "",
      time: "",
      location: "",
      focus: "",
      notes: "",
    },
  })

  const timeOptions = useMemo(() => {
    const options = [];
    for (let i = 8; i < 22; i++) { // From 8 AM to 9 PM
      for (let j = 0; j < 2; j++) {
        const hour = i;
        const minute = j * 30;
        const date = new Date();
        date.setHours(hour, minute);
        const formattedHour = (date.getHours() % 12) || 12;
        const formattedMinute = date.getMinutes().toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        options.push(`${formattedHour}:${formattedMinute} ${ampm}`);
      }
    }
    return options;
  }, []);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const result = await createRehearsal(values);
        if (result.success) {
            toast({
                title: "¡Ensayo Programado!",
                description: "El nuevo ensayo ha sido guardado exitosamente.",
            });
            form.reset();
        } else {
             toast({
                variant: "destructive",
                title: "Error al programar ensayo",
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
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Detalles del Ensayo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
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
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4"/>Hora</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar hora..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {timeOptions.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />Lugar del Ensayo</FormLabel>
                            <FormControl><Input placeholder="Ej: Estudio de Música A" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="focus"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Music className="h-4 w-4" />Enfoque Principal</FormLabel>
                            <FormControl><Input placeholder="Ej: Nuevo setlist para bodas" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas Adicionales</FormLabel>
                            <FormControl><Textarea placeholder="Traer partituras nuevas, repasar armonías, etc." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
        <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Programar Ensayo"}
        </Button>
      </form>
    </Form>
  )
}
