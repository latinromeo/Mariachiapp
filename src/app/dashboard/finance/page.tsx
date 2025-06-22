
"use client"

import { useEffect, useState, useMemo } from "react"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Equal, PlusCircle, BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react"
import { type EventData, type ManualFinanceEntry, getEvents, getManualFinanceEntries } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ManualEntryForm } from "./manual-entry-form"
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function FinancePage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [manualEntries, setManualEntries] = useState<ManualFinanceEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');

    const [monthlySummary, setMonthlySummary] = useState({
        income: 0,
        expenses: 0,
        net: 0,
    });

    const [chartsData, setChartsData] = useState<{
        incomeBreakdown: any[],
        incomeVsExpense: any[],
        eventTypeDistribution: any[]
    }>({
        incomeBreakdown: [],
        incomeVsExpense: [],
        eventTypeDistribution: [],
    });

    const fetchData = async () => {
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
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const now = new Date();
        const firstDay = startOfMonth(now);
        const lastDay = endOfMonth(now);

        const monthlyEvents = events.filter(e => {
            const eventDate = new Date(e.eventDate);
            return eventDate >= firstDay && eventDate <= lastDay;
        });

        const monthlyManualEntries = manualEntries.filter(m => {
            const entryDate = new Date(m.date);
            return entryDate >= firstDay && entryDate <= lastDay;
        });

        const income = monthlyEvents.reduce((acc, e) => acc + (e.externalGroup ? 0 : e.contractedAmount), 0) +
                       monthlyManualEntries.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);

        const expenses = monthlyEvents.reduce((acc, e) => acc + (e.externalGroup ? 0 : (e.musiciansPay || 0)), 0) +
                         monthlyManualEntries.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);

        setMonthlySummary({ income, expenses, net: income - expenses });


        // --- Process data for charts ---
        
        // Income Breakdown (last 6 months)
        const incomeBreakdownData = Array.from({ length: 6 }).map((_, i) => {
            const monthDate = subMonths(now, 5 - i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);

            const monthIncome = events
                .filter(e => {
                    const eventDate = new Date(e.eventDate);
                    return !e.externalGroup && eventDate >= monthStart && eventDate <= monthEnd;
                })
                .reduce((sum, e) => sum + e.contractedAmount, 0) +
                manualEntries
                .filter(m => {
                     const entryDate = new Date(m.date);
                     return m.type === 'income' && entryDate >= monthStart && entryDate <= monthEnd
                })
                .reduce((sum, m) => sum + m.amount, 0);

            return {
                name: format(monthDate, 'MMM', { locale: es }),
                Ingresos: monthIncome
            };
        });

        // Event Type Distribution
        const eventTypeCounts = events.reduce((acc, event) => {
            acc[event.eventType] = (acc[event.eventType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eventTypeDistributionData = Object.keys(eventTypeCounts).map(type => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: eventTypeCounts[type],
            fill: `var(--chart-${Object.keys(eventTypeCounts).indexOf(type) + 1})`
        }));


        setChartsData({
            incomeBreakdown: incomeBreakdownData,
            incomeVsExpense: [{ name: format(now, 'MMMM', {locale: es}), Ingresos: income, Egresos: expenses }],
            eventTypeDistribution: eventTypeDistributionData,
        });

    }, [events, manualEntries, isLoading]);

    const handleSuccess = () => {
        setIsDialogOpen(false);
        fetchData();
    }

    const openDialog = (type: 'income' | 'expense') => {
        setEntryType(type);
        setIsDialogOpen(true);
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
                    Nuevo Ingreso Manual
                </Button>
                 <Button variant="destructive" onClick={() => openDialog('expense')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Egreso Manual
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Generales (Mes)</CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(monthlySummary.income)}</div>}
                    <p className="text-xs text-muted-foreground">Total de ingresos este mes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos Generales (Mes)</CardTitle>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(monthlySummary.expenses)}</div>}
                    <p className="text-xs text-muted-foreground">Total de egresos este mes</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Neto (Mes)</CardTitle>
                    <Equal className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${monthlySummary.net < 0 ? 'text-destructive' : ''}`}>{formatCurrency(monthlySummary.net)}</div>}
                    <p className="text-xs text-muted-foreground">Ingresos - Egresos</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LineChartIcon className="h-5 w-5" />Desglose de Ingresos Mensuales</CardTitle>
                    <CardDescription>Evolución de los ingresos a lo largo de los meses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <LineChart data={chartsData.incomeBreakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                             <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                            <Tooltip
                                cursor={false}
                                content={<ChartTooltipContent
                                    formatter={(value) => formatCurrency(value as number)}
                                    indicator="dot"
                                />}
                            />
                            <Line type="monotone" dataKey="Ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5"/>Distribución de Ingresos por Tipo de Evento</CardTitle>
                    <CardDescription>Cantidad de eventos realizados por cada tipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartsData.eventTypeDistribution.length > 0 ? (
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <PieChart>
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        formatter={(value, name) => `${name}: ${value} evento(s)`}
                                        indicator="dot"
                                        hideLabel
                                    />}
                                />
                                <Pie data={chartsData.eventTypeDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                     {chartsData.eventTypeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No hay datos de eventos para mostrar.</div>
                    )}
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
  )
}
