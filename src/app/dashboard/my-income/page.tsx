
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { DollarSign, TrendingUp, CheckCircle, Calendar, Edit, Loader2, TrendingDown, Landmark, PlusCircle } from "lucide-react"
import { type EventData, type MusicianIncome, type MusicianExpense, getEvents, getMusicianIncomes, getMusicianExpenses, upsertMusicianIncome } from "@/services/eventService"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, getYear, getMonth, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { useUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExpenseForm } from "./expense-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MUSICIAN_EXPENSE_CATEGORIES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"


const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i), "MMMM", { locale: es }),
}));

function IncomeEntryPopover({ event, onIncomeSet }: { event: EventData, onIncomeSet: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const predefinedAmounts = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

    const handleSetIncome = async (amount: number) => {
        setIsLoading(true);
        const result = await upsertMusicianIncome(user.id, event.id, amount, event.eventDate);
        if (result.success) {
            toast({
                title: "¡Ingreso Registrado!",
                description: `Se registró un ingreso de ${formatCurrency(amount)} para el evento.`,
            });
            onIncomeSet();
            setIsOpen(false);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "No se pudo registrar el ingreso.",
            });
        }
        setIsLoading(false);
    };
    
    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(customAmount);
        if (!isNaN(amount) && amount > 0) {
            handleSetIncome(amount);
        } else {
            toast({ variant: "destructive", title: "Monto inválido", description: "Por favor, ingrese un número positivo." });
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
                <div className="space-y-2">
                    <p className="font-medium text-sm">Registrar mi pago</p>
                    <div className="grid grid-cols-2 gap-2">
                        {predefinedAmounts.map(amount => (
                            <Button key={amount} variant="outline" size="sm" onClick={() => handleSetIncome(amount)} disabled={isLoading}>
                                {formatCurrency(amount)}
                            </Button>
                        ))}
                    </div>
                    <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-2">
                        <Input 
                            type="number" 
                            placeholder="Otro monto" 
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="h-9"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="sm" disabled={isLoading || !customAmount}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                        </Button>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    );
}

const robustParseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  try {
    return parseISO(dateString.split('T')[0]);
  } catch (e) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
};


