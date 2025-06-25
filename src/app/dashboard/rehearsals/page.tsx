
"use client"

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { type RehearsalData, getRehearsals, deleteRehearsal, completeRehearsal } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    Calendar, 
    Edit, 
    Loader2, 
    PlusCircle, 
    Search, 
    Trash2,
    Video,
    CheckCircle,
    Music,
    FileText
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatTime } from "@/lib/utils";
import { useUser } from "@/lib/auth";

export default function RehearsalsPage() {
  const [allRehearsals, setAllRehearsals] = useState<RehearsalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rehearsalToDelete, setRehearsalToDelete] = useState<RehearsalData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { permissions } = useUser();

  const fetchRehearsals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRehearsals();
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllRehearsals(data);
    } catch (error) {
      console.error("Failed to fetch rehearsals", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRehearsals();
    window.addEventListener('agendaUpdated', fetchRehearsals);
    return () => {
      window.removeEventListener('agendaUpdated', fetchRehearsals);
    };
  }, [fetchRehearsals]);

  const filteredRehearsals = useMemo(() => {
    if (!searchTerm) {
      return allRehearsals;
    }
    return allRehearsals.filter(
      (rehearsal) =>
        rehearsal.focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rehearsal.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRehearsals, searchTerm]);

  const handleDeleteRehearsal = async () => {
    if (!rehearsalToDelete) return;

    setIsDeleting(true);
    const result = await deleteRehearsal(rehearsalToDelete.id);
    if (result.success) {
      toast({
        title: "Ensayo Eliminado",
        description: `El ensayo ha sido eliminado correctamente.`,
      });
      fetchRehearsals();
    } else {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: result.error || "No se pudo eliminar el ensayo.",
      });
    }
    setIsDeleting(false);
    setRehearsalToDelete(null);
  };
  
  const handleCompleteRehearsal = async (rehearsalId: string) => {
    setIsCompleting(rehearsalId);
    const result = await completeRehearsal(rehearsalId);
    if (result.success) {
      toast({
        title: "¡Ensayo Completado!",
        description: "El ensayo se ha marcado como completado.",
      });
      fetchRehearsals();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "No se pudo completar el ensayo.",
      });
    }
    setIsCompleting(null);
  };

  const parseDate = (dateString: string) => {
    try {
      return parseISO(dateString);
    } catch (e) {
      const parts = dateString.split('T')[0].split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Ensayos
        </h1>
        {permissions.canCreateRehearsals && (
            <Button asChild>
                <Link href="/dashboard/rehearsals/new">
                    <PlusCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Programar Ensayo</span>
                </Link>
            </Button>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por tema o lugar..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-20" /></div>
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <Separator/>
                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </Card>
            ))
        ) : filteredRehearsals.length > 0 ? (
            filteredRehearsals.map((rehearsal) => {
                const date = parseDate(rehearsal.date);
                const formattedDateTime = format(date, "EEE, d MMM", { locale: es }) + `, ${formatTime(rehearsal.time)}`;
                const songCount = rehearsal.songs?.length || 0;

                return (
                    <Card key={rehearsal.id} className={cn(rehearsal.status === 'completed' && "bg-green-50/60 dark:bg-green-950/30 border-green-200 dark:border-green-800/50")}>
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold text-primary capitalize">{rehearsal.focus}</h2>
                                    <p className="text-sm text-muted-foreground">{songCount} canci&oacute;n/{songCount !== 1 ? 'es' : ''}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="capitalize">{formattedDateTime}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Canciones:</h3>
                                {songCount > 0 && rehearsal.songs ? (
                                    <div className="space-y-2">
                                        {rehearsal.songs.map((song, i) => (
                                            <div key={i} className="bg-muted/50 p-3 rounded-md">
                                                <p className="font-semibold">{song.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {song.artist && `Artista: ${song.artist}`}
                                                    {song.artist && song.key && ' · '}
                                                    {song.key && `Tono: ${song.key}`}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                    {song.youtubeUrl && (
                                                        <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-600 hover:underline text-sm">
                                                            <Video className="h-4 w-4" /> YouTube
                                                        </a>
                                                    )}
                                                     {song.sheetMusicUrl && (
                                                        <a href={song.sheetMusicUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary text-sm flex items-center gap-1" title="Ver Partitura">
                                                            <FileText className="h-4 w-4" /> Partitura
                                                        </a>
                                                    )}
                                                    {song.audioUrl && (
                                                        <div className="flex items-center gap-1 text-sm">
                                                             <Music className="h-4 w-4 text-primary" />
                                                             <audio controls src={song.audioUrl} className="h-8 w-full max-w-xs">
                                                                Tu navegador no soporta el audio.
                                                             </audio>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hay canciones listadas para este ensayo.</p>
                                )}
                            </div>
                             <Separator />
                             <div className="flex justify-between items-center">
                                {rehearsal.status === 'completed' ? (
                                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-5 w-5" />
                                        Completado
                                    </div>
                                ) : permissions.canCompleteRehearsals ? (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`complete-${rehearsal.id}`}
                                            onCheckedChange={() => handleCompleteRehearsal(rehearsal.id)}
                                            disabled={isCompleting === rehearsal.id}
                                        />
                                        <Label htmlFor={`complete-${rehearsal.id}`} className="text-sm font-medium text-muted-foreground cursor-pointer">
                                            {isCompleting === rehearsal.id ? "Marcando..." : "Marcar Completo"}
                                        </Label>
                                    </div>
                                ) : <div />}
                                <div className="flex items-center gap-1">
                                    {permissions.canCreateRehearsals && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/rehearsals/${rehearsal.id}/edit`)} disabled={rehearsal.status === 'completed'}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Editar Ensayo</span>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setRehearsalToDelete(rehearsal)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Eliminar Ensayo</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                             </div>
                        </div>
                    </Card>
                )
            })
        ) : (
            <Card>
                <CardContent className="h-24 text-center flex items-center justify-center p-6">
                    <p>{searchTerm ? "No se encontraron ensayos con ese criterio." : "No hay ensayos programados."}</p>
                </CardContent>
            </Card>
        )}
      </div>

        <AlertDialog open={!!rehearsalToDelete} onOpenChange={(isOpen) => !isOpen && setRehearsalToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este ensayo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el ensayo programado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRehearsalToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteRehearsal}
                        disabled={isDeleting}
                        className={buttonVariants({ variant: "destructive" })}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, eliminar ensayo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
