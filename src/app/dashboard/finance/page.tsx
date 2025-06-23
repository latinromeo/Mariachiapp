
"use client"

import { useEffect, useState, useMemo } from "react"
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell, LineChart, Line } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Equal, PlusCircle, Clock } from "lucide-react"
import { type EventData, type ManualFinanceEntry, getEvents, getManualFinanceEntries } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ManualEntryForm } from "./manual-entry-form"
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { EVENT_TYPES } from "@/lib/constants"

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "$0";
    }
    return `$${(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        incomeHistory: any[],
        eventTypeDistribution: any[]
    }>({
        incomeHistory: [],
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
        
        // Income History (last 6 months)
        const incomeHistoryData = Array.from({ length: 6 }).map((_, i) => {
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
        const eventTypeLabelMap = EVENT_TYPES.reduce((acc, curr) => {
            acc[curr.value] = curr.label;
            return acc;
        }, {} as Record<string, string>)
        
        const eventTypeColorMap: Record<string, string> = {
            'Cumpleaños': 'var(--chart-2)',
            'Boda': 'var(--chart-4)',
            'Serenata': 'var(--chart-5)',
            'Corporativo': 'var(--chart-1)',
            'Otro': 'var(--chart-3)',
        };
        
        const eventTypeCounts = events.reduce((acc, event) => {
            const type = eventTypeLabelMap[event.eventType] || 'Otro';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eventTypeDistributionData = Object.keys(eventTypeCounts).map(name => ({
            name: name,
            value: eventTypeCounts[name],
            fill: eventTypeColorMap[name] || 'hsl(var(--muted-foreground))'
        }));


        setChartsData({
            incomeHistory: incomeHistoryData,
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
                    <CardTitle>Evolución de los ingresos a lo largo de los meses.</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{
                        Ingresos: {
                            label: "Ingresos",
                            color: "hsl(var(--chart-4))",
                        },
                    }} className="h-[250px] w-full">
                        <LineChart
                            data={chartsData.incomeHistory}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => formatCurrency(value as number)} 
                            />
                            <ChartTooltip
                                cursor={true}
                                content={<ChartTooltipContent
                                    formatter={(value) => formatCurrency(value as number).replace('.00', '')}
                                    indicator="dot"
                                />}
                            />
                            <Legend content={<ChartLegendContent />} />
                            <Line type="monotone" dataKey="Ingresos" strokeWidth={2} stroke="var(--color-Ingresos)" dot={true} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Distribución de Ingresos por Tipo de Evento</CardTitle>
                    <CardDescription>Cantidad de eventos realizados por cada tipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartsData.eventTypeDistribution.length > 0 ? (
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <PieChart>
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        formatter={(value, name) => `${value} evento(s)`}
                                        nameKey="name"
                                        indicator="dot"
                                    />}
                                />
                                <Pie data={chartsData.eventTypeDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                     {chartsData.eventTypeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend 
                                    iconType="square" 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                    wrapperStyle={{paddingTop: '20px'}} 
                                />
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
