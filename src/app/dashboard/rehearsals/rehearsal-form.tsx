
"use client"

import { useFieldArray, useForm } from "react-hook-form"
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
import { useState, useMemo, useEffect } from "react"
import { Loader2, CalendarIcon, Clock, MapPin, Music, Link as LinkIcon, Trash2, KeyRound, PlusCircle, FileText } from "lucide-react"
import { createRehearsal, updateRehearsal, type RehearsalData } from "@/services/eventService"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { MUSICAL_KEYS } from "@/lib/constants"

const songSchema = z.object({
  name: z.string().min(2, { message: "El nombre es obligatorio." }),
  artist: z.string().optional(),
  key: z.string().optional(),
  youtubeUrl: z.string().url({ message: "URL de YouTube no válida." }).optional().or(z.literal("")),
  sheetMusicUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal("")),
});

const formSchema = z.object({
  date: z.string().min(1, { message: "La fecha es obligatoria." }),
  time: z.string().min(1, { message: "La hora es obligatoria." }),
  location: z.string().min(2, { message: "La ubicación es obligatoria." }),
  focus: z.string().min(3, { message: "El tema es obligatorio (mín. 3 caracteres)." }),
  songs: z.array(songSchema).optional(),
  notes: z.string().optional(),
})

type RehearsalInput = z.infer<typeof formSchema>;

interface RehearsalFormProps {
  initialData?: RehearsalData;
  rehearsalId?: string;
}

export function RehearsalForm({ initialData, rehearsalId }: RehearsalFormProps) {
  const { toast } = useToast()
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFromQuery = searchParams.get('date');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!rehearsalId;

  const form = useForm<RehearsalInput>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      date: dateFromQuery || "",
      time: "",
      location: "",
      focus: "",
      songs: [{ name: "", artist: "", key: "", youtubeUrl: "", sheetMusicUrl: "" }],
      notes: "",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        songs: initialData.songs && initialData.songs.length > 0 ? initialData.songs : [{ name: "", artist: "", key: "", youtubeUrl: "", sheetMusicUrl: "" }]
      });
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "songs",
  });

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

  async function onSubmit(values: RehearsalInput) {
    setIsSubmitting(true);
    try {
        let result;
        if (isEditMode && rehearsalId) {
            result = await updateRehearsal(rehearsalId, values);
            if (result.success) {
                toast({
                    title: "¡Ensayo Actualizado!",
                    description: "El ensayo ha sido actualizado exitosamente.",
                });
                router.push('/dashboard/rehearsals');
            }
        } else {
            result = await createRehearsal(values);
            if (result.success) {
                toast({
                    title: "¡Ensayo Programado!",
                    description: "El nuevo ensayo ha sido guardado exitosamente.",
                });
                router.push('/dashboard/rehearsals');
            }
        }

        if(!result.success) {
            toast({
                variant: "destructive",
                title: isEditMode ? "Error al actualizar" : "Error al programar ensayo",
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
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Detalles Generales del Ensayo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
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
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {timeOptions.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />Lugar</FormLabel>
                                        <FormControl><Input placeholder="Ej: Estudio A" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="focus"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Music className="h-4 w-4" />Tema General del Ensayo</FormLabel>
                                    <FormControl><Input placeholder="Ej: Repertorio Bodas, Nuevas Canciones Regionales" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Canciones a Ensayar</CardTitle>
                        <CardDescription>Añade las canciones que se practicarán en esta sesión.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                           <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                             <div className="flex justify-between items-center">
                               <p className="font-semibold">Canción #{index + 1}</p>
                               {fields.length > 1 && (
                                   <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                                       <Trash2 className="h-4 w-4" />
                                   </Button>
                               )}
                             </div>
                             <Separator/>
                             <FormField
                                control={form.control}
                                name={`songs.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Canción</FormLabel>
                                        <FormControl><Input placeholder="Ej: El Rey" {...field} value={field.value ?? ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`songs.${index}.artist`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Artista (Opcional)</FormLabel>
                                            <FormControl><Input placeholder="Ej: José Alfredo Jiménez" {...field} value={field.value ?? ""} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`songs.${index}.key`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4"/>Tono</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {MUSICAL_KEYS.map((k) => (<SelectItem key={k} value={k}>{k}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <FormField
                                control={form.control}
                                name={`songs.${index}.youtubeUrl`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4" />Enlace YouTube (Opcional)</FormLabel>
                                        <FormControl><Input type="url" placeholder="https://youtube.com/watch?v=..." {...field} value={field.value ?? ""} /></FormControl>
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
                                      id={`sheet-music-upload-${field.id}`}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      // onChange handler would be needed for a full implementation
                                    />
                                    <label htmlFor={`sheet-music-upload-${field.id}`} className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                                      <span className="text-muted-foreground">Ningún archivo seleccionado</span>
                                      <div className="px-3 py-1 bg-secondary text-secondary-foreground rounded-sm text-sm font-medium">Seleccionar archivo</div>
                                    </label>
                                  </div>
                                </FormControl>
                                <p className="text-xs text-muted-foreground">La subida de archivos se implementará en un paso futuro.</p>
                                <FormMessage />
                            </FormItem>
                           </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={() => append({ name: "", artist: "", key: "", youtubeUrl: "", sheetMusicUrl: "" })}>
                           <PlusCircle className="mr-2 h-4 w-4" /> Agregar Otra Canción
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader><CardTitle>Notas Adicionales</CardTitle></CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl><Textarea placeholder="Detalles generales, objetivos, etc." {...field} className="min-h-[200px]" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Guardar Ensayo")}
        </Button>
      </form>
    </Form>
  )
}
