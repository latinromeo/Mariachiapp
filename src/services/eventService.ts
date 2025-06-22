// src/services/eventService.ts
'use server';

// Este es un servicio mock. En una aplicación real, esto interactuaría
// con una API de backend o una base de datos como Firestore.

export interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  sector?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface EventData {
  id: string;
  clientId: string; // Link to the client
  clientName: string; // Denormalized for convenience
  clientPhone: string; // Denormalized for convenience
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
const clients: ClientData[] = [
    { id: 'cli_1', name: "Familia Pérez", phone: "5551234567", email: "perez@email.com", sector: "Polanco", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cli_2', name: "Empresa Innovatech", phone: "5559876543", email: "contacto@innovatech.com", sector: "Santa Fe", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cli_3', name: "Juanita Ramírez", phone: "5555555555", email: "juanita.r@email.com", sector: "Condesa", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cli_4', name: "Carlos Mendoza", phone: "5551112222", email: "c.mendoza@email.com", sector: "Roma Norte", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const events: EventData[] = [];

// Tipo del schema del formulario para la data de entrada de eventos
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

// Tipo del schema del formulario para la data de entrada de clientes
type ClientInputData = {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    sector?: string;
    notes?: string;
}

// --- Funciones de Servicio de Clientes ---

export async function getClients(): Promise<ClientData[]> {
    console.log("Obteniendo todos los clientes:", clients);
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(JSON.stringify(clients)); // Retorna una copia
}

export async function findClientByPhone(phone: string): Promise<ClientData | null> {
    const client = clients.find(c => c.phone === phone);
    await new Promise(resolve => setTimeout(resolve, 400)); 
    return client ? JSON.parse(JSON.stringify(client)) : null;
}

export async function createClient(data: ClientInputData): Promise<{ success: boolean; client?: ClientData; error?: string }> {
    const existingClient = await findClientByPhone(data.phone);
    if (existingClient) {
        return { success: false, error: "Ya existe un cliente con este número de teléfono." };
    }

    const now = new Date().toISOString();
    const newClient: ClientData = {
        ...data,
        id: `cli_${new Date().getTime()}`,
        createdAt: now,
        updatedAt: now,
    };

    console.log("Guardando nuevo cliente:", newClient);
    clients.push(newClient);
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, client: newClient };
}


// --- Funciones de Servicio de Eventos ---

export async function createEvent(data: EventInputData): Promise<{ success: boolean; event?: EventData, error?: string }> {
  
  let client = await findClientByPhone(data.clientPhone);

  if (!client) {
      const clientResult = await createClient({ name: data.clientName, phone: data.clientPhone, sector: data.sector });
      if (!clientResult.success || !clientResult.client) {
           return { success: false, error: "No se pudo crear el cliente asociado al evento." };
      }
      client = clientResult.client;
  }
  
  const now = new Date().toISOString();
  const pendingBalance = data.contractedAmount - data.amountPaid;
  const profit = data.externalGroup ? undefined : data.contractedAmount - (data.musiciansPay || 0);

  const newEvent: EventData = {
    ...data,
    id: `evt_${new Date().getTime()}`,
    clientId: client.id,
    pendingBalance,
    profit,
    status: 'Pendiente', // Estatus por defecto
    createdAt: now,
    updatedAt: now,
  };

  console.log("Guardando nuevo evento:", newEvent);
  events.push(newEvent);

  await new Promise(resolve => setTimeout(resolve, 500));

  return { success: true, event: newEvent };
}

export async function getEvents(): Promise<EventData[]> {
    console.log("Obteniendo todos los eventos:", events);
    await new Promise(resolve => setTimeout(resolve, 300));
    return events;
}
