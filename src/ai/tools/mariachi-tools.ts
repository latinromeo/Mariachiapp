
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    getEvents, 
    getClients, 
    createEvent, 
    createManualFinanceEntry,
    createRehearsal,
} from '@/services/eventService';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Tool to list events
export const listEvents = ai.defineTool(
  {
    name: 'listEvents',
    description: 'Obtiene una lista de los eventos. Puede filtrarse opcionalmente por un rango de fechas. La IA debe inferir las fechas a partir de lenguaje natural (ej: "este mes", "mañana", "próxima semana"). Si no se especifica un rango, devuelve todos los eventos.',
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
    
    if (input.startDate || input.endDate) {
        const interval = {
            start: input.startDate ? startOfDay(parseISO(input.startDate)) : new Date(0),
            end: input.endDate ? endOfDay(parseISO(input.endDate)) : new Date(8640000000000000),
        };

        const filteredEvents = events.filter(e => {
            try {
                const eventDate = parseISO(e.eventDate);
                return isWithinInterval(eventDate, interval);
            } catch {
                return false;
            }
        });

        return filteredEvents.map(e => ({ 
            id: e.id, 
            clientName: e.clientName, 
            eventType: e.eventType, 
            eventDate: e.eventDate,
            eventTime: e.eventTime,
            location: e.location,
            status: e.status
        }));
    }
    
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
    clientName: z.string().describe("Nombre del cliente para el evento. Este campo es obligatorio."),
    eventDate: z.string().describe("Fecha del evento en formato YYYY-MM-DD. Este campo es obligatorio."),
    clientPhone: z.string().optional().describe("Teléfono del cliente. Necesario si es un cliente nuevo que no está en el sistema."),
    eventType: z.string().optional().describe("Tipo de evento (ej: boda, cumpleaños)."),
    eventTime: z.string().optional().describe("Hora del evento (ej: 8:00 PM)."),
    plan: z.string().optional().describe("Plan contratado (ej: 'express', '1_hora'). El asistente debe usar esto para calcular el costo si no se provee un monto específico."),
    paymentMethod: z.string().optional().describe("Método de pago (ej: cash, bank_deposit)."),
    location: z.string().optional().describe("Dirección o lugar del evento."),
    sector: z.string().optional().describe("Sector o zona donde se realizará el evento."),
    contractedAmount: z.number().optional().describe("Monto total contratado. Si no se especifica, se calculará a partir del 'plan' seleccionado."),
    amountPaid: z.number().optional().describe("Monto ya pagado o anticipo. Si no se especifica, se asume 0."),
    musiciansPay: z.number().optional().describe("Pago para los músicos. Si no se especifica, se calculará a partir del 'plan'."),
    externalGroup: z.boolean().default(false).describe("Indica si el evento es realizado por un grupo externo."),
    externalContact: z.string().optional().describe("Nombre e info de contacto del grupo externo (si aplica)."),
    notes: z.string().optional().describe("Notas adicionales sobre el evento."),
});

export const createNewEvent = ai.defineTool(
    {
        name: 'createEvent',
        description: 'Crea un nuevo evento en el calendario. Recopila la información necesaria y la guarda. El asistente debe ser capaz de inferir costos y pagos a músicos a partir del plan si no se especifican montos. Si falta información crítica como el teléfono de un cliente nuevo, debe solicitarla.',
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

// Tool to create a rehearsal
const CreateRehearsalInputSchema = z.object({
    date: z.string().describe("Fecha del ensayo en formato YYYY-MM-DD. Este campo es obligatorio."),
    time: z.string().describe("Hora del ensayo (ej: 5:00 PM). Este campo es obligatorio."),
    location: z.string().describe("Lugar o estudio del ensayo. Este campo es obligatorio."),
    focus: z.string().describe("Tema principal, canciones o enfoque del ensayo (ej: canciones de Ana Gabriel, repertorio de bodas). Este campo es obligatorio."),
    songs: z.array(z.object({
        name: z.string().describe("Nombre de la canción a ensayar."),
        artist: z.string().optional().describe("Artista original de la canción."),
    })).optional().describe("Lista de canciones específicas a ensayar si se pueden identificar."),
    notes: z.string().optional().describe("Notas adicionales sobre el ensayo."),
});

export const createNewRehearsal = ai.defineTool(
    {
        name: 'createRehearsal',
        description: 'Programa un nuevo ensayo para la banda. Recopila la información necesaria y la guarda.',
        inputSchema: CreateRehearsalInputSchema,
        outputSchema: z.object({
            success: z.boolean(),
            rehearsalId: z.string().optional(),
            error: z.string().optional(),
        }),
    },
    async (input) => {
        const result = await createRehearsal(input);
        return result;
    }
);
