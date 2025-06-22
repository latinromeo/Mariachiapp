
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
import { Loader2, Music, User, KeyRound, Link, FileText, Plus, Type, StickyNote } from "lucide-react"
import { createSong } from "@/services/eventService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SONG_CATEGORIES, MUSICAL_KEYS } from "@/lib/constants"
import { DialogFooter } from "@/components/ui/dialog"

const formSchema = z.object({
  title: z.string().min(2, { message: "El título es obligatorio." }),
  artist: z.string().optional(),
  youtubeUrl: z.string().url({ message: "Debe ser una URL de YouTube válida." }).optional().or(z.literal("")),
  sheetMusicUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal("")),
  category: z.string({ required_error: "Debe seleccionar una categoría." }),
  key: z.string().optional(),
  lyrics: z.string().optional(),
  notes: z.string().optional(),
})

interface SongFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SongForm({ onSuccess, onCancel }: SongFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      artist: "",
      youtubeUrl: "",
      sheetMusicUrl: "",
      category: "",
      key: "",
      lyrics: "",
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Note: File upload logic is not implemented here. 
    // This form currently only saves the URLs and text data.
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Music className="h-4 w-4" />Título de la Canción *</FormLabel>
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
                        <FormControl><Input placeholder="Ej: José Alfredo Jiménez" {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Link className="h-4 w-4" />Enlace de YouTube (Opcional)</FormLabel>
                        <FormControl><Input type="url" placeholder="https://www.youtube.com/watch?v=..." {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormItem>
                <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" />Partitura (PDF/Imagen, Opcional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="file" 
                      id="sheet-music-upload" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                    />
                    <label htmlFor="sheet-music-upload" className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{fileName || "Ningún archivo seleccionado"}</span>
                      <div className="px-3 py-1 bg-secondary text-secondary-foreground rounded-sm text-sm font-medium">Seleccionar archivo</div>
                    </label>
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground">La subida de archivos se implementará en un paso futuro.</p>
                <FormMessage />
            </FormItem>
            
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Tono</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {MUSICAL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Plus className="h-4 w-4" />Categoría *</FormLabel>
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
            </div>
             <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Type className="h-4 w-4" />Letra (Opcional)</FormLabel>
                        <FormControl><Textarea placeholder="Escriba la letra de la canción aquí..." {...field} value={field.value ?? ""} className="min-h-[100px]" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><StickyNote className="h-4 w-4" />Notas Adicionales (Opcional)</FormLabel>
                        <FormControl><Textarea placeholder="Tonalidad, arreglos, observaciones..." {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <DialogFooter className="pt-4">
             {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
             <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Music className="mr-2 h-4 w-4" />
                {isSubmitting ? "Guardando..." : "Guardar Canción"}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
