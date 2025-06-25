
"use client"

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEventById, type EventData, deleteEvent, triggerReceiptRegeneration } from "@/services/eventService";
import { ArrowLeft, Calendar, DollarSign, Edit, FileText, Loader2, MapPin, MoreVertical, Phone, User, Trash2, XCircle, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useUser } from "@/lib/auth";
import { formatTime, cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const [event, setEvent] = useState<EventData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const { permissions } = useUser();
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const fetchEvent = useCallback(async () => {
        if (!eventId) return;
        setIsLoading(true);
        const data = await getEventById(eventId);
        setEvent(data);
        setIsLoading(false);
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);


    const handleDelete = async () => {
        if (!event) return;
        setIsDeleting(true);
        const result = await deleteEvent(event.id);
        if (result.success) {
            toast({
                title: "Evento Eliminado",
                description: "El evento ha sido eliminado exitosamente.",
            });
            router.push('/dashboard/events');
        } else {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: result.error || "No se pudo eliminar el evento.",
            });
            setIsDeleting(false);
        }
    };
    
    const handleRegenerate = async () => {
        if (!event) return;
        setIsRegenerating(true);
        const result = await triggerReceiptRegeneration(event.id);
        if (result.success) {
            toast({
                title: "Regenerando Recibo",
                description: "El proceso ha comenzado. El enlace aparecerá aquí en breve.",
            });
            // Poll for changes
            setTimeout(fetchEvent, 5000); // Check again after 5 seconds
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "No se pudo iniciar la regeneración.",
            });
        }
        setIsRegenerating(false);
    };


    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-20" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-20" /></CardContent></Card>
                </div>
            </div>
        )
    }

    if (!event) {
        return <div>Evento no encontrado.</div>
    }

    const eventDate = parseISO(event.eventDate);

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-red-700">
                        Detalles del Evento: {event.eventType}
                    </h1>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver Atrás
                    </Button>
                </div>
                <div className="grid lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/>Cliente y Contacto</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                 <p><strong>Nombre Cliente:</strong> {event.clientName}</p>
                                 <p className="flex items-center gap-2"><strong>Teléfono Cliente:</strong> <a href={`https://wa.me/${event.clientPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{event.clientPhone}<Phone className="h-3 w-3"/></a></p>
                            </CardContent>
                        </Card>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                 <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/>Fecha y Hora</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>Día:</strong> <span className="capitalize">{format(eventDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: es })}</span></p>
                                    <p><strong>Hora:</strong> {formatTime(event.eventTime)}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                 <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/>Ubicación</CardTitle>
                                </CardHeader>
                                 <CardContent className="text-sm space-y-2">
                                    <p><strong>Sector:</strong> {event.sector}</p>
                                    <p><strong>Dirección Completa:</strong> {event.location}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                     <div className="lg:col-span-1 grid gap-6">
                         <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/>Detalles Financieros (RD$)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="text-sm space-y-1">
                                    <div className="flex justify-between"><span>Monto Total:</span> <span className="font-semibold">{formatCurrency(event.contractedAmount)}</span></div>
                                    <div className="flex justify-between"><span>Monto Pagado:</span> <span className="font-semibold text-green-600">{formatCurrency(event.amountPaid)}</span></div>
                                    <div className="flex justify-between"><span>Monto Restante:</span> <span className={`font-semibold ${event.pendingBalance > 0 ? 'text-destructive' : ''}`}>{formatCurrency(event.pendingBalance)} {event.pendingBalance > 0 && "(Pendiente de Pago)"}</span></div>
                                 </div>
                                 <Separator />
                                 <div className="text-sm space-y-1">
                                     { !event.externalGroup && <div className="flex justify-between"><span>Pago a Músicos:</span> <span className="font-semibold">{formatCurrency(event.musiciansPay)}</span></div> }
                                     <div className="flex justify-between"><span>Utilidad Bruta:</span> <span className="font-semibold">{event.externalGroup ? 'N/A' : formatCurrency(event.profit)}</span></div>
                                 </div>
                            </CardContent>
                        </Card>
                         <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Notas Adicionales</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p>{event.notes || "No hay notas adicionales para este evento."}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    {event.status === 'completed' ? (
                        event.receiptUrlPDF ? (
                            event.receiptUrlPDF === 'error' ? (
                                <>
                                <Button variant="destructive" disabled>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Error al generar PDF
                                </Button>
                                {permissions.canCreateEvents && (
                                     <Button onClick={handleRegenerate} disabled={isRegenerating}>
                                        <RefreshCw className={cn("mr-2 h-4 w-4", isRegenerating && "animate-spin")} />
                                        Regenerar Recibo
                                    </Button>
                                )}
                                </>
                            ) : (
                                <Button asChild variant="secondary">
                                    <Link href={event.receiptUrlPDF} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Ver Recibo PDF
                                    </Link>
                                </Button>
                            )
                        ) : (
                             <>
                            <Button variant="secondary" disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando Recibo...
                            </Button>
                            {permissions.canCreateEvents && (
                                 <Button onClick={handleRegenerate} disabled={isRegenerating}>
                                    <RefreshCw className={cn("mr-2 h-4 w-4", isRegenerating && "animate-spin")} />
                                    Regenerar Recibo
                                </Button>
                            )}
                            </>
                        )
                    ) : null}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreVertical className="mr-2 h-4 w-4" />
                                Más Acciones
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {permissions.canCreateEvents && (
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Evento
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {permissions.canCreateEvents && (
                        <Button asChild>
                            <Link href={`/dashboard/events/${eventId}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Evento
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el evento y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
