
// src/services/eventService.ts
'use server';

import { add, sub, isBefore, startOfToday } from "date-fns";

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
  clientId: string; 
  clientName: string; 
  clientPhone: string;
  eventType: string;
  eventDate: string; // Stored as 'YYYY-MM-DD'
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
  status: 'confirmed' | 'pending' | 'external' | 'cancelled';
}

export interface RehearsalData {
  id: string;
  date: string; // Stored as 'YYYY-MM-DD'
  time: string;
  location: string;
  focus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SongDetail {
  id: string;
  title: string;
  artist?: string;
  category: string;
  key?: string;
  suggestedEvents?: string[];
  notes?: string;
}

export const SONG_CATEGORIES = [
  'Románticas',
  'Cumpleaños',
  'Serenatas',
  'Dolor',
  'Rancheras',
  'Corridos',
  'Cumbias',
  'Sones',
  'Pop en Mariachi',
  'Infantiles',
  'Clásicos Mexicanos',
  'Huapangos'
];

// --- MOCK DATABASE ---

const clients: ClientData[] = [
    { id: 'cli_1', name: "Familia Pérez", phone: "5551234567", email: "perez@email.com", sector: "Polanco", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cli_2', name: "Empresa Innovatech", phone: "5559876543", email: "contacto@innovatech.com", sector: "Santa Fe", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cli_3', name: "Juanita Ramírez", phone: "5555555555", email: "juanita.r@email.com", sector: "Condesa", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cli_4', name: "Carlos Mendoza", phone: "5551112222", email: "c.mendoza@email.com", sector: "Roma Norte", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const events: EventData[] = [
    {
        id: 'evt_1', clientId: 'cli_1', clientName: 'Familia Pérez', clientPhone: '5551234567', eventType: 'boda', 
        eventDate: new Date().toISOString().split('T')[0], eventTime: '8:00 PM', plan: 'evento_premium', duration: '2_horas', paymentMethod: 'transfer',
        location: 'Salón La Candelaria', sector: 'Polanco', contractedAmount: 5000, amountPaid: 2500, pendingBalance: 2500,
        musiciansPay: 1500, profit: 3500, externalGroup: false, notes: 'Tocar "Si Nos Dejan" al inicio.',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'confirmed'
    },
    {
        id: 'evt_2', clientId: 'cli_2', clientName: 'Empresa Innovatech', clientPhone: '5559876543', eventType: 'corporativo', 
        eventDate: add(new Date(), { days: 5 }).toISOString().split('T')[0], eventTime: '9:00 PM', plan: 'hora_completa', duration: '1_hora', paymentMethod: 'pending',
        location: 'Oficinas Innovatech', sector: 'Santa Fe', contractedAmount: 3000, amountPaid: 0, pendingBalance: 3000,
        musiciansPay: 1000, profit: 2000, externalGroup: false, notes: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'pending'
    },
     {
        id: 'evt_3', clientId: 'cli_4', clientName: 'Carlos Mendoza', clientPhone: '5551112222', eventType: 'serenata', 
        eventDate: sub(new Date(), { days: 2 }).toISOString().split('T')[0], eventTime: '10:00 PM', plan: 'serenata_basica', duration: '30_min', paymentMethod: 'cash',
        location: 'Residencia Privada', sector: 'Roma Norte', contractedAmount: 1500, amountPaid: 1500, pendingBalance: 0,
        musiciansPay: 500, profit: 1000, externalGroup: true, notes: 'Grupo externo: Mariachi Sol de México',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'external'
    }
];
const rehearsals: RehearsalData[] = [
    { id: 'reh_1', date: add(new Date(), { days: 3 }).toISOString().split('T')[0], time: '6:00 PM', location: 'Estudio de Música A', focus: 'Nuevo Setlist de Boda', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'reh_2', date: add(new Date(), { days: 10 }).toISOString().split('T')[0], time: '7:00 PM', location: 'Salón Comunitario', focus: 'Armonías Vocales', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'reh_3', date: sub(new Date(), { days: 4 }).toISOString().split('T')[0], time: '8:00 PM', location: 'Estudio de Música B', focus: 'Repertorio para XV Años', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const songs: SongDetail[] = [
  // Románticas
  { id: 'song_1', title: 'Gema', artist: 'Los Dandys', category: 'Románticas', key: 'G', suggestedEvents: ['boda', 'serenata'] },
  { id: 'song_2', title: 'Hermoso Cariño', artist: 'Vicente Fernández', category: 'Románticas', key: 'A', suggestedEvents: ['boda'] },
  { id: 'song_3', title: 'Motivos', artist: 'Vicente Fernández', category: 'Románticas', key: 'D', suggestedEvents: ['boda', 'serenata'] },
  { id: 'song_4', title: 'Contigo Aprendí', artist: 'Armando Manzanero', category: 'Románticas', key: 'C', suggestedEvents: ['boda', 'corporativo'] },
  { id: 'song_5', title: 'Si Nos Dejan', artist: 'José Alfredo Jiménez', category: 'Románticas', key: 'G', suggestedEvents: ['boda', 'serenata'] },

  // Cumpleaños
  { id: 'song_6', title: 'Las Mañanitas', artist: 'Tradicional', category: 'Cumpleaños', key: 'G', suggestedEvents: ['cumpleanos'] },
  { id: 'song_7', title: 'Cielito Lindo', artist: 'Quirino Mendoza y Cortés', category: 'Clásicos Mexicanos', key: 'D', suggestedEvents: ['cumpleanos', 'fiesta'] },
  { id: 'song_8', title: 'Qué Linda Está La Mañana', artist: 'Tradicional', category: 'Cumpleaños', key: 'A', suggestedEvents: ['cumpleanos'] },
  { id: 'song_9', title: 'El Rey', artist: 'José Alfredo Jiménez', category: 'Rancheras', key: 'G', suggestedEvents: ['cumpleanos', 'fiesta'] },

  // Dolor
  { id: 'song_10', title: 'Acá Entre Nos', artist: 'Vicente Fernández', category: 'Dolor', key: 'A', suggestedEvents: ['despecho'] },
  { id: 'song_11', title: 'Te Solté la Rienda', artist: 'José Alfredo Jiménez', category: 'Dolor', key: 'G', suggestedEvents: ['despecho'] },
  { id: 'song_12', title: 'Urge', artist: 'Vicente Fernández', category: 'Dolor', key: 'C', suggestedEvents: ['despecho'] },
  { id: 'song_13', title: 'La Diferencia', artist: 'Juan Gabriel', category: 'Dolor', key: 'Am', suggestedEvents: ['despecho'] },

  // Sones
  { id: 'song_14', title: 'El Son de la Negra', artist: 'Tradicional', category: 'Sones', key: 'G', suggestedEvents: ['fiesta', 'corporativo'] },
  { id: 'song_15', title: 'La Bikina', artist: 'Rubén Fuentes', category: 'Sones', key: 'Am', suggestedEvents: ['fiesta', 'corporativo'] },
  { id: 'song_16', title: 'El Jarabe Tapatío', artist: 'Tradicional', category: 'Sones', key: 'D', suggestedEvents: ['fiesta', 'boda'] },

  // Pop en Mariachi
  { id: 'song_17', title: 'Amor Eterno', artist: 'Juan Gabriel / Rocío Dúrcal', category: 'Pop en Mariachi', key: 'Dm', suggestedEvents: ['funeral', 'homenaje'] },
  { id: 'song_18', title: 'Te Amo', artist: 'Franco de Vita', category: 'Pop en Mariachi', key: 'G', suggestedEvents: ['boda', 'romantica'] },
  { id: 'song_19', title: 'Por Amarte Así', artist: 'Cristian Castro', category: 'Pop en Mariachi', key: 'C', suggestedEvents: ['romantica'] },
  { id: 'song_20', title: 'Hasta Que Me Olvides', artist: 'Luis Miguel', category: 'Pop en Mariachi', key: 'F', suggestedEvents: ['romantica', 'despecho'] },

  // Clásicos Mexicanos
  { id: 'song_21', title: 'Guadalajara', artist: 'Pepe Guízar', category: 'Clásicos Mexicanos', key: 'D', suggestedEvents: ['fiesta', 'nacional'] },
  { id: 'song_22', title: 'México Lindo y Querido', artist: 'Chucho Monge', category: 'Clásicos Mexicanos', key: 'G', suggestedEvents: ['fiesta', 'nacional'] },
  
  // Serenatas
  { id: 'song_23', title: 'Sabes Una Cosa', artist: 'Luis Miguel', category: 'Serenatas', key: 'A', suggestedEvents: ['serenata', 'romantica'] },
  { id: 'song_24', title: 'Si Quieres', artist: 'Juan Gabriel', category: 'Serenatas', key: 'D', suggestedEvents: ['serenata', 'romantica'] },
];

// Tipo del schema del formulario para la data de entrada de eventos
type EventInputData = Omit<EventData, 'id'|'clientId'|'pendingBalance'|'profit'|'createdAt'|'updatedAt'|'status'>;
type ClientInputData = Omit<ClientData, 'id'|'createdAt'|'updatedAt'>;
type RehearsalInputData = Omit<RehearsalData, 'id'|'createdAt'|'updatedAt'>;


// --- Funciones de Servicio de Clientes ---

export async function getClients(): Promise<ClientData[]> {
    console.log("Obteniendo todos los clientes");
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
    status: 'pending', // Estatus por defecto
    createdAt: now,
    updatedAt: now,
  };

  events.push(newEvent);

  await new Promise(resolve => setTimeout(resolve, 500));

  return { success: true, event: newEvent };
}

export async function getEvents(): Promise<EventData[]> {
    console.log("Obteniendo todos los eventos");
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(JSON.stringify(events));
}


// --- Funciones de Servicio de Ensayos ---

export async function getRehearsals(): Promise<RehearsalData[]> {
    console.log("Obteniendo todos los ensayos");
    await new Promise(resolve => setTimeout(resolve, 300));

    const sortedRehearsals = [...rehearsals].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const today = startOfToday();

        const aIsPast = isBefore(dateA, today);
        const bIsPast = isBefore(dateB, today);

        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;

        if (!aIsPast) { // Both are upcoming or today
            return dateA.getTime() - dateB.getTime(); // Sort ascending (closest first)
        }
        
        // Both are past
        return dateB.getTime() - dateA.getTime(); // Sort descending (most recent first)
    });

    return JSON.parse(JSON.stringify(sortedRehearsals));
}

export async function createRehearsal(data: RehearsalInputData): Promise<{ success: boolean; rehearsal?: RehearsalData, error?: string }> {
  const now = new Date().toISOString();
  const newRehearsal: RehearsalData = {
    ...data,
    id: `reh_${new Date().getTime()}`,
    createdAt: now,
    updatedAt: now,
  };

  rehearsals.push(newRehearsal);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, rehearsal: newRehearsal };
}


