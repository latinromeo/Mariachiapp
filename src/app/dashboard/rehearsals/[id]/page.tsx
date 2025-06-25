"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getRehearsalById, type RehearsalData, deleteRehearsal, completeRehearsal } from "@/services/eventService";
import { ArrowLeft, Calendar, Clock, Edit, FileText, ListMusic, MapPin, Music, StickyNote, Video, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function RehearsalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const rehearsalId = params.id as string;
    const [rehearsal, setRehearsal] = useState<RehearsalData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const { permissions } = useUser();
    const { toast } = useToast();

    const fetchRehearsalData = async () => {
        if (rehearsalId) {
            setIsLoading(true);
            const data = await getRehearsalById(rehearsalId);
            setRehearsal(data);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (rehearsalId) {
            fetchRehearsalData();
        }
    }, [rehearsalId]);

    const handleCompleteRehearsal = async () => {
        if (!rehearsal) return;
        setIsCompleting(true);
        const result = await completeRehearsal(rehearsal.id);
        if (result.success) {
            toast({ title: "Ensayo Completado", description: "El ensayo se ha marcado como completado." });
            fetchRehearsalData();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error || "No se pudo completar el ensayo." });
        }
        setIsCompleting(false);
    };

    const handleDeleteRehearsal = async () => {
        if (!rehearsal) return;
        setIsDeleting(true);
        const result = await deleteRehearsal(rehearsal.id);
        if (result.success) {
            toast({ title: "Ensayo Eliminado", description: "El ensayo ha sido eliminado correctamente." });
            router.push('/dashboard/rehearsals');
        } else {
            toast({ variant: "destructive", title: "Error al eliminar", description: result.error || "No se pudo eliminar el ensayo." });
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-20" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-40" /></CardContent></Card>
                </div>
            </div>
        )
    }

    if (!rehearsal) {
        return <div>Ensayo no encontrado.</div>
    }

    const rehearsalDate = parseISO(rehearsal.date);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
                    Detalles del Ensayo: {rehearsal.focus}
                </h1>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver Atrás
                </Button>
            </div>

            {rehearsal.status === 'completed' && (
                <Badge variant="secondary" className="w-fit text-lg py-1 px-4 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Ensayo Completado
                </Badge>
            )}

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/>Fecha y Lugar</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <p><strong>Día:</strong> <span className="capitalize">{format(rehearsalDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: es })}</span></p>
                             <p className="flex items-center gap-2"><strong>Hora:</strong> <Clock className="h-4 w-4"/> {rehearsal.time}</p>
                             <p className="flex items-center gap-2"><strong>Ubicación:</strong> <MapPin className="h-4 w-4"/> {rehearsal.location}</p>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ListMusic className="h-5 w-5 text-primary"/>Canciones a Ensayar</CardTitle>
                            {rehearsal.songs && rehearsal.songs.length > 0 ? (
                                <CardDescription>Lista de canciones para esta sesión de práctica.</CardDescription>
                            ) : null }
                        </CardHeader>
                         <CardContent className="space-y-3">
                            {rehearsal.songs && rehearsal.songs.length > 0 ? (
                                rehearsal.songs.map((song, index) => (
                                    <div key={index} className="p-3 bg-muted/50 rounded-md">
                                        <p className="font-semibold">{song.name} {song.key ? `(${song.key})` : ''}</p>
                                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            {song.youtubeUrl && (
                                                <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline text-sm flex items-center gap-1"><Video className="h-4 w-4"/>YouTube</a>
                                            )}
                                            {song.sheetMusicUrl && (
                                                <a href={song.sheetMusicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText className="h-4 w-4"/>Partitura</a>
                                            )}
                                            {song.audioUrl && (
                                                <audio controls src={song.audioUrl} className="h-8 max-w-xs">Tu navegador no soporta el audio.</audio>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay canciones listadas para este ensayo.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1 grid gap-6">
                     <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5 text-primary"/>Notas Adicionales</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p>{rehearsal.notes || "No hay notas adicionales para este ensayo."}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                {rehearsal.status !== 'completed' && permissions.canCreateRehearsals && (
                    <>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Ensayo
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará permanentemente este ensayo.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRehearsal} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sí, eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                         <Button variant="outline" onClick={handleCompleteRehearsal} disabled={isCompleting}>
                            {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Marcar Completo
                        </Button>

                        <Button asChild>
                            <Link href={`/dashboard/rehearsals/${rehearsalId}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Ensayo
                            </Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
