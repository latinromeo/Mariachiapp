
"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, MapPin, Music, PlusCircle, User, ListMusic, FileText, Video } from "lucide-react"

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

const statusVariantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  confirmed: 'default',
  pending: 'secondary',
  external: 'outline',
  cancelled: 'destructive'
};


export function DayDetailModal({ isOpen, onClose, date, events, rehearsals }: DayDetailModalProps) {
  const formattedDate = format(date, "eeee, d 'de' MMMM 'de' yyyy", { locale: es })
  const dateForLink = format(date, 'yyyy-MM-dd')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize text-xl font-headline flex items-center gap-2">
            <Calendar className="h-5 w-5"/>
            Actividades del {formattedDate}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
            {events.length === 0 && rehearsals.length === 0 ? (
                 <div className="text-center text-muted-foreground py-10">
                    <p>No hay actividades programadas para este día.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {events.map(event => (
                        <div key={event.id} className="p-4 rounded-lg border bg-card">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{event.clientName}</h3>
                                    <p className="text-sm text-muted-foreground">{event.eventType}</p>
                                </div>
                                <Badge variant={statusVariantMap[event.status] || 'secondary'} className="capitalize">{event.status}</Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p className="flex items-center gap-2"><Clock className="h-4 w-4"/> {event.eventTime}</p>
                                <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {event.location}, {event.sector}</p>
                            </div>
                        </div>
                    ))}
                    {rehearsals.map(rehearsal => (
                         <div key={rehearsal.id} className="p-4 rounded-lg border bg-secondary/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2"><Music className="h-4 w-4"/>Ensayo</h3>
                                    <p className="text-sm text-muted-foreground">{rehearsal.focus}</p>
                                </div>
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
        <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
            <Button asChild>
                <Link href={`/dashboard/rehearsals/new?date=${dateForLink}`}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Programar Ensayo
                </Link>
            </Button>
            <Button asChild>
                <Link href={`/dashboard/events/new?date=${dateForLink}`}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Nuevo Evento
                </Link>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
