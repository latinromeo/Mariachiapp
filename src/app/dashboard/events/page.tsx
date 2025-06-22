
"use client"

import * as React from "react"
import Link from "next/link"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"

import { type EventData, type RehearsalData, getEvents, getRehearsals } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import { DayDetailModal } from "../day-detail-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type EventStatus = 'confirmed' | 'pending' | 'external' | 'cancelled' | 'completed';

const statusColors: Record<EventStatus, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  external: 'bg-blue-500',
  cancelled: 'bg-red-500',
  completed: 'bg-gray-400',
};

export default function EventsCalendarPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [events, setEvents] = React.useState<EventData[]>([]);
  const [rehearsals, setRehearsals] = React.useState<RehearsalData[]>([]);

  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const firstDayOfCurrentMonth = startOfMonth(currentMonth)

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfCurrentMonth, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  })
  
  const fetchData = async () => {
        setIsLoading(true);
        try {
            const [eventsData, rehearsalsData] = await Promise.all([
                getEvents(),
                getRehearsals()
            ]);
            setEvents(eventsData);
            setRehearsals(rehearsalsData);
        } catch (error) {
            console.error("Failed to fetch calendar data", error);
        } finally {
            setIsLoading(false);
        }
    };

  React.useEffect(() => {
    fetchData();
  }, []);


  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.eventDate), day));
  }

  const getRehearsalsForDay = (day: Date) => {
    return rehearsals.filter(rehearsal => isSameDay(new Date(rehearsal.date), day));
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    fetchData(); // Refetch data when modal closes to see updates
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const selectedDayRehearsals = selectedDay ? getRehearsalsForDay(selectedDay) : [];

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
             <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Calendario de Eventos
                </h1>
                <p className="text-muted-foreground">
                    Vista general de todas tus actividades programadas.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goToToday}>Hoy</Button>
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-semibold text-lg w-36 text-center capitalize">{format(currentMonth, "MMMM yyyy", { locale: es })}</span>
                <Button variant="outline" size="icon" onClick={goToNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                 <Button asChild>
                    <Link href="/dashboard/events/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Evento
                    </Link>
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground border-b">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="py-2">{day}</div>
            ))}
        </div>

        {isLoading ? (
            <div className="grid grid-cols-7 grid-rows-5 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-7 grid-rows-5 gap-px bg-border">
            {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const dayRehearsals = getRehearsalsForDay(day);

                return (
                <div
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                    "bg-card p-2 flex flex-col gap-1 min-h-[7rem] cursor-pointer hover:bg-muted/50 transition-colors",
                    !isSameMonth(day, currentMonth) && "bg-card/50 text-muted-foreground"
                    )}
                >
                    <time
                        dateTime={format(day, "yyyy-MM-dd")}
                        className={cn("font-semibold self-start", isToday(day) && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center")}
                    >
                        {format(day, "d")}
                    </time>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {dayEvents.map(event => (
                            <div key={event.id} className={cn("text-xs p-1 rounded-md text-white truncate", statusColors[event.status as EventStatus] || 'bg-gray-500')}>
                                {event.clientName}
                            </div>
                        ))}
                        {dayRehearsals.map(rehearsal => (
                             <div key={rehearsal.id} className="text-xs p-1 rounded-md bg-secondary text-secondary-foreground truncate">
                                Ensayo: {rehearsal.focus}
                            </div>
                        ))}
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {selectedDay && (
            <DayDetailModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                date={selectedDay}
                events={selectedDayEvents}
                rehearsals={selectedDayRehearsals}
            />
        )}
    </div>
  )
}
