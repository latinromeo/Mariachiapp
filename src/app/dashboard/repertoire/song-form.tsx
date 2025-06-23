
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Loader2, Music, User, KeyRound, Link, FileText, Plus, Type, StickyNote, Trash2 } from "lucide-react"
import { createSong, updateSong, deleteSong, type SongDetail } from "@/services/eventService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SONG_CATEGORIES, MUSICAL_KEYS } from "@/lib/constants"
import { DialogFooter } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const formSchema = z.object({
  title: z.string().min(2, { message: "El título es obligatorio." }),
  artist: z.string().optional(),
  youtubeUrl: z.string().url({ message: "Debe ser una URL de YouTube válida." }).optional().or(z.literal("")),
  sheetMusicUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal("")),
  audioUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal("")),
  category: z.string({ required_error: "Debe seleccionar una categoría." }),
  key: z.string().optional(),
  lyrics: z.string().optional(),
  notes: z.string().optional(),
})

interface SongFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: SongDetail | null;
}

export function SongForm({ onSuccess, onCancel, initialData }: SongFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sheetMusicFileName, setSheetMusicFileName] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const isEditMode = !!initialData?.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      artist: "",
      youtubeUrl: "",
      sheetMusicUrl: "",
      audioUrl: "",
      category: "",
      key: "",
      lyrics: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        title: "",
        artist: "",
        youtubeUrl: "",
        sheetMusicUrl: "",
        audioUrl: "",
        category: "",
        key: "",
        lyrics: "",
        notes: "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const submissionValues = {...values};
    if (submissionValues.audioUrl?.startsWith('blob:')) {
      submissionValues.audioUrl = initialData?.audioUrl || '';
    }

    try {
        let result;
        if (isEditMode && initialData.id) {
            result = await updateSong(initialData.id, submissionValues);
            if (result.success) {
                toast({
                    title: "¡Canción Actualizada!",
                    description: "Los cambios se han guardado exitosamente.",
                });
            }
        } else {
            result = await createSong(submissionValues);
            if (result.success) {
                toast({
                    title: "¡Canción Guardada!",
                    description: "La nueva canción ha sido añadida al repertorio.",
                });
            }
        }
        
        if (result.success) {
            form.reset();
            onSuccess?.();
        } else {
             toast({
                variant: "destructive",
                title: `Error al ${isEditMode ? 'actualizar' : 'guardar'} la canción`,
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

  async function handleDelete() {
    if (!initialData?.id) return;
    setIsDeleting(true);
    try {
        const result = await deleteSong(initialData.id);
        if (result.success) {
            toast({
                title: "¡Canción Eliminada!",
                description: "La canción ha sido eliminada del repertorio.",
            });
            onSuccess?.();
        } else {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: result.error || "No se pudo eliminar la canción.",
            });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Error de Red", description: "No se pudo conectar con el servidor." });
        console.error(error);
    } finally {
        setIsDeleting(false);
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
                      accept=".pdf,image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setSheetMusicFileName(e.target.files?.[0]?.name || "")}
                    />
                    <label htmlFor="sheet-music-upload" className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{sheetMusicFileName || "Ningún archivo seleccionado"}</span>
                      <div className="px-3 py-1 bg-secondary text-secondary-foreground rounded-sm text-sm font-medium">Seleccionar archivo</div>
                    </label>
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground">Nota: La subida de archivos a la nube no está implementada. Esto es solo para diseño visual.</p>
                <FormMessage />
            </FormItem>
            
             <FormItem>
                <FormLabel className="flex items-center gap-2"><Music className="h-4 w-4" />Audio de Referencia (MP3, WAV, etc.)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="file" 
                      id="audio-upload"
                      accept="audio/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                          setAudioFileName(file.name);
                          form.setValue('audioUrl', URL.createObjectURL(file));
                        } else {
                          setAudioFileName("");
                           form.setValue('audioUrl', '');
                        }
                      }}
                    />
                    <label htmlFor="audio-upload" className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{audioFileName || "Ningún archivo seleccionado"}</span>
                      <div className="px-3 py-1 bg-secondary text-secondary-foreground rounded-sm text-sm font-medium">Seleccionar audio</div>
                    </label>
                  </div>
                </FormControl>
                {form.watch('audioUrl')?.startsWith('blob:') && (
                  <div className="mt-2">
                    <audio controls src={form.watch('audioUrl')} className="w-full h-10">
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  </div>
                )}
                 <p className="text-xs text-muted-foreground">El audio es para vista previa local y no se guardará en la nube.</p>
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
        <DialogFooter className="pt-4 flex justify-between w-full">
            <div>
             {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isSubmitting || isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la canción "{initialData?.title}" del repertorio.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            </div>
            <div className="flex gap-2">
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Music className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Guardar Canción")}
                </Button>
            </div>
        </DialogFooter>
      </form>
    </Form>
  )
}
