
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
import { Loader2, Music, User, KeyRound, Star, GripVertical, Link } from "lucide-react"
import { createSong } from "@/services/eventService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SONG_CATEGORIES, EVENT_TYPES } from "@/lib/constants"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  title: z.string().min(2, { message: "El título es obligatorio." }),
  artist: z.string().optional(),
  category: z.string({ required_error: "Debe seleccionar una categoría." }),
  key: z.string().optional(),
  lyricsUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal("")),
  suggestedEvents: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

interface SongFormProps {
  onSuccess?: () => void;
}

export function SongForm({ onSuccess }: SongFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      artist: "",
      category: "",
      key: "",
      lyricsUrl: "",
      suggestedEvents: [],
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const result = await createSong(values);
        if (result.success) {
            toast({
                title: "¡Canción Guardada!",
                description: "La nueva canción ha sido añadida al repertorio.",
            });
            form.reset();
            onSuccess?.();
        } else {
             toast({
                variant: "destructive",
                title: "Error al guardar la canción",
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
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Music className="h-4 w-4" />Título de la Canción</FormLabel>
                        <FormControl><Input placeholder="Ej: El Rey" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Artista (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Ej: José Alfredo Jiménez" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lyricsUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Link className="h-4 w-4" />Enlace a Partitura/Letra (Opcional)</FormLabel>
                        <FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><GripVertical className="h-4 w-4" />Categoría</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {SONG_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Tono (Opcional)</FormLabel>
                            <FormControl><Input placeholder="Ej: G, Am, C#m" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="suggestedEvents"
                render={() => (
                    <FormItem>
                         <div className="mb-4">
                            <FormLabel className="flex items-center gap-2 text-base"><Star className="h-4 w-4" />Eventos Sugeridos (Opcional)</FormLabel>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                        {EVENT_TYPES.map((item) => (
                            <FormField
                            key={item.value}
                            control={form.control}
                            name="suggestedEvents"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={item.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.value)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item.value])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.value
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {item.label}
                                    </FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        </div>
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
                        <FormControl><Textarea placeholder="Detalles de arreglos, intros, etc." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar Canción"}
        </Button>
      </form>
    </Form>
  )
}