// --- Funciones de Servicio de Repertorio ---

export async function getSongs(): Promise<SongDetail[]> {
    console.log("Obteniendo todas las canciones");
    await new Promise(resolve => setTimeout(resolve, 500));
    return JSON.parse(JSON.stringify(songs));
}

export async function getSuggestedSongs(eventType: string): Promise<SongDetail[]> {
    const suggestions: SongDetail[] = [];
    const eventTypeLower = eventType.toLowerCase();

    songs.forEach(song => {
        if (song.suggestedEvents?.includes(eventTypeLower)) {
            suggestions.push(song);
        }
    });

    // Add more logic if needed, e.g. based on category
    const categoryMap: Record<string, string[]> = {
        'boda': ['Románticas', 'Pop en Mariachi'],
        'cumpleanos': ['Cumpleaños', 'Infantiles', 'Rancheras'],
        'serenata': ['Serenatas', 'Románticas'],
        'funeral': ['Dolor'],
        'corporativo': ['Clásicos Mexicanos', 'Pop en Mariachi', 'Sones']
    };

    if (categoryMap[eventTypeLower]) {
        songs.forEach(song => {
            if (categoryMap[eventTypeLower].includes(song.category) && !suggestions.find(s => s.id === song.id)) {
                suggestions.push(song);
            }
        });
    }

    return JSON.parse(JSON.stringify(suggestions));
}
