
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { CalendarIcon, Clock, DollarSign, ExternalLink, Hash, Info, Loader2, MapPin, Mic, Phone, User } from "lucide-react"
import { EVENT_DURATIONS, EVENT_PLANS, EVENT_TYPES, PAYMENT_METHODS } from "@/lib/constants"
import { createEvent, findClientByPhone, updateEvent, type EventData } from "@/services/eventService"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  clientName: z.string().min(2, { message: "El nombre del cliente es obligatorio." }),
  clientPhone: z.string().min(10, { message: "El teléfono debe tener al menos 10 dígitos." }),
  eventType: z.string({ required_error: "Debe seleccionar un tipo de evento." }),
  eventDate: z.string().min(1, { message: "La fecha es obligatoria." }),
  eventTime: z.string().min(1, { message: "La hora es obligatoria." }),
  plan: z.string({ required_error: "Debe seleccionar un plan." }),
  duration: z.string({ required_error: "Debe seleccionar una duración." }),
  paymentMethod: z.string({ required_error: "Debe seleccionar un método de pago." }),
  location: z.string().min(2, { message: "La ubicación es obligatoria." }),
  sector: z.string().min(2, { message: "El sector es obligatorio." }),
  contractedAmount: z.coerce.number().min(0, { message: "El monto debe ser positivo." }),
  amountPaid: z.coerce.number().min(0, { message: "El monto debe ser positivo." }),
  musiciansPay: z.coerce.number().min(0, { message: "El monto debe ser positivo." }).optional(),
  externalGroup: z.boolean().default(false),
  notes: z.string().optional(),
})

const formatCurrency = (value: number) => {
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
  
  const isEditMode = !!eventId;

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
      eventType: "",
      eventDate: dateFromQuery || "",
      eventTime: "",
      plan: "",
      duration: "",
      paymentMethod: "",
      location: "",
      sector: "",
      contractedAmount: 0,
      amountPaid: 0,
      musiciansPay: 0,
      externalGroup: false,
      notes: "",
    },
  })

  const { watch, setValue } = form
  const contractedAmount = watch("contractedAmount")
  const amountPaid = watch("amountPaid")
  const musiciansPay = watch("musiciansPay")
  const externalGroup = watch("externalGroup")
  const clientPhone = watch("clientPhone")

  const [pendingBalance, setPendingBalance] = useState(0)
  const [profit, setProfit] = useState(0)

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
    const balance = (Number(contractedAmount) || 0) - (Number(amountPaid) || 0);
    setPendingBalance(balance);
  }, [contractedAmount, amountPaid])

  useEffect(() => {
    const calculatedProfit = (Number(contractedAmount) || 0) - (Number(musiciansPay) || 0);
    setProfit(calculatedProfit);
  }, [contractedAmount, musiciansPay])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const result = isEditMode && eventId
                ? await updateEvent(eventId, values)
                : await createEvent(values);

        if (result.success) {
            toast({
                title: isEditMode ? "¡Evento Actualizado!" : "¡Evento Creado!",
                description: `El evento ha sido ${isEditMode ? 'actualizado' : 'guardado'} exitosamente.`,
            });
            router.push('/dashboard');
        } else {
             toast({
                variant: "destructive",
                title: `Error al ${isEditMode ? 'actualizar' : 'crear'} el evento`,
                description: result.error || "Hubo un problema al guardar. Inténtalo de nuevo.",
            });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-2xl flex items-center gap-2"><Info className="h-6 w-6" /> Detalles del Evento</CardTitle>
                          <CardDescription>Complete la información principal del evento y del cliente.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clientName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Nombre del Cliente</FormLabel>
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
                                        <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" />Teléfono del Cliente</FormLabel>
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
                                          <FormLabel className="flex items-center gap-2"><Mic className="h-4 w-4"/>Tipo de Evento</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger></FormControl>
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
                                          <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4"/>Plan Contratado</FormLabel>
                                           <Select onValueChange={field.onChange} value={field.value} defaultValue="">
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
                          <div className="grid sm:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="eventDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>Fecha</FormLabel>
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
                                            <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4"/>Hora</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar hora..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {timeOptions.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                  control={form.control}
                                  name="duration"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Duración</FormLabel>
                                           <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                              <FormControl><SelectTrigger><SelectValue placeholder="Duración..." /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                  {EVENT_DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
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
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Ubicación / Salón</FormLabel>
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
                                            <FormLabel>Sector / Colonia</FormLabel>
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
                      <CardHeader><CardTitle className="font-headline text-2xl flex items-center gap-2"><DollarSign className="h-6 w-6"/>Finanzas</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                           <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Método de Pago</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar método..." /></SelectTrigger></FormControl>
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
                                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
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
                                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="musiciansPay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pago a Músicos</FormLabel>
                                    <FormControl><Input type="number" step="0.01" placeholder="0.00" disabled={externalGroup} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="externalGroup"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="flex items-center gap-2"><ExternalLink className="h-4 w-4"/>¿Grupo Externo?</FormLabel>
                                    <p className="text-sm text-muted-foreground">Marcar si el evento lo realiza otro grupo.</p>
                                </div>
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
                             {externalGroup ? (
                                <span className="font-semibold text-muted-foreground">No aplica</span>
                             ) : (
                                <span className={`font-semibold ${profit < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(profit)}</span>
                             )}
                        </div>
                      </CardFooter>
                  </Card>
              </div>
          </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Crear Evento")}
        </Button>
      </form>
    </Form>
  )
}
