'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    getEvents, 
    getClients, 
    createEvent, 
    createManualFinanceEntry,
} from '@/services/eventService';

// Tool to list events
export const listEvents = ai.defineTool(
  {
    name: 'listEvents',
    description: 'Obtiene una lista de los próximos eventos, opcionalmente filtrados por un rango de fechas.',
    inputSchema: z.object({
        startDate: z.string().optional().describe('Fecha de inicio en formato YYYY-MM-DD.'),
        endDate: z.string().optional().describe('Fecha de fin en formato YYYY-MM-DD.'),
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        clientName: z.string(),
        eventType: z.string(),
        eventDate: z.string(),
        eventTime: z.string(),
        location: z.string(),
        status: z.string(),
    })),
  },
  async (input) => {
    const events = await getEvents();
    // TODO: Implement date filtering based on input
    return events.map(e => ({ 
        id: e.id, 
        clientName: e.clientName, 
        eventType: e.eventType, 
        eventDate: e.eventDate,
        eventTime: e.eventTime,
        location: e.location,
        status: e.status
    }));
  }
);

// Tool to list clients
export const listClients = ai.defineTool(
    {
        name: 'listClients',
        description: 'Obtiene una lista de todos los clientes registrados.',
        inputSchema: z.object({}),
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            phone: z.string(),
            email: z.string().optional(),
        })),
    },
    async () => {
        const clients = await getClients();
        return clients.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email
        }));
    }
);

// Tool to create an event
const CreateEventInputSchema = z.object({
    clientName: z.string().describe("Nombre del cliente para el evento."),
    clientPhone: z.string().describe("Teléfono del cliente."),
    eventType: z.string().describe("Tipo de evento (ej: boda, cumpleaños)."),
    eventDate: z.string().describe("Fecha del evento en formato YYYY-MM-DD."),
    eventTime: z.string().describe("Hora del evento (ej: 8:00 PM)."),
    plan: z.string().describe("Plan contratado (ej: 1_hora, express)."),
    paymentMethod: z.string().describe("Método de pago (ej: cash, bank_deposit)."),
    location: z.string().describe("Dirección o lugar del evento."),
    sector: z.string().describe("Sector o zona donde se realizará el evento."),
    contractedAmount: z.number().describe("Monto total contratado por el servicio."),
    amountPaid: z.number().describe("Monto ya pagado o anticipo."),
    musiciansPay: z.number().optional().describe("Pago para los músicos (si aplica)."),
    externalGroup: z.boolean().default(false).describe("Indica si el evento es realizado por un grupo externo."),
    externalContact: z.string().optional().describe("Nombre e info de contacto del grupo externo (si aplica)."),
    notes: z.string().optional().describe("Notas adicionales sobre el evento."),
});

export const createNewEvent = ai.defineTool(
    {
        name: 'createEvent',
        description: 'Crea un nuevo evento en el calendario. Recopila toda la información necesaria y la guarda.',
        inputSchema: CreateEventInputSchema,
        outputSchema: z.object({
            success: z.boolean(),
            eventId: z.string().optional(),
            error: z.string().optional(),
        }),
    },
    async (input) => {
        const result = await createEvent(input);
        return result;
    }
);

// Tool to create a manual finance entry
const CreateFinanceEntryInputSchema = z.object({
    type: z.enum(["income", "expense"]).describe("Tipo de asiento: 'income' para ingreso, 'expense' para gasto."),
    description: z.string().describe("Descripción del asiento financiero."),
    amount: z.number().positive().describe("El monto del asiento."),
    date: z.string().describe("La fecha del asiento en formato YYYY-MM-DD."),
    category: z.string().optional().describe("Categoría del asiento (ej: transporte, instrumentos)."),
});

export const createFinanceEntry = ai.defineTool(
    {
        name: 'createFinanceEntry',
        description: 'Registra un nuevo asiento financiero manual, ya sea un ingreso o un gasto.',
        inputSchema: CreateFinanceEntryInputSchema,
        outputSchema: z.object({
            success: z.boolean(),
            entryId: z.string().optional(),
        }),
    },
    async (input) => {
        const result = await createManualFinanceEntry(input);
        return result;
    }
);
