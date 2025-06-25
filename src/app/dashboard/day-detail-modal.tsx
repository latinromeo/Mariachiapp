
"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, MapPin, Music, PlusCircle, ListMusic, FileText, Video, Phone, DollarSign, CheckCircle, Edit, XCircle, Loader2, ExternalLink } from "lucide-react"

import { type EventData, type RehearsalData, completeEvent } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn, formatTime } from "@/lib/utils"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  date: Date
  events: EventData[]
  rehearsals: RehearsalData[]
}

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const statusConfig = {
    completed: {
        badgeVariant: 'secondary' as const,
        badgeText: 'Completado',
        borderColor: 'border-l-green-600',
        iconColor: 'text-green-600',
    },
    pending: {
        badgeVariant: 'secondary' as const,
        badgeText: 'Pendiente',
        borderColor: 'border-l-yellow-500',
        iconColor: 'text-yellow-500',
    },
    confirmed: {
        badgeVariant: 'default' as const,
        badgeText: 'Confirmado',
        borderColor: 'border-l-blue-500',
        iconColor: 'text-blue-500',
    },
    external: {
        badgeVariant: 'outline' as const,
        badgeText: 'Externo',
        borderColor: 'border-l-purple-500',
        iconColor: 'text-purple-500',
    },
    cancelled: {
        badgeVariant: 'destructive' as const,
        badgeText: 'Cancelado',
        borderColor: 'border-l-red-600',
        iconColor: 'text-red-600',
    },
    default: {
        badgeVariant: 'destructive' as const,
        badgeText: 'Evento',
        borderColor: 'border-l-destructive',
        iconColor: 'text-destructive',
    }
};


export function DayDetailModal({ isOpen, onClose, onRefresh, date, events, rehearsals }: DayDetailModalProps) {
  const formattedDate = format(date, "eeee, d 'de' MMMM 'de' yyyy", { locale: es })
  const dateForLink = format(date, 'yyyy-MM-dd')
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  const handleCompleteEvent = async (eventId: string) => {
    setIsCompleting(eventId);
    const result = await completeEvent(eventId);
    if (result.success) {
      toast({
        title: "¡Evento Completado!",
        description: "El evento se marcó como completado y las finanzas se actualizaron.",
      });
      onRefresh();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "No se pudo completar el evento.",
      });
    }
    setIsCompleting(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize text-xl font-headline">
            Actividades para {formattedDate}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <h4 className="font-semibold">Actividades Programadas:</h4>
            {events.length === 0 && rehearsals.length === 0 ? (
                 <div className="text-center text-muted-foreground py-10">
                    <p>No hay actividades programadas para este día.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {events.map(event => {
                        const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.default;
                        const canBeCompleted = event.status === 'pending' || event.status === 'confirmed';
                        
                        return (
                        <div key={event.id} className={cn("p-4 rounded-lg bg-muted/30 border border-border border-l-4", config.borderColor)}>
                            <Badge variant={config.badgeVariant} className="absolute top-4 right-4">{config.badgeText}</Badge>
                            <div className="space-y-3">
                                <p className="flex items-center gap-2 text-foreground font-semibold text-base pr-20">
                                    <Calendar className={cn("h-5 w-5", config.iconColor)}/> {formatTime(event.eventTime)} - {event.eventType} {event.clientName}
                                </p>
                                <div className="text-sm space-y-2">
                                    <p className="flex items-center gap-2 text-foreground">
                                        <MapPin className="h-4 w-4 text-green-600"/> @{event.location}, {event.sector}
                                    </p>
                                    <p className="flex items-center gap-2 text-foreground">
                                        <Phone className="h-4 w-4 text-blue-600"/> Tel Cliente: 
                                        <a href={`https://wa.me/${event.clientPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                            {event.clientPhone}
                                        </a>
                                    </p>
                                    <div className="flex items-start gap-2 text-foreground">
                                        <DollarSign className="h-4 w-4 text-yellow-600 mt-0.5"/> 
                                        <div>
                                            Total: <span className="font-semibold text-foreground">{formatCurrency(event.contractedAmount)}</span>
                                            <br/>
                                            Pagado: <span className="font-semibold text-green-600">{formatCurrency(event.amountPaid)}</span>
                                            {event.pendingBalance > 0 && (
                                                <>
                                                <br/>
                                                Resta: <span className="font-semibold text-destructive">{formatCurrency(event.pendingBalance)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {event.externalGroup && event.externalContact && (
                                    <div className="pt-2">
                                        <div className="bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-md text-sm text-amber-900 dark:text-amber-200">
                                            <p className="font-bold flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Realizado por Grupo Externo</p>
                                            <Separator className="my-2 bg-amber-200 dark:bg-amber-700/50" />
                                            <p className="font-medium">{event.externalContact}</p>
                                            <a href={`https://wa.me/${event.externalContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline text-xs font-semibold">Contactar (WhatsApp)</a>
                                        </div>
                                    </div>
                                )}

                                {(event.status === 'completed' || event.status === 'cancelled') && (
                                     <p className={cn("flex items-center gap-2 text-sm font-medium pt-2", config.iconColor)}>
                                        {event.status === 'completed' ? <CheckCircle className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
                                        <span className="capitalize">{config.badgeText}</span>
                                    </p>
                                )}
                            </div>
                            <Separator className="my-3"/>
                            <div className="flex justify-between items-center">
                                <Link href={`/dashboard/events/${event.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                    Ver / Editar <Edit className="h-3 w-3"/>
                                </Link>
                                {canBeCompleted && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-green-100/50 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900 font-medium"
                                        onClick={() => handleCompleteEvent(event.id)}
                                        disabled={isCompleting === event.id}
                                    >
                                        {isCompleting === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                        Completar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )})}
                    {rehearsals.map(rehearsal => (
                         <div key={rehearsal.id} className="p-4 rounded-lg border bg-muted/30 border-l-4 border-l-primary">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 text-foreground"><Music className="h-5 w-5 text-primary"/>Ensayo: {rehearsal.focus}</h3>
                                </div>
                                 <Badge variant="secondary">Ensayo</Badge>
                            </div>
                             <Separator className="my-2" />
                             <div className="text-sm text-foreground space-y-2">
                                <div className="space-y-1">
                                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-purple-600"/> {formatTime(rehearsal.time)}</p>
                                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600"/> {rehearsal.location}</p>
                                </div>
                                {rehearsal.songs && rehearsal.songs.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium text-foreground mb-1"><ListMusic className="h-4 w-4 text-orange-600"/>Canciones a Ensayar:</h4>
                                        <ul className="list-none text-xs pl-0 space-y-1">
                                            {rehearsal.songs.map((song, index) => (
                                                <li key={index} className="flex items-center justify-between bg-background/50 p-1.5 rounded-md">
                                                    <span>{song.name}{song.key ? ` (${song.key})` : ''}</span>
                                                    <div className="flex items-center gap-3 pr-2">
                                                        {song.youtubeUrl && (
                                                            <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" title="Ver en YouTube">
                                                                <Video className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        {song.sheetMusicUrl && (
                                                            <a href={song.sheetMusicUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" title="Ver Partitura">
                                                                <FileText className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center pt-4 border-t">
             <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/dashboard/events/new?date=${dateForLink}`}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Agregar Nuevo Evento para esta Fecha
                </Link>
            </Button>
            <Button variant="outline" onClick={onClose}>Cerrar Detalles</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