export default function MyIncomePage() {
    const { user } = useUser();
    const [events, setEvents] = useState<EventData[]>([]);
    const [incomes, setIncomes] = useState<MusicianIncome[]>([]);
    const [expenses, setExpenses] = useState<MusicianExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    
    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [eventsData, incomesData, expensesData] = await Promise.all([
                getEvents(),
                getMusicianIncomes(user.id),
                getMusicianExpenses(user.id),
            ]);
            setEvents(eventsData);
            setIncomes(incomesData);
            setExpenses(expensesData);

            const years = new Set<number>();
            const addYearFromString = (dateString: string) => {
                const date = robustParseDate(dateString);
                if (date) years.add(getYear(date));
            };
            
            eventsData.forEach(e => addYearFromString(e.eventDate));
            incomesData.forEach(i => addYearFromString(i.date));
            expensesData.forEach(e => addYearFromString(e.date));

            const currentYear = getYear(new Date());
            if (!years.has(currentYear)) years.add(currentYear);
            setAvailableYears(Array.from(years).sort((a, b) => b - a));

        } catch (error) {
            console.error("Failed to fetch personal finance data", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        setIsClient(true);
        fetchData();
    }, [fetchData]);

    const {
        filteredEvents,
        filteredExpenses,
        totalIncome,
        totalExpenses,
        netBalance
    } = useMemo(() => {
        if (typeof selectedYear === 'undefined' || typeof selectedMonth === 'undefined') {
            return { filteredEvents: [], filteredExpenses: [], totalIncome: 0, totalExpenses: 0, netBalance: 0 };
        }

        const monthString = String(selectedMonth + 1).padStart(2, '0');
        const yearMonthPrefix = `${selectedYear}-${monthString}`;

        const filterByMonthAndYear = (itemDateStr: string) => {
            if (!itemDateStr || typeof itemDateStr !== 'string') {
                return false;
            }
            return itemDateStr.startsWith(yearMonthPrefix);
        };

        const currentFilteredEvents = events.filter(e => filterByMonthAndYear(e.eventDate));
        const currentFilteredIncomes = incomes.filter(i => filterByMonthAndYear(i.date));
        const currentFilteredExpenses = expenses.filter(e => filterByMonthAndYear(e.date));

        const totalIncome = currentFilteredIncomes.reduce((sum, income) => sum + income.amount, 0);
        const totalExpenses = currentFilteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const netBalance = totalIncome - totalExpenses;

        return {
            filteredEvents: currentFilteredEvents,
            filteredExpenses: currentFilteredExpenses,
            totalIncome,
            totalExpenses,
            netBalance
        };
    }, [selectedYear, selectedMonth, events, incomes, expenses]);

    const handleExpenseSuccess = () => {
        setIsExpenseDialogOpen(false);
        fetchData();
    }


    if (!isClient || isLoading) {
      return (
         <div className="flex flex-col gap-6">
              <Skeleton className="h-10 w-80" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
        </div>
      )
    }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <DollarSign className="h-8 w-8 text-primary"/>
                    Mis Ingresos y Gastos
                </h1>
                <p className="text-muted-foreground">
                    Lleva un registro de tus finanzas personales por cada período.
                </p>
            </div>
             <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Registrar Gasto
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Gasto Personal</DialogTitle>
                        <DialogDescription>
                           Registra un gasto para llevar un mejor control de tus finanzas.
                        </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm onSuccess={handleExpenseSuccess} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Mes:</span>
                <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                    <SelectTrigger className="w-[180px] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 text-foreground border-neutral-300 dark:border-neutral-600">
                        <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(month => (
                            <SelectItem key={month.value} value={String(month.value)} className="capitalize">{month.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Año:</span>
                <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger className="w-[120px] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 text-foreground border-neutral-300 dark:border-neutral-600">
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Ingresos Totales (Mes)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalIncome)}</div>
                </CardContent>
            </Card>
             <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">Gastos Totales (Mes)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                     <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totalExpenses)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Balance Neto (Mes)</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", netBalance >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>{formatCurrency(netBalance)}</div>
                </CardContent>
            </Card>
        </div>
        <p className="text-sm text-muted-foreground text-center">Mostrando datos para: {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', { locale: es })}</p>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600"/>Ingresos por Eventos del Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {filteredEvents.length > 0 ? filteredEvents.map(event => {
                    const income = incomes.find(i => i.eventId === event.id);
                    const isCompleted = !!income;
                    const eventDate = robustParseDate(event.eventDate);
                    return (
                        <div key={event.id} className={cn("flex justify-between items-center p-3 rounded-md border", isCompleted ? "bg-green-50 dark:bg-green-950/30 border-green-200" : "bg-muted/50")}>
                            <div>
                                <p className="font-semibold capitalize">{event.eventType} - {event.clientName}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {eventDate ? format(eventDate, 'dd/MM/yyyy') : 'Fecha inválida'} @ {event.sector}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("font-bold", isCompleted && "text-green-600")}>{formatCurrency(income?.amount)}</span>
                                {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <IncomeEntryPopover event={event} onIncomeSet={fetchData} />
                                )}
                            </div>
                        </div>
                    )
                }) : (
                     <p className="text-sm text-muted-foreground text-center py-4">No hay eventos programados para este período.</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-600"/>Gastos del Mes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredExpenses.length > 0 ? filteredExpenses.map(expense => {
                             const expenseDate = robustParseDate(expense.date);
                            return (
                            <TableRow key={expense.id}>
                                <TableCell>{expenseDate ? format(expenseDate, 'dd/MM/yyyy') : '-'}</TableCell>
                                <TableCell className="font-medium">{expense.description}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{MUSICIAN_EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                            </TableRow>
                        )}) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No hay gastos registrados para este período.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

    