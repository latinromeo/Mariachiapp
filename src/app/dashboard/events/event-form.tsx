
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useState, useMemo, useCallback } from "react"
import { CalendarIcon, Clock, DollarSign, ExternalLink, Hash, Info, Loader2, MapPin, Mic, Phone, User, Trash2 } from "lucide-react"
import { EVENT_PLANS, EVENT_TYPES, PAYMENT_METHODS, EXTERNAL_CONTACTS } from "@/lib/constants"
import { createEvent, findClientByPhone, updateEvent, type EventData, deleteEvent } from "@/services/eventService"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EventReceiptModal } from "./event-receipt-modal"

const formSchema = z.object({
  clientName: z.string().min(2, { message: "El nombre del cliente es obligatorio." }),
  clientPhone: z.string().min(10, { message: "El teléfono debe tener al menos 10 dígitos." }),
  eventType: z.string({ required_error: "Debe seleccionar un tipo de evento." }),
  eventDate: z.string().min(1, { message: "La fecha es obligatoria." }),
  eventTime: z.string().min(1, { message: "La hora es obligatoria." }),
  plan: z.string({ required_error: "Debe seleccionar un plan." }),
  paymentMethod: z.string({ required_error: "Debe seleccionar un método de pago." }),
  location: z.string().min(2, { message: "La dirección es obligatoria." }),
  sector: z.string().min(2, { message: "El sector es obligatorio." }),
  contractedAmount: z.coerce.number().min(0, { message: "El monto debe ser positivo." }),
  amountPaid: z.coerce.number().min(0, { message: "El monto debe ser positivo." }),
  musiciansPay: z.coerce.number().min(0, { message: "El monto debe ser positivo." }).optional(),
  externalGroup: z.boolean().default(false),
  externalContact: z.string().optional(),
  otherExternalContact: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.externalGroup) {
        if (!data.externalContact) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debe seleccionar un contacto externo.",
                path: ["externalContact"],
            });
        } else if (data.externalContact === "otro" && (!data.otherExternalContact || data.otherExternalContact.trim() === '')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Por favor, especifique el nombre y teléfono del contacto externo.",
                path: ["otherExternalContact"],
            });
        }
    }
});


const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
};

interface EventFormProps {
    initialData?: EventData;
    eventId?: string;
}

export function EventForm({ initialData, eventId }: EventFormProps) {
  const { toast } = useToast()
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFromQuery = searchParams.get('date');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingClient, setIsCheckingClient] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [receiptData, setReceiptData] = useState<Partial<EventData> | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const isEditMode = !!eventId;

  const [customFields, setCustomFields] = useState({
    contractedAmount: false,
    amountPaid: false,
    musiciansPay: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        ...initialData,
        contractedAmount: initialData.contractedAmount || 0,
        amountPaid: initialData.amountPaid || 0,
        musiciansPay: initialData.musiciansPay || 0,
    } : {
      clientName: "",
      clientPhone: "",
      eventType: "cumpleaños",
      eventDate: dateFromQuery || "",
      eventTime: "",
      plan: "",
      paymentMethod: "bank_deposit",
      location: "",
      sector: "",
      contractedAmount: 0,
      amountPaid: 0,
      musiciansPay: 0,
      externalGroup: false,
      externalContact: "",
      otherExternalContact: "",
      notes: "",
    },
  })

  const { watch, setValue } = form
  const contractedAmount = watch("contractedAmount")
  const amountPaid = watch("amountPaid")
  const musiciansPay = watch("musiciansPay")
  const externalGroup = watch("externalGroup")
  const clientPhone = watch("clientPhone")
  const plan = watch("plan")
  const externalContactValue = watch("externalContact");

  const [pendingBalance, setPendingBalance] = useState(0)
  const [profit, setProfit] = useState(0)

  const standardAmountOptions = useMemo(() => {
    const options = new Set<number>();
    for (let i = 0; i <= 100000; i += 1000) {
        options.add(i);
    }
    [7500, 8500, 15500].forEach(opt => options.add(opt));
    return Array.from(options).sort((a, b) => a - b);
  }, []);

  const musicianAmountOptions = useMemo(() => {
    const options = new Set<number>();
    for (let i = 0; i <= 100000; i += 1000) {
        options.add(i);
    }
    [3600, 4800, 7500, 8500, 15500].forEach(opt => options.add(opt));
    return Array.from(options).sort((a, b) => a - b);
  }, []);
  
  useEffect(() => {
    if (initialData) {
        const isContractedCustom = initialData.contractedAmount !== undefined && !standardAmountOptions.includes(initialData.contractedAmount);
        const isPaidCustom = initialData.amountPaid !== undefined && !standardAmountOptions.includes(initialData.amountPaid);
        const isMusiciansCustom = initialData.musiciansPay !== undefined && !musicianAmountOptions.includes(initialData.musiciansPay);

        setCustomFields({
            contractedAmount: isContractedCustom,
            amountPaid: isPaidCustom,
            musiciansPay: isMusiciansCustom,
        });
    }
  }, [initialData, standardAmountOptions, musicianAmountOptions]);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 2; j++) {
        const hour = i;
        const minute = j * 30;
        const date = new Date();
        date.setHours(hour, minute);
        const formattedHour = (date.getHours() % 12) || 12;
        const formattedMinute = date.getMinutes().toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        options.push(`${formattedHour}:${formattedMinute} ${ampm}`);
      }
    }
    return options;
  }, []);

  const checkClient = useCallback(async (phone: string) => {
    if (phone.length >= 10) {
      setIsCheckingClient(true);
      try {
        const existingClient = await findClientByPhone(phone);
        if (existingClient) {
          setValue("clientName", existingClient.name, { shouldValidate: true });
          toast({ title: "Cliente Encontrado", description: `Se autocompletó el nombre para ${existingClient.name}.` });
        }
      } catch (error) {
        console.error("Error checking client", error);
      } finally {
        setIsCheckingClient(false);
      }
    }
  }, [setValue, toast]);

  useEffect(() => {
    const handler = setTimeout(() => { 
        if(clientPhone && !isEditMode) {
            checkClient(clientPhone) 
        }
    }, 500);
    return () => clearTimeout(handler);
  }, [clientPhone, checkClient, isEditMode]);

  useEffect(() => {
    const selectedPlan = EVENT_PLANS.find(p => p.value === plan);
    if (!selectedPlan) return;

    if (selectedPlan.price && selectedPlan.price > 0) {
        setValue('contractedAmount', selectedPlan.price, { shouldValidate: true });
        const isCustom = !standardAmountOptions.includes(selectedPlan.price);
        setCustomFields(prev => ({ ...prev, contractedAmount: isCustom }));
    }

    if (selectedPlan.musicianPay && selectedPlan.musicianPay > 0 && !externalGroup) {
        setValue('musiciansPay', selectedPlan.musicianPay, { shouldValidate: true });
        const isCustom = !musicianAmountOptions.includes(selectedPlan.musicianPay);
        setCustomFields(prev => ({ ...prev, musiciansPay: isCustom }));
    }
  }, [plan, setValue, standardAmountOptions, musicianAmountOptions, externalGroup]);

  useEffect(() => {
    const balance = (Number(contractedAmount) || 0) - (Number(amountPaid) || 0);
    setPendingBalance(balance);
  }, [contractedAmount, amountPaid])

  useEffect(() => {
    const calculatedProfit = (Number(contractedAmount) || 0) - (Number(musiciansPay) || 0);
    setProfit(calculatedProfit);
  }, [contractedAmount, musiciansPay])

  async function handleDelete() {
    if (!eventId) return;
    setIsDeleting(true);
    try {
        const result = await deleteEvent(eventId);
        if (result.success) {
            toast({
                title: "¡Evento Eliminado!",
                description: "El evento ha sido borrado exitosamente.",
            });
            router.push('/dashboard');
        } else {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: result.error || "No se pudo eliminar el evento.",
            });
            setIsDeleting(false);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error de Red",
            description: "No se pudo conectar con el servidor.",
        });
        console.error(error);
        setIsDeleting(false);
    }
  }

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setReceiptData(null);
    router.push('/dashboard');
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        if (isEditMode && eventId) {
            const result = await updateEvent(eventId, values);
            if (result.success) {
                toast({
                    title: "¡Evento Actualizado!",
                    description: `El evento ha sido actualizado exitosamente.`,
                });
                router.push('/dashboard');
            } else {
                 toast({
                    variant: "destructive",
                    title: `Error al actualizar el evento`,
                    description: result.error || "Hubo un problema al guardar. Inténtalo de nuevo.",
                });
            }
        } else {
            const result = await createEvent(values);
            if (result.success && result.eventId) {
                const pendingBalance = values.contractedAmount - values.amountPaid;
                const newEventData = {
                    ...values,
                    id: result.eventId,
                    pendingBalance,
                };
                setReceiptData(newEventData);
                setIsReceiptModalOpen(true);
                form.reset();
                toast({
                    title: "¡Evento Creado!",
                    description: "El evento ha sido guardado exitosamente. Se generó un recibo.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error al crear el evento",
                    description: result.error || "Hubo un problema al guardar. Inténtalo de nuevo.",
                });
            }
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error de Red",
            description: "No se pudo conectar con el servidor.",
        });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-2xl flex items-center gap-2"><Info className="h-6 w-6 text-primary" /> Detalles del Evento</CardTitle>
                          <CardDescription>Complete la información principal del evento y del cliente.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clientName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />Nombre del Cliente</FormLabel>
                                        <FormControl><Input placeholder="Ej: Familia Pérez" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="clientPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Teléfono del Cliente</FormLabel>
                                        <div className="relative">
                                          <FormControl><Input type="tel" placeholder="Ej: 5551234567" {...field} /></FormControl>
                                          {isCheckingClient && <Loader2 className="absolute right-2 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                              <FormField
                                  control={form.control}
                                  name="eventType"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel className="flex items-center gap-2"><Mic className="h-4 w-4 text-muted-foreground"/>Tipo de Evento</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value}>
                                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                {EVENT_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name="plan"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/>Plan Contratado</FormLabel>
                                           <Select onValueChange={field.onChange} value={field.value}>
                                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar plan..." /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                  {EVENT_PLANS.map(plan => <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="eventDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground"/>Fecha</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eventTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/>Hora</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar hora..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {timeOptions.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                          </div>
                          <FormField
                            control={form.control}
                            name="externalGroup"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="flex items-center gap-2"><ExternalLink className="h-4 w-4 text-muted-foreground"/>Este evento será realizado por otra agrupación (externo).</FormLabel>
                                </div>
                                </FormItem>
                            )}
                          />
                          {externalGroup && (
                            <Card className="bg-amber-50 border-amber-200">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base text-amber-900">Información del Contacto Externo</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="externalContact"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Seleccionar Contacto Externo</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="-- Seleccione un contacto --" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {EXTERNAL_CONTACTS.map(contact => <SelectItem key={contact.value} value={contact.value}>{contact.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {externalContactValue === 'otro' && (
                                        <FormField
                                            control={form.control}
                                            name="otherExternalContact"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Especifique el Contacto</FormLabel>
                                                    <FormControl><Input placeholder="Nombre y teléfono del contacto" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                          )}
                          <div className="grid sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/>Dirección</FormLabel>
                                            <FormControl><Input placeholder="Ej: Salón La Candelaria" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sector"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Sector</FormLabel>
                                            <FormControl><Input placeholder="Ej: Polanco" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                          </div>
                          <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Notas Adicionales</FormLabel>
                                      <FormControl><Textarea placeholder="Peticiones de canciones, código de vestimenta, etc." {...field} /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </CardContent>
                  </Card>
              </div>

              <div className="lg:col-span-1 space-y-6">
                  <Card>
                      <CardHeader><CardTitle className="font-headline text-2xl flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Finanzas</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                           <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Método de Pago</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                          <SelectContent>
                                             {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                            control={form.control}
                            name="contractedAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Contratado</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            if (value === 'custom') {
                                                setCustomFields(prev => ({...prev, contractedAmount: true}));
                                            } else {
                                                setCustomFields(prev => ({...prev, contractedAmount: false}));
                                                field.onChange(Number(value));
                                            }
                                        }}
                                        value={customFields.contractedAmount ? 'custom' : (field.value === undefined ? "" : String(field.value))}
                                        >
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar o escribir monto..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="custom">Monto Personalizado</SelectItem>
                                            {standardAmountOptions.map(amount => (
                                                <SelectItem key={amount} value={String(amount)}>
                                                {formatCurrency(amount)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {customFields.contractedAmount && (
                                        <FormControl>
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                            className="mt-2"
                                        />
                                        </FormControl>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="amountPaid"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto Pagado</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                if (value === 'custom') {
                                                    setCustomFields(prev => ({...prev, amountPaid: true}));
                                                } else {
                                                    setCustomFields(prev => ({...prev, amountPaid: false}));
                                                    field.onChange(Number(value));
                                                }
                                            }}
                                            value={customFields.amountPaid ? 'custom' : (field.value === undefined ? "" : String(field.value))}
                                            >
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar o escribir monto..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="custom">Monto Personalizado</SelectItem>
                                                {standardAmountOptions.map(amount => (
                                                    <SelectItem key={amount} value={String(amount)}>
                                                    {formatCurrency(amount)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {customFields.amountPaid && (
                                            <FormControl>
                                            <Input 
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                className="mt-2"
                                            />
                                            </FormControl>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="musiciansPay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pago a Músicos / Grupo Externo</FormLabel>
                                         <Select
                                            onValueChange={(value) => {
                                                if (value === 'custom') {
                                                    setCustomFields(prev => ({...prev, musiciansPay: true}));
                                                } else {
                                                    setCustomFields(prev => ({...prev, musiciansPay: false}));
                                                    field.onChange(Number(value));
                                                }
                                            }}
                                            value={customFields.musiciansPay ? 'custom' : (field.value === undefined ? "" : String(field.value))}
                                            >
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar o escribir monto..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="custom">Monto Personalizado</SelectItem>
                                                {musicianAmountOptions.map(amount => (
                                                    <SelectItem key={amount} value={String(amount)}>
                                                    {formatCurrency(amount)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {customFields.musiciansPay && (
                                            <FormControl>
                                            <Input 
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                className="mt-2"
                                            />
                                            </FormControl>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                      </CardContent>
                      <CardFooter className="flex flex-col items-start gap-2 text-sm bg-muted/50 p-4 rounded-b-lg">
                        <div className="flex justify-between w-full">
                            <span className="text-muted-foreground">Saldo Pendiente:</span>
                            <span className={`font-semibold ${pendingBalance < 0 ? 'text-destructive' : ''}`}>{formatCurrency(pendingBalance)}</span>
                        </div>
                        <div className="flex justify-between w-full">
                            <span className="text-muted-foreground">Ganancia:</span>
                            <span className={`font-semibold ${profit < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(profit)}</span>
                        </div>
                      </CardFooter>
                  </Card>
              </div>
          </div>
        <div className="flex items-center gap-4">
            <Button type="submit" size="lg" disabled={isSubmitting || isDeleting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Crear Evento")}
            </Button>
             {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="lg" disabled={isSubmitting || isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Evento
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el evento
                                de tus registros.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={buttonVariants({ variant: "destructive" })}
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sí, eliminar evento
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
      </form>
    </Form>
    <EventReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt}
        eventData={receiptData}
      />
    </>
  )
}
