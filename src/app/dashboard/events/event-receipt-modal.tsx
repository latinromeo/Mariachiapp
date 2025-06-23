
"use client"

import React, { useRef, useState } from "react"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, MessageSquare, Loader2 } from "lucide-react"
import { type EventData } from "@/services/eventService"
import { EVENT_PLANS, EVENT_TYPES, PAYMENT_METHODS } from "@/lib/constants"


interface EventReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  eventData: Partial<EventData> | null
}

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface ReceiptBodyProps {
  eventData: Partial<EventData>;
  eventTypeLabel: string;
  planLabel: string;
  paymentMethodLabel: string;
}

const ReceiptBody = React.forwardRef<HTMLDivElement, ReceiptBodyProps>(({ eventData, eventTypeLabel, planLabel, paymentMethodLabel }, ref) => (
  <div ref={ref} className="px-5 py-4 space-y-6 bg-white text-black">
    <div className="text-center space-y-2">
      <img
        src="/logo.svg"
        alt="Logo Mariachi Reyes de México"
        width={150}
        className="mx-auto"
      />
      <h2 className="text-2xl font-bold font-headline">Mariachi Reyes de México</h2>
      <p className="text-gray-500">Recibo de Confirmación de Evento</p>
    </div>
    <Separator />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
      <div className="space-y-3">
        <h3 className="font-semibold text-base border-b pb-1">Datos del Cliente</h3>
        <div className="space-y-1">
          <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Nombre:</span>
            <span className="font-medium text-right break-words">{eventData.clientName}</span>
          </div>
          <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Teléfono:</span>
            <span className="font-medium text-right break-words">{eventData.clientPhone}</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-base border-b pb-1">Detalles del Evento</h3>
        <div className="space-y-1">
          <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Tipo:</span>
            <span className="font-medium text-right break-words">{eventTypeLabel}</span>
          </div>
          <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Fecha:</span>
            <span className="font-medium text-right break-words">
              {eventData.eventDate
                ? format(parse(eventData.eventDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: es })
                : "N/A"}
            </span>
          </div>
          <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Hora:</span>
            <span className="font-medium text-right break-words">{eventData.eventTime}</span>
          </div>
          <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Dirección:</span>
            <span className="font-medium text-right break-words">
              {eventData.location}, {eventData.sector}
            </span>
          </div>
           <div className="grid grid-cols-2 items-start gap-2">
            <span className="text-gray-500">Duración:</span>
            <span className="font-medium text-right break-words">{planLabel}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-3">
      <h3 className="font-semibold text-base border-b pb-1">Información del Pago</h3>
      <div className="space-y-1.5">
        <div className="grid grid-cols-2 items-start">
          <span className="text-gray-500">Costo Total del Servicio:</span>
          <span className="font-bold text-base text-right">
            {formatCurrency(eventData.contractedAmount)}
          </span>
        </div>
        <div className="grid grid-cols-2 items-start">
          <span className="text-gray-500">Abono Realizado:</span>
          <span className="font-medium text-green-600 text-right">
            {formatCurrency(eventData.amountPaid)}
          </span>
        </div>
        <div className="grid grid-cols-2 items-start">
          <span className="text-gray-500">Monto Restante a Pagar:</span>
          <span className="font-bold text-base text-right text-red-600">
            {formatCurrency(eventData.pendingBalance)}
          </span>
        </div>
        <Separator className="!my-3" />
        <div className="grid grid-cols-2 items-start">
          <span className="text-gray-500">Fecha de Pago del Abono:</span>
          <span className="font-medium text-right">
            {format(new Date(), "dd/MM/yyyy", { locale: es })}
          </span>
        </div>
        <div className="grid grid-cols-2 items-start">
          <span className="text-gray-500">Método de Pago del Abono:</span>
          <span className="font-medium text-right">{paymentMethodLabel}</span>
        </div>
      </div>
    </div>
    <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500">
      <p>
        Este recibo confirma la contratación de nuestros servicios para la fecha indicada. Gracias por
        confiar en Mariachi Reyes de México. ¡Será un honor acompañarlos en su celebración!
      </p>
    </div>
  </div>
));
ReceiptBody.displayName = "ReceiptBody";


export function EventReceiptModal({ isOpen, onClose, eventData }: EventReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePdf = () => {
    const input = receiptRef.current;
    if (!input) return;

    setIsSaving(true);
    html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        .then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;

            const imgWidth = pdfWidth - 20; // 10mm margin each side
            const imgHeight = imgWidth / ratio;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`Recibo-Evento-${eventData?.clientName?.replace(/\s/g, '_') || 'sin_nombre'}.pdf`);
        })
        .catch(err => {
            console.error("Error generating PDF:", err);
            alert("Hubo un error al generar el PDF. Por favor, inténtelo de nuevo.");
        })
        .finally(() => {
            setIsSaving(false);
        });
  };

  if (!eventData) return null

  const eventTypeLabel = EVENT_TYPES.find(e => e.value === eventData.eventType)?.label || eventData.eventType
  const planLabel = EVENT_PLANS.find(p => p.value === eventData.plan)?.label || eventData.plan
  const paymentMethodLabel = PAYMENT_METHODS.find(p => p.value === eventData.paymentMethod)?.label || eventData.paymentMethod

  const whatsappMessage = `*Recibo de Confirmación de Evento - Mariachi Reyes de México*
-----------------------------------
*Datos del Cliente:*
- Nombre: ${eventData.clientName}
- Teléfono: ${eventData.clientPhone}

*Detalles del Evento:*
- Tipo: ${eventTypeLabel}
- Fecha: ${eventData.eventDate ? format(parse(eventData.eventDate, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", { locale: es }) : 'N/A'}
- Hora: ${eventData.eventTime}
- Dirección: ${eventData.location}, ${eventData.sector}
- Duración: ${planLabel}

*Información del Pago:*
- Costo Total: ${formatCurrency(eventData.contractedAmount)}
- Abono Realizado: ${formatCurrency(eventData.amountPaid)}
- Monto Restante: ${formatCurrency(eventData.pendingBalance)}
- Fecha de Pago: ${format(new Date(), "dd/MM/yyyy", { locale: es })}
- Método de Pago: ${paymentMethodLabel}

Gracias por confiar en Mariachi Reyes de México. ¡Será un honor acompañarlos en su celebración!`;

  const handleWhatsAppShare = () => {
    const phone = eventData.clientPhone?.replace(/\D/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  }

  const receiptContentProps = { eventData, eventTypeLabel, planLabel, paymentMethodLabel };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Evento Creado Exitosamente - Recibo</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-1">
           <ReceiptBody ref={receiptRef} {...receiptContentProps} />
        </div>
         <DialogFooter className="p-6 border-t bg-background flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button onClick={handleSavePdf} variant="outline" className="w-full sm:w-auto" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Guardando PDF...' : 'Guardar como PDF'}
                </Button>
                <Button onClick={handleWhatsAppShare} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enviar Resumen por WhatsApp
                </Button>
                <DialogClose asChild>
                    <Button variant="secondary" className="w-full sm:w-auto">Cerrar</Button>
                </DialogClose>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right mt-2">
                Para compartir el recibo por WhatsApp, guárdelo como PDF y luego adjúntelo en la conversación.
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
