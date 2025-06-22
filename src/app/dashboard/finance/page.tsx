
"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { DollarSign, ArrowUpRight, ArrowDownLeft, PlusCircle } from "lucide-react";
import { type EventData, type ManualFinanceEntry, getEvents, getManualFinanceEntries } from "@/services/eventService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManualEntryForm } from "./manual-entry-form";

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "$0.00";
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const getStatusBadge = (event: EventData) => {
    const { contractedAmount, amountPaid } = event;
    const pendingBalance = contractedAmount - amountPaid;

    if (pendingBalance <= 0) {
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pagado</Badge>;
    }
    if (amountPaid > 0 && amountPaid < contractedAmount) {
        return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Parcial</Badge>;
    }
    return <Badge variant="destructive">Pendiente</Badge>;
}

export default function FinancePage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [manualEntries, setManualEntries] = useState<ManualFinanceEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0
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
        let income = 0;
        let expenses = 0;

        events.forEach(event => {
            if (!event.externalGroup) {
                income += event.contractedAmount;
                expenses += event.musiciansPay || 0;
            }
        });

        manualEntries.forEach(entry => {
            if (entry.type === 'income') {
                income += entry.amount;
            } else {
                expenses += entry.amount;
            }
        });

        setSummary({
            totalIncome: income,
            totalExpenses: expenses,
            netProfit: income - expenses,
        });

    }, [events, manualEntries]);

    const handleSuccess = () => {
        setIsDialogOpen(false);
        fetchData(); // Refresh list
    }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Finanzas (Admin)
            </h1>
            <p className="text-muted-foreground">
                Resumen financiero de la banda.
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</div>}
                    <p className="text-xs text-muted-foreground">Todos los tiempos</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</div>}
                    <p className="text-xs text-muted-foreground">Pagos a músicos y gastos manuales</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${summary.netProfit < 0 ? 'text-destructive' : ''}`}>{formatCurrency(summary.netProfit)}</div>}
                    <p className="text-xs text-muted-foreground">Ingresos menos gastos</p>
                </CardContent>
            </Card>
        </div>

        <div className="flex justify-end">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Ingreso/Gasto Manual
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Asiento Manual</DialogTitle>
                        <DialogDescription>
                           Registra un ingreso o gasto que no esté asociado a un evento.
                        </DialogDescription>
                    </DialogHeader>
                    <ManualEntryForm onSuccess={handleSuccess} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Finanzas de Eventos</CardTitle>
                    <CardDescription>Resumen financiero por cada evento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Contratado</TableHead>
                                <TableHead>Pagado</TableHead>
                                <TableHead>Ganancia</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({length: 4}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                                </TableRow>
                            )) : events.map(event => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.clientName}</TableCell>
                                    <TableCell>{formatCurrency(event.contractedAmount)}</TableCell>
                                    <TableCell>{formatCurrency(event.amountPaid)}</TableCell>
                                    <TableCell className={event.profit && event.profit < 0 ? 'text-destructive' : ''}>
                                        {event.externalGroup ? 'N/A' : formatCurrency(event.profit)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(event)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos y Gastos Manuales</CardTitle>
                     <CardDescription>Otros movimientos financieros.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? Array.from({length: 4}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                            <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                            <TableCell><Skeleton className="h-5 w-20 ml-auto"/></TableCell>
                        </TableRow>
                    )): manualEntries.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownLeft className="h-4 w-4 text-red-500" /> }
                                {transaction.description}
                            </TableCell>
                            <TableCell>{new Date(transaction.date).toLocaleDateString('es-ES')}</TableCell>
                            <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
