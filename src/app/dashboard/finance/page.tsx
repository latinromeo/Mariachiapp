
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell, LineChart, Line, BarChart, Bar, Label } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Clock, PlusCircle, Landmark } from "lucide-react"
import { type EventData, type ManualFinanceEntry, getEvents, getManualFinanceEntries } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ManualEntryForm } from "./manual-entry-form"
import { endOfMonth, format, startOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { EVENT_TYPES } from "@/lib/constants"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/auth"

const formatCurrency = (value: number | undefined, compact = false) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    if (compact && Math.abs(value) >= 1000) {
      return `RD$${(value / 1000).toLocaleString('es-DO', {maximumFractionDigits: 0})}k`
    }
    return `RD$${(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const COLORS: Record<string, string> = {
    'Cumpleaños': 'hsl(var(--chart-2))',
    'Boda': 'hsl(var(--chart-4))',
    'Serenata': 'hsl(var(--chart-5))',
    'Corporativo': 'hsl(var(--chart-1))',
    'Otro': 'hsl(var(--chart-3))',
};

const safeParseDate = (dateString: string) => {
    if (!dateString) return new Date(0); // Fallback to epoch for invalid date
    try {
      // Handles 'YYYY-MM-DD' and full ISO strings
      return parseISO(dateString);
    } catch (e) {
      // Fallback for potentially malformed dates
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date(0) : date;
    }
}


export default function FinancePage() {
    const { permissions } = useUser();
    const [events, setEvents] = useState<EventData[]>([]);
    const [manualEntries, setManualEntries] = useState<ManualFinanceEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
    const [isClient, setIsClient] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [eventsData, manualEntriesData] = await Promise.all([
                getEvents(),
                getManualFinanceEntries()
            ]);
            setEvents(eventsData);
            setManualEntries(manualEntriesData);
        } catch (error) {
            console.error("Failed to fetch financial data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
        fetchData();
        window.addEventListener('agendaUpdated', fetchData);
        return () => {
          window.removeEventListener('agendaUpdated', fetchData);
        };
    }, [fetchData]);

    const { 
        incomeHistory, 
        eventTypeDistribution, 
        pieChartConfig,
        barChartData,
        transactionHistory,
        currentMonthIncome,
        currentMonthExpenses,
        netBalance,
    } = useMemo(() => {
        const defaultResult = {
            incomeHistory: [], eventTypeDistribution: [], pieChartConfig: {} as ChartConfig, 
            barChartData: [], transactionHistory: [], currentMonthIncome: 0, 
            currentMonthExpenses: 0, netBalance: 0
        };

        if (isLoading || !isClient) return defaultResult;

        const now = new Date();
        const firstDayCurrentMonth = startOfMonth(now);
        const lastDayCurrentMonth = endOfMonth(now);
        const currentMonthInterval = { start: firstDayCurrentMonth, end: lastDayCurrentMonth };
        const currentMonthName = format(now, 'MMM', { locale: es });
        
        // Current Month Totals
        const currentMonthEvents = events.filter(e => isWithinInterval(safeParseDate(e.eventDate), currentMonthInterval));
        const currentMonthManualEntries = manualEntries.filter(m => isWithinInterval(safeParseDate(m.date), currentMonthInterval));

        const currentMonthIncome = currentMonthEvents.reduce((acc, e) => acc + (e.externalGroup ? 0 : e.contractedAmount), 0) +
                       currentMonthManualEntries.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);

        const currentMonthExpenses = currentMonthEvents.reduce((acc, e) => acc + (e.externalGroup ? 0 : (e.musiciansPay || 0)), 0) +
                         currentMonthManualEntries.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);
        
        const netBalance = currentMonthIncome - currentMonthExpenses;

        const barChartData = [{
            name: currentMonthName,
            ingresos: currentMonthIncome,
            egresos: currentMonthExpenses
        }];
        
        // Income History (last 6 months)
        const incomeHistory = Array.from({ length: 6 }).map((_, i) => {
            const monthDate = subMonths(now, 5 - i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const monthInterval = { start: monthStart, end: monthEnd };

            const monthIncome = events
                .filter(e => !e.externalGroup && isWithinInterval(safeParseDate(e.eventDate), monthInterval))
                .reduce((sum, e) => sum + e.contractedAmount, 0) +
                manualEntries
                .filter(m => m.type === 'income' && isWithinInterval(safeParseDate(m.date), monthInterval))
                .reduce((sum, m) => sum + m.amount, 0);

            return {
                name: format(monthDate, 'MMM', { locale: es }),
                Ingresos: monthIncome
            };
        });

        // Event Type Distribution
        const eventTypeLabelMap = EVENT_TYPES.reduce((acc, curr) => {
            acc[curr.value] = curr.label;
            return acc;
        }, {} as Record<string, string>)
        
        const eventTypeCounts = events.reduce((acc, event) => {
            const type = eventTypeLabelMap[event.eventType] || 'Otro';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eventTypeDistribution = Object.keys(eventTypeCounts).map(name => ({
            name: name,
            value: eventTypeCounts[name],
            fill: COLORS[name] || 'hsl(var(--muted-foreground))',
        }));

        const pieChartConfig = Object.entries(eventTypeCounts).reduce((acc, [name]) => {
            acc[name] = {
                label: name,
                color: COLORS[name] || 'hsl(var(--muted-foreground))',
            };
            return acc;
        }, {} as ChartConfig);

        // Transaction History
        const eventTransactions = events
            .map(event => ({
                type: 'event' as const,
                date: event.eventDate,
                description: `${event.eventType} - ${event.clientName}`,
                id: event.id,
                createdAt: event.createdAt,
                income: event.contractedAmount > 0 ? event.contractedAmount : undefined,
                expense: !event.externalGroup && event.musiciansPay && event.musiciansPay > 0 ? event.musiciansPay : undefined,
                category: event.externalGroup ? 'Referido Externo' : 'Presentación Mariachi',
            }))
            .filter(et => et.income || et.expense);

        const manualTransactions = manualEntries.map(entry => ({
            type: 'manual' as const,
            date: entry.date,
            description: entry.description,
            category: entry.category || 'Otro',
            transactionType: entry.type === 'income' ? 'Ingreso' : 'Gasto',
            amount: entry.amount,
            id: `man-${entry.id}`,
            createdAt: entry.createdAt,
        }));
        
        const transactionHistory = [...eventTransactions, ...manualTransactions];
        transactionHistory.sort((a, b) => {
            const dateA = safeParseDate(a.date);
            const dateB = safeParseDate(b.date);
            if (dateB.getTime() !== dateA.getTime()) {
                return dateB.getTime() - dateA.getTime();
            }
            // If dates are the same, sort by creation time (most recent first)
            const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return createdAtB - createdAtA;
        });
        
        return { incomeHistory, eventTypeDistribution, pieChartConfig, barChartData, transactionHistory, currentMonthIncome, currentMonthExpenses, netBalance };

    }, [events, manualEntries, isLoading, isClient]);

    const handleSuccess = () => {
        setIsDialogOpen(false);
        fetchData();
    }

    const openDialog = (type: 'income' | 'expense') => {
        setEntryType(type);
        setIsDialogOpen(true);
    }
    
    const showSkeleton = isLoading || !isClient;

    if (!permissions.canSeeFinance) {
        return (
            <div className="flex flex-col gap-6">
                <h1 className="font-headline text-3xl font-bold tracking-tight text-destructive">
                    Acceso Denegado
                </h1>
                <Card>
                    <CardHeader>
                        <CardTitle>No tienes permiso para ver esta página.</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Solo los administradores pueden ver la información financiera. Por favor, contacta a un administrador si crees que esto es un error.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }


  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <DollarSign className="h-8 w-8 text-primary"/>
                    Gestión Financiera
                </h1>
                <p className="text-muted-foreground">
                    Visualiza ingresos, egresos y el balance general del mariachi.
                </p>
            </div>
             <div className="flex items-center gap-2">
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openDialog('income')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Ingreso
                </Button>
                 <Button variant="destructive" onClick={() => openDialog('expense')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Gasto
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Generales (Mes)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    {showSkeleton ? <Skeleton className="h-8 w-3/4 mt-1" /> : <div className="text-2xl font-bold">{formatCurrency(currentMonthIncome)}</div>}
                    <p className="text-xs text-muted-foreground">Total de ingresos este mes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos Generales (Mes)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    {showSkeleton ? <Skeleton className="h-8 w-3/4 mt-1" /> : <div className="text-2xl font-bold">{formatCurrency(currentMonthExpenses)}</div>}
                    <p className="text-xs text-muted-foreground">Total de egresos este mes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Neto (Mes)</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {showSkeleton ? <Skeleton className="h-8 w-3/4 mt-1" /> : <div className="text-2xl font-bold">{formatCurrency(netBalance)}</div>}
                    <p className="text-xs text-muted-foreground">Ingresos - Egresos</p>
                </CardContent>
            </Card>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/>Ingresos vs Egresos (Mes Actual)</CardTitle>
                    <CardDescription>Comparativa del mes en curso.</CardDescription>
                </CardHeader>
                <CardContent>
                    {showSkeleton ? <Skeleton className="h-[250px] w-full" /> : (
                        <ChartContainer config={{
                            ingresos: { label: 'Ingresos', color: 'hsl(var(--chart-5))' },
                            egresos: { label: 'Egresos', color: 'hsl(var(--chart-1))' },
                        }} className="h-[250px] w-full">
                            <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number, true)} />
                                <ChartTooltip cursor={true} content={<ChartTooltipContent formatter={(value) => `${formatCurrency(value as number)}`} />} />
                                <Legend content={<ChartLegendContent />} />
                                <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="egresos" fill="var(--color-egresos)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/>Desglose de Ingresos Mensuales</CardTitle>
                    <CardDescription>Evolución de los ingresos a lo largo de los meses.</CardDescription>
                </CardHeader>
                <CardContent>
                    {showSkeleton ? <Skeleton className="h-[250px] w-full" /> : (
                        <ChartContainer config={{
                            Ingresos: { label: "Ingresos", color: "hsl(var(--chart-5))" },
                        }} className="h-[250px] w-full">
                            <LineChart data={incomeHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number, true)} />
                                <ChartTooltip cursor={true} content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} indicator="dot" />} />
                                <Line type="monotone" dataKey="Ingresos" strokeWidth={2} stroke="var(--color-Ingresos)" dot={true} />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Distribución de Ingresos por Tipo de Evento</CardTitle>
                    <CardDescription>Cantidad total de eventos realizados por cada tipo.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                    {showSkeleton ? <Skeleton className="h-[250px] w-[250px] rounded-full" /> : (
                        eventTypeDistribution.length > 0 ? (
                             <ChartContainer
                                config={pieChartConfig}
                                className="mx-auto aspect-square h-[250px]"
                            >
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent
                                            formatter={(value) => `${value} evento(s)`}
                                            nameKey="name"
                                            indicator="dot"
                                        />}
                                    />
                                    <Pie
                                        data={eventTypeDistribution}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        strokeWidth={5}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                const totalEvents = eventTypeDistribution.reduce((acc, curr) => acc + curr.value, 0);
                                                return (
                                                    <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-3xl font-bold"
                                                    >
                                                        {totalEvents}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 24}
                                                        className="fill-muted-foreground"
                                                    >
                                                        Eventos
                                                    </tspan>
                                                    </text>
                                                )
                                                }
                                            }}
                                        />
                                    </Pie>
                                     <ChartLegend
                                        content={<ChartLegendContent nameKey="name" />}
                                        className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                                    />
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No hay datos de eventos para mostrar.</div>
                        )
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>FECHA</TableHead>
                                <TableHead>DESCRIPCIÓN</TableHead>
                                <TableHead>CATEGORÍA</TableHead>
                                <TableHead className="text-right">INGRESO</TableHead>
                                <TableHead className="text-right">GASTO</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {showSkeleton ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48"/></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-full"/></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-24 float-right"/></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-24 float-right"/></TableCell>
                                    </TableRow>
                                ))
                            ) : transactionHistory.length > 0 ? (
                                transactionHistory.map(t => {
                                    if (t.type === 'event') {
                                        return (
                                            <TableRow key={t.id}>
                                                <TableCell className="font-medium">
                                                    {format(safeParseDate(t.date), 'dd/MM/yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{t.description}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{t.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-green-600">
                                                    {t.income ? formatCurrency(t.income, false) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-destructive">
                                                    {t.expense ? formatCurrency(t.expense, false) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }
                                    // Handle manual transactions
                                    return (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">
                                                {format(safeParseDate(t.date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{t.description}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{t.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {t.transactionType === 'Ingreso' ? formatCurrency(t.amount, false) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-destructive">
                                                {t.transactionType === 'Gasto' ? formatCurrency(t.amount, false) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No hay transacciones registradas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Asiento Manual</DialogTitle>
                    <DialogDescription>
                       Registra un ingreso o gasto que no esté asociado a un evento.
                    </DialogDescription>
                </DialogHeader>
                <ManualEntryForm onSuccess={handleSuccess} defaultType={entryType} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
