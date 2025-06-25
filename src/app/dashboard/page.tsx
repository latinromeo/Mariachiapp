
"use client"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format, getYear, getMonth, isSameMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EventData, getEvents, completeEvent, type RehearsalData, getRehearsals, completeRehearsal } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Phone, CheckCircle, Loader2, Music, PlusCircle, ExternalLink, User, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { EVENT_PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth";

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

type Activity = ((EventData & {type: 'event'}) | (RehearsalData & {type: 'rehearsal'})) & { parsedDate: Date };


export default function DashboardPage() {
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [allRehearsals, setAllRehearsals] = useState<RehearsalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, permissions } = useUser();

  const [isClient, setIsClient] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
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
    
    fetchAllData();

    const today = new Date();
    setSelectedMonth(getMonth(today));
    setSelectedYear(getYear(today));
    const currentYear = getYear(today);
    setYears(Array.from({ length: 11 }, (_, i) => currentYear - 5 + i));
    setIsClient(true);
  }, [toast]);

  const pendingActivities = useMemo((): Activity[] => {
    if (!isClient || typeof selectedYear === 'undefined' || typeof selectedMonth === 'undefined') {
      return [];
    }
    const targetDate = new Date(selectedYear, selectedMonth);

    const safeParseDate = (dateInput: unknown): Date | null => {
      if (typeof dateInput !== 'string' || !dateInput) return null;
      // Try parsing as ISO string first
      const isoDate = parseISO(dateInput);
      if (!isNaN(isoDate.getTime())) {
          return isoDate;
      }
      return null;
    };

    const events = allEvents
      .map(event => {
        const parsedDate = safeParseDate(event.eventDate);
        if (!parsedDate || !(event.status === 'pending' || event.status === 'confirmed' || event.status === 'external') || !isSameMonth(parsedDate, targetDate)) {
          return null;
        }
        return { ...event, type: 'event' as const, parsedDate };
      })
      .filter((e): e is Activity => !!e);
      
    const rehearsals = allRehearsals
      .map(rehearsal => {
        const parsedDate = safeParseDate(rehearsal.date);
        if (!parsedDate || rehearsal.status !== 'pending' || !isSameMonth(parsedDate, targetDate)) {
          return null;
        }
        return { ...rehearsal, type: 'rehearsal' as const, parsedDate };
      })
      .filter((r): r is Activity => !!r);

    const combined = [...events, ...rehearsals];

    return combined.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [allEvents, allRehearsals, selectedMonth, selectedYear, isClient]);

  const groupedActivities = useMemo(() => {
    if (!pendingActivities.length) return {};
    
    return pendingActivities.reduce((acc, activity) => {
      try {
        const dateKey = format(activity.parsedDate, "EEEE, dd MMM", { locale: es });
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(activity);
      } catch (e) {
        console.error("Error formatting date key for activity:", activity, e);
      }
      return acc;
    }, {} as Record<string, Activity[]>);
  }, [pendingActivities]);

  const handleCompleteEvent = async (eventId: string) => {
    setIsCompleting(eventId);
    const result = await completeEvent(eventId);
    if (result.success) {
      toast({
        title: "¡Evento Completado!",
        description: "El evento se marcó como completado y las finanzas se actualizaron.",
      });
      const [eventsData, rehearsalsData] = await Promise.all([getEvents(), getRehearsals()]);
      setAllEvents(eventsData);
      setAllRehearsals(rehearsalsData);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "No se pudo completar el evento.",
      });
    }
    setIsCompleting(null);
  };
  
    const handleCompleteRehearsal = async (rehearsalId: string) => {
        setIsCompleting(rehearsalId);
        const result = await completeRehearsal(rehearsalId);
        if (result.success) {
            toast({
                title: "¡Ensayo Completado!",
                description: "El ensayo se ha marcado como completado.",
            });
            const [eventsData, rehearsalsData] = await Promise.all([getEvents(), getRehearsals()]);
            setAllEvents(eventsData);
            setAllRehearsals(rehearsalsData);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "No se pudo completar el ensayo.",
            });
        }
        setIsCompleting(null);
    };

  if (!isClient) {
      return (
          <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-40" />
              </div>
              <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-10 w-[150px]" />
                      <Skeleton className="h-10 w-[100px]" />
                  </div>
                  <Skeleton className="h-48 w-full" />
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Panel Principal de Actividades
            </h1>
            {typeof selectedMonth !== 'undefined' && (
               <p className="text-muted-foreground">
                {`Eventos y ensayos para ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}.`}
               </p>
            )}
        </div>
        {permissions.canCreateEvents && (
          <Button asChild>
              <Link href="/dashboard/events/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Nuevo Evento
              </Link>
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            <Select value={typeof selectedMonth !== 'undefined' ? String(selectedMonth) : ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
            <SelectTrigger className="w-full flex-1 md:w-[150px] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 text-foreground border-neutral-300 dark:border-neutral-600">
                <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
                {months.map(month => (
                <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                ))}
            </SelectContent>
            </Select>
            {years.length > 0 && (
              <Select value={typeof selectedYear !== 'undefined' ? String(selectedYear) : ""} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-full flex-1 md:w-[100px] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 text-foreground border-neutral-300 dark:border-neutral-600">
                  <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                  {years.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
              </SelectContent>
              </Select>
            )}
        </div>

        <div className="space-y-6">
            {isLoading ? (
                <Skeleton className="h-48 w-full" />
            ) : Object.keys(groupedActivities).length > 0 ? (
                Object.entries(groupedActivities).map(([date, activitiesOnDay]) => (
                    <div key={date}>
                            <h3 className="font-semibold capitalize mb-2 text-lg">{date}</h3>
                            <div className="space-y-4">
                            {activitiesOnDay.map(activity => {
                                if (activity.type === 'event') {
                                    const planLabel = EVENT_PLANS.find(p => p.value === activity.plan)?.label || activity.plan;
                                    return (
                                        <Card key={activity.id} className={cn(activity.externalGroup && "bg-amber-50 dark:bg-amber-950/30")}>
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Calendar className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-bold lowercase">{activity.eventType}</p>
                                                        <p className="mt-1 flex items-center gap-1.5 text-base font-semibold">
                                                            <User className="h-4 w-4 text-primary" />
                                                            {activity.clientName}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="pl-8 space-y-2 text-sm">
                                                    {permissions.canCreateEvents ? (
                                                        <>
                                                            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-purple-600"/> {activity.eventTime}</p>
                                                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600"/> {activity.sector}</p>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-purple-600"/> {activity.eventTime}</p>
                                                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600"/> {activity.sector}</p>
                                                        </div>
                                                    )}
                                                    
                                                    <p>Plan: {planLabel}</p>
                                                    
                                                    {permissions.canSeeFinance && (
                                                        <div className="pt-1 space-y-2">
                                                            <p className="pl-6 text-muted-foreground">Dirección: {activity.location}</p>
                                                            <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground"/> 
                                                                <a href={`https://wa.me/${activity.clientPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{activity.clientPhone}</a>
                                                            </p>
                                                            <div className="pt-1 space-y-1">
                                                                <p>Total: <span className="font-semibold">{formatCurrency(activity.contractedAmount)}</span></p>
                                                                <p>
                                                                    <span className="text-green-600 font-medium">Pagado: {formatCurrency(activity.amountPaid)}</span>
                                                                    {activity.pendingBalance > 0 && (
                                                                        <span className="text-destructive font-medium ml-2">(Resta: {formatCurrency(activity.pendingBalance)})</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {activity.externalGroup && activity.externalContact && (
                                                    <div className="pl-8 pt-2">
                                                        <div className="bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-md text-sm text-amber-900 dark:text-amber-200">
                                                            <p className="font-bold flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Realizado por Grupo Externo</p>
                                                            <Separator className="my-2 bg-amber-200 dark:bg-amber-700/50" />
                                                            <p className="font-medium">{activity.externalContact}</p>
                                                            <a href={`https://wa.me/${activity.externalContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline text-xs font-semibold">Contactar (WhatsApp)</a>
                                                        </div>
                                                    </div>
                                                )}

                                                {permissions.canCreateEvents && (
                                                    <>
                                                        <Separator className="my-2" />
                                                        <div className="flex justify-between items-center text-sm pt-1">
                                                            <Link href={`/dashboard/events/${activity.id}/edit`} className="text-primary hover:underline font-medium">Ver Detalles / Editar</Link>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                className="bg-green-100/50 text-green-700 border-green-300 hover:bg-green-100 font-medium"
                                                                onClick={() => handleCompleteEvent(activity.id)}
                                                                disabled={isCompleting === activity.id}
                                                            >
                                                                {isCompleting === activity.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                                                Marcar Completo
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                }
                                return ( // Rehearsal card
                                    <Card key={activity.id} className="bg-muted/50">
                                        <div className="p-4 space-y-3">
                                            <div className="font-semibold text-base capitalize flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Ensayo</div>
                                            
                                            <div className="space-y-2 text-sm">
                                                <div className="text-muted-foreground">Tema: <span className="font-semibold text-foreground">{activity.focus}</span></div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                                                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-purple-600"/> {activity.time}</p>
                                                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600"/> {activity.location}</p>
                                                </div>
                                            </div>
                                            
                                            <Separator className="my-2" />
                                        
                                            <div className="flex justify-between items-center text-sm pt-1">
                                                <Link href={`/dashboard/rehearsals/${activity.id}`} className="text-primary hover:underline font-medium flex items-center gap-1">
                                                    Ver Detalles / Gestionar
                                                </Link>
                                                {permissions.canCompleteRehearsals && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="bg-green-100/50 text-green-700 border-green-300 hover:bg-green-100 font-medium"
                                                        onClick={() => handleCompleteRehearsal(activity.id)}
                                                        disabled={isCompleting === activity.id}
                                                    >
                                                        {isCompleting === activity.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                                        Marcar Completo
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                            </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-16 border border-dashed rounded-lg">
                    <p className="font-semibold">¡Todo al día!</p>
                    <p>No hay actividades pendientes para {typeof selectedMonth !== 'undefined' ? months.find(m => m.value === selectedMonth)?.label : ''} de {selectedYear}.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
