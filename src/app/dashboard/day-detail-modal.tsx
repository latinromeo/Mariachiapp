
"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, MapPin, Music, PlusCircle, ListMusic, FileText, Video, Phone, DollarSign, CheckCircle, Edit } from "lucide-react"

import { type EventData, type RehearsalData } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
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


export function DayDetailModal({ isOpen, onClose, date, events, rehearsals }: DayDetailModalProps) {
  const formattedDate = format(date, "eeee, d 'de' MMMM 'de' yyyy", { locale: es })
  const dateForLink = format(date, 'yyyy-MM-dd')

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
                    {events.map(event => (
                        <div key={event.id} className="relative p-4 rounded-lg bg-destructive/10 border border-destructive/20 border-l-4 border-l-destructive">
                            <Badge variant="destructive" className="absolute top-4 right-4 bg-red-100 text-red-800 border-red-200">Evento</Badge>
                            <div className="space-y-2">
                                <p className="flex items-center gap-2 text-destructive font-semibold text-base pr-20">
                                    <Calendar className="h-5 w-5"/> {event.eventTime} - {event.eventType} {event.clientName}
                                </p>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4"/> @{event.location}, {event.sector}
                                </p>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4"/> Tel Cliente: <span className="text-foreground font-medium">{event.clientPhone}</span>
                                </p>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DollarSign className="h-4 w-4"/> Monto: {formatCurrency(event.contractedAmount)} / Pagado: {formatCurrency(event.amountPaid)}
                                </p>

                                {event.status === 'completed' && (
                                     <p className="flex items-center gap-2 text-sm font-medium text-green-600 pt-2">
                                        <CheckCircle className="h-4 w-4"/> Completado
                                    </p>
                                )}
                            </div>
                            <Link href={`/dashboard/events/${event.id}`} className="absolute bottom-4 right-4 text-sm text-primary hover:underline flex items-center gap-1">
                                Ver / Editar <Edit className="h-3 w-3"/>
                            </Link>
                        </div>
                    ))}
                    {rehearsals.map(rehearsal => (
                         <div key={rehearsal.id} className="p-4 rounded-lg border bg-secondary/50 border-l-4 border-l-primary">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2"><Music className="h-5 w-5 text-primary"/>Ensayo: {rehearsal.focus}</h3>
                                </div>
                                 <Badge variant="secondary">Ensayo</Badge>
                            </div>
                             <Separator className="my-2" />
                             <div className="text-sm text-muted-foreground space-y-2">
                                <div className="space-y-1">
                                    <p className="flex items-center gap-2"><Clock className="h-4 w-4"/> {rehearsal.time}</p>
                                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {rehearsal.location}</p>
                                </div>
                                {rehearsal.songs && rehearsal.songs.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium text-foreground mb-1"><ListMusic className="h-4 w-4"/>Canciones a Ensayar:</h4>
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
