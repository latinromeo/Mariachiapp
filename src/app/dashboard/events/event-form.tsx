
"use client"

import { useForm, useWatch } from "react-hook-form"
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
import { useEffect, useState } from "react"

const formSchema = z.object({
  clientName: z.string().min(2, { message: "El nombre del cliente es obligatorio." }),
  clientPhone: z.string().regex(/^\d{10,12}$/, { message: "El teléfono debe tener entre 10 y 12 dígitos." }),
  eventType: z.string({ required_error: "Debe seleccionar un tipo de evento." }),
  eventDate: z.string().min(1, { message: "La fecha es obligatoria." }),
  eventTime: z.string().min(1, { message: "La hora es obligatoria." }),
  plan: z.string().optional(),
  duration: z.string({ required_error: "Debe seleccionar una duración." }),
  paymentMethod: z.string({ required_error: "Debe seleccionar un método de pago." }),
  location: z.string().min(2, { message: "La ubicación es obligatoria." }),
  sector: z.string().min(2, { message: "El sector es obligatorio." }),
  contractedAmount: z.preprocess(
    (a) => parseFloat(String(a).replace(/[^0-9.-]+/g, "")),
    z.number().min(0, { message: "El monto debe ser positivo." })
  ),
  amountPaid: z.preprocess(
    (a) => parseFloat(String(a).replace(/[^0-9.-]+/g, "")),
    z.number().min(0, { message: "El monto debe ser positivo." })
  ),
  musiciansPay: z.preprocess(
    (a) => parseFloat(String(a).replace(/[^0-9.-]+/g, "")),
    z.number().min(0, { message: "El monto debe ser positivo." }).optional()
  ),
  externalGroup: z.boolean().default(false),
  notes: z.string().optional(),
})

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
};

export function EventForm() {
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      eventDate: "",
      eventTime: "",
      location: "",
      sector: "",
      contractedAmount: 0,
      amountPaid: 0,
      musiciansPay: 0,
      externalGroup: false,
      notes: "",
    },
  })

  const { control, watch } = form
  const contractedAmount = useWatch({ control, name: "contractedAmount" })
  const amountPaid = useWatch({ control, name: "amountPaid" })
  const musiciansPay = useWatch({ control, name: "musiciansPay" })
  const externalGroup = useWatch({ control, name: "externalGroup" })

  const [pendingBalance, setPendingBalance] = useState(0)
  const [profit, setProfit] = useState(0)

  useEffect(() => {
    const balance = (contractedAmount || 0) - (amountPaid || 0);
    setPendingBalance(balance);
  }, [contractedAmount, amountPaid])

  useEffect(() => {
    const calculatedProfit = (contractedAmount || 0) - (musiciansPay || 0);
    setProfit(calculatedProfit);
  }, [contractedAmount, musiciansPay])

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast({
        title: "¡Evento Creado!",
        description: "El nuevo evento ha sido guardado exitosamente.",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-2xl">Detalles del Evento</CardTitle>
                          <CardDescription>Complete la información para el nuevo evento.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <FormField
                              control={form.control}
                              name="clientName"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Nombre del Cliente</FormLabel>
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
                                      <FormLabel>Teléfono del Cliente</FormLabel>
                                      <FormControl><Input type="tel" placeholder="Ej: 5551234567" {...field} /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <div className="grid sm:grid-cols-2 gap-4">
                              <FormField
                                  control={form.control}
                                  name="eventType"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Tipo de Evento</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                  <SelectItem value="boda">Boda</SelectItem>
                                                  <SelectItem value="cumpleanos">Cumpleaños</SelectItem>
                                                  <SelectItem value="serenata">Serenata</SelectItem>
                                                  <SelectItem value="corporativo">Corporativo</SelectItem>
                                                  <SelectItem value="otro">Otro</SelectItem>
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
                                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar duración..." /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                  <SelectItem value="1_hora">1 Hora</SelectItem>
                                                  <SelectItem value="2_horas">2 Horas</SelectItem>
                                                  <SelectItem value="3_horas">3 Horas</SelectItem>
                                                  <SelectItem value="otro">Personalizada</SelectItem>
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
                                            <FormLabel>Fecha</FormLabel>
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
                                            <FormLabel>Hora</FormLabel>
                                            <FormControl><Input type="time" {...field} /></FormControl>
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
                                            <FormLabel>Ubicación / Salón</FormLabel>
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
                      <CardHeader><CardTitle className="font-headline text-2xl">Finanzas</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                           <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Método de Pago</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar método..." /></SelectTrigger></FormControl>
                                          <SelectContent>
                                              <SelectItem value="cash">Efectivo</SelectItem>
                                              <SelectItem value="transfer">Transferencia</SelectItem>
                                              <SelectItem value="card">Tarjeta</SelectItem>
                                              <SelectItem value="pending">Pendiente</SelectItem>
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
                                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
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
                                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
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
                                    <FormControl><Input type="number" placeholder="0.00" disabled={externalGroup} {...field} /></FormControl>
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
                                    <FormLabel>¿Grupo Externo?</FormLabel>
                                    <p className="text-sm text-muted-foreground">Marcar si el evento lo realiza otro grupo.</p>
                                </div>
                                </FormItem>
                            )}
                          />
                      </CardContent>
                      <CardFooter className="flex flex-col items-start gap-2 text-sm">
                        <div className="flex justify-between w-full">
                            <span className="text-muted-foreground">Saldo Pendiente:</span>
                            <span className="font-semibold">{formatCurrency(pendingBalance)}</span>
                        </div>
                        <div className="flex justify-between w-full">
                            <span className="text-muted-foreground">Ganancia:</span>
                            <span className="font-semibold">{formatCurrency(profit)}</span>
                        </div>
                      </CardFooter>
                  </Card>
              </div>
          </div>
        <Button type="submit" size="lg">Crear Evento</Button>
      </form>
    </Form>
  )
}
