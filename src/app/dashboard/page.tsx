
"use client"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format, getYear, getMonth, isSameMonth, parse, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EventData, getEvents, completeEvent, type RehearsalData, getRehearsals } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Phone, CheckCircle, Loader2, PlusCircle, Music, Info, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i), "MMMM", { locale: es }),
}));

const currentYear = getYear(new Date());
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

export default function DashboardPage() {
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [allRehearsals, setAllRehearsals] = useState<RehearsalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [eventsData, rehearsalsData] = await Promise.all([
        getEvents(),
        getRehearsals()
      ]);
      setAllEvents(eventsData);
      setAllRehearsals(rehearsalsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las actividades." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const pendingActivities = useMemo(() => {
    const targetDate = new Date(selectedYear, selectedMonth);
    
    const events = allEvents
      .filter(event => {
        const eventDate = parse(event.eventDate, 'yyyy-MM-dd', new Date());
        return (event.status === 'pending' || event.status === 'confirmed') && isSameMonth(eventDate, targetDate);
      })
      .map(event => ({ ...event, type: 'event' as const, date: event.eventDate }));
      
    const rehearsals = allRehearsals
      .filter(rehearsal => {
        const rehearsalDate = parse(rehearsal.date, 'yyyy-MM-dd', new Date());
        return isSameMonth(rehearsalDate, targetDate);
      })
      .map(rehearsal => ({ ...rehearsal, type: 'rehearsal' as const }));

    const combined = [...events, ...rehearsals];

    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [allEvents, allRehearsals, selectedMonth, selectedYear]);

  const groupedActivities = useMemo(() => {
    return pendingActivities.reduce((acc, activity) => {
      const dateKey = format(new Date(activity.date), "EEEE, dd 'de' MMMM", { locale: es });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(activity);
      return acc;
    }, {} as Record<string, (EventData & {type: 'event'} | RehearsalData & {type: 'rehearsal'})[]>);
  }, [pendingActivities]);

  const handleCompleteEvent = async (eventId: string) => {
    setIsCompleting(eventId);
    const result = await completeEvent(eventId);
    if (result.success) {
      toast({
        title: "¡Evento Completado!",
        description: "El evento se marcó como completado y las finanzas se actualizaron.",
      });
      fetchAllData();
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Panel Principal
            </h1>
            <p className="text-muted-foreground">Resumen de tu actividad y accesos directos.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Evento
          </Link>
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Actividades Pendientes ({pendingActivities.length})</h2>
            <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                    {months.map(month => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-6">
            {isLoading ? (
                <Skeleton className="h-48 w-full" />
            ) : Object.keys(groupedActivities).length > 0 ? (
                Object.entries(groupedActivities).map(([date, activitiesOnDay]) => (
                    <Card key={date} className="p-4 sm:p-6">
                            <h3 className="font-semibold capitalize mb-4 text-lg">{date}</h3>
                            <div className="space-y-4">
                            {activitiesOnDay.map(activity => (
                                <div key={activity.id} className="p-4 rounded-lg border bg-card/50">
                                    {activity.type === 'event' ? (
                                        <>
                                            <div className="font-semibold text-base capitalize">{activity.eventType}</div>
                                            <div className="text-muted-foreground mb-3 text-sm">Cliente: <span className="font-semibold text-foreground">{activity.clientName}</span></div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground text-sm">
                                                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> {activity.eventTime}</p>
                                                <p className="flex items-center gap-2 text-foreground"><MapPin className="h-4 w-4 text-primary"/> {activity.location}</p>
                                                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary"/> <a href={`https://wa.me/${activity.clientPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{activity.clientPhone}</a></p>
                                                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary"/> Plan: {activity.plan}</p>
                                            </div>

                                            <div className="mt-3 pt-3 border-t text-sm">
                                            <p>Total: <span className="font-semibold">{formatCurrency(activity.contractedAmount)}</span></p>
                                            <p>Pagado: <span className="font-semibold text-green-600">{formatCurrency(activity.amountPaid)}</span> (Resta: <span className="font-semibold text-destructive">{formatCurrency(activity.pendingBalance)}</span>)</p>
                                            </div>

                                            <div className="flex justify-between items-center mt-4">
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/dashboard/events/${activity.id}`}>
                                                            <Info className="mr-2 h-4 w-4"/>
                                                            Ver Detalles
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/dashboard/events/${activity.id}/edit`}>
                                                            <Edit className="mr-2 h-4 w-4"/>
                                                            Editar
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <Button size="sm" onClick={() => handleCompleteEvent(activity.id)} disabled={isCompleting === activity.id}>
                                                    {isCompleting === activity.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                                    Marcar Completo
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-semibold text-base capitalize flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Ensayo</div>
                                            <div className="text-muted-foreground mb-3 text-sm">Tema: <span className="font-semibold text-foreground">{activity.focus}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground text-sm">
                                                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> {activity.time}</p>
                                                <p className="flex items-center gap-2 text-foreground"><MapPin className="h-4 w-4 text-primary"/> {activity.location}</p>
                                            </div>
                                            <div className="flex justify-end items-center mt-4">
                                                <span className="text-sm text-muted-foreground">No requiere acción</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            </div>
                    </Card>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-16 border border-dashed rounded-lg">
                    <p className="font-semibold">¡Todo al día!</p>
                    <p>No hay actividades pendientes para {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
