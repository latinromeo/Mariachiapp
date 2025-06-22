// src/services/eventService.ts
'use server';

// Este es un servicio mock. En una aplicación real, esto interactuaría
// con una API de backend o una base de datos como Firestore.

export interface EventData {
  id: string;
  clientName: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  plan: string;
  duration: string;
  paymentMethod: string;
  location: string;
  sector: string;
  contractedAmount: number;
  amountPaid: number;
  pendingBalance: number;
  musiciansPay?: number;
  profit?: number;
  externalGroup: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: 'Confirmado' | 'Pendiente' | 'Cancelado';
}

// Un arreglo en memoria para actuar como base de datos por ahora
const events: EventData[] = [];

// Usamos el tipo del schema del formulario para la data de entrada
type EventInputData = {
    clientName: string;
    clientPhone: string;
    eventType: string;
    eventDate: string;
    eventTime: string;
    plan: string;
    duration: string;
    paymentMethod: string;
    location: string;
    sector: string;
    contractedAmount: number;
    amountPaid: number;
    musiciansPay?: number;
    externalGroup: boolean;
    notes?: string;
}

export async function createEvent(data: EventInputData): Promise<{ success: boolean; event: EventData }> {
  
  const now = new Date().toISOString();
  
  const pendingBalance = data.contractedAmount - data.amountPaid;
  const profit = data.externalGroup ? undefined : data.contractedAmount - (data.musiciansPay || 0);

  const newEvent: EventData = {
    ...data,
    id: `evt_${new Date().getTime()}`,
    pendingBalance,
    profit,
    status: 'Pendiente', // Estatus por defecto
    createdAt: now,
    updatedAt: now,
  };

  console.log("Guardando nuevo evento:", newEvent);
  events.push(newEvent);

  // Simula un retraso de la API
  await new Promise(resolve => setTimeout(resolve, 500));

  return { success: true, event: newEvent };
}

export async function getEvents(): Promise<EventData[]> {
    console.log("Obteniendo todos los eventos:", events);
    // Simula un retraso de la API
    await new Promise(resolve => setTimeout(resolve, 300));
    return events;
}

export async function findClientByPhone(phone: string): Promise<{ name: string; phone: string } | null> {
    const clients = [
        { name: "Familia Pérez", phone: "5551234567" },
        { name: "Empresa Innovatech", phone: "5559876543" },
        { name: "Juanita Ramírez", phone: "5555555555" },
        { name: "Carlos Mendoza", phone: "5551112222" },
    ];
    
    const client = clients.find(c => c.phone === phone);

    // Simula un retraso de la API
    await new Promise(resolve => setTimeout(resolve, 400)); 

    if (client) {
        return { name: client.name, phone: client.phone };
    }
    
    return null;
}
