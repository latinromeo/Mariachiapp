
// src/services/eventService.ts
'use server';

import { add, sub, isBefore, startOfToday } from "date-fns";
import { 
    collection, 
    getDocs, 
    addDoc, 
    query, 
    where, 
    serverTimestamp,
    Timestamp,
    DocumentSnapshot,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- INTERFACES ---

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

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "audio";
  url: string;
  size: number; // in bytes
  uploadedBy: string;
  linkedEventId?: string;
  uploadedAt: string;
  tags?: string[];
  notes?: string;
  hint?: string;
}

export interface ManualFinanceEntry {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string; // Stored as 'YYYY-MM-DD'
  category?: string;
  createdBy: string;
  createdAt: string;
}


// --- FORM INPUT TYPES ---

type EventInputData = Omit<EventData, 'id'|'clientId'|'pendingBalance'|'profit'|'createdAt'|'updatedAt'|'status'>;
type ClientInputData = Omit<ClientData, 'id'|'createdAt'|'updatedAt'>;
type RehearsalInputData = Omit<RehearsalData, 'id'|'createdAt'|'updatedAt'>;
type ManualFinanceEntryInputData = Omit<ManualFinanceEntry, 'id'|'createdBy'|'createdAt'>;


// --- HELPER FUNCTIONS ---

// Helper to convert Firestore timestamps to ISO strings for client-side usage
const processDocTimestamps = (doc: DocumentSnapshot) => {
    const data = doc.data();
    if (!data) return null;

    const processedData: { [key: string]: any } = { id: doc.id };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            processedData[key] = data[key].toDate().toISOString();
        } else {
            processedData[key] = data[key];
        }
    }
    return processedData;
};


// --- CLIENT SERVICE FUNCTIONS ---

export async function getClients(): Promise<ClientData[]> {
    console.log("Fetching clients from Firestore");
    try {
        const clientsCol = collection(db, 'clients');
        const q = query(clientsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => processDocTimestamps(doc) as ClientData);
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function findClientByPhone(phone: string): Promise<ClientData | null> {
    try {
        const q = query(collection(db, 'clients'), where('phone', '==', phone));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        return processDocTimestamps(snapshot.docs[0]) as ClientData;
    } catch (error) {
        console.error("Error finding client by phone:", error);
        return null;
    }
}

export async function createClient(data: ClientInputData): Promise<{ success: boolean; clientId?: string; error?: string }> {
    const existingClient = await findClientByPhone(data.phone);
    if (existingClient) {
        return { success: false, error: "Ya existe un cliente con este número de teléfono." };
    }

    try {
        const docRef = await addDoc(collection(db, 'clients'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { success: true, clientId: docRef.id };
    } catch (error) {
        console.error("Error creating client:", error);
        return { success: false, error: "Failed to create client in database." };
    }
}


// --- EVENT SERVICE FUNCTIONS ---

export async function getEvents(): Promise<EventData[]> {
    console.log("Fetching events from Firestore");
     try {
        const eventsCol = collection(db, "events");
        const q = query(eventsCol, orderBy("eventDate", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => processDocTimestamps(doc) as EventData);
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function createEvent(data: EventInputData): Promise<{ success: boolean; eventId?: string, error?: string }> {
  let client = await findClientByPhone(data.clientPhone);
  let clientId = client?.id;

  if (!client) {
      const clientResult = await createClient({ name: data.clientName, phone: data.clientPhone, sector: data.sector });
      if (!clientResult.success || !clientResult.clientId) {
           return { success: false, error: "No se pudo crear el cliente asociado al evento." };
      }
      clientId = clientResult.clientId;
  }
  
  const pendingBalance = data.contractedAmount - data.amountPaid;
  const profit = data.externalGroup ? undefined : data.contractedAmount - (data.musiciansPay || 0);

  const newEventData = {
    ...data,
    clientId,
    pendingBalance,
    profit,
    status: 'pending', // Default status
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, "events"), newEventData);
    return { success: true, eventId: docRef.id };
  } catch (error) {
     console.error("Error creating event:", error);
     return { success: false, error: "Failed to create event in database." };
  }
}


// --- REHEARSAL SERVICE FUNCTIONS ---

export async function getRehearsals(): Promise<RehearsalData[]> {
    console.log("Fetching rehearsals from Firestore");
    try {
        const rehearsalsCol = collection(db, "rehearsals");
        // Firestore can't run the complex sort logic (past desc, future asc) directly.
        // We fetch all and sort in code. For larger datasets, this would need optimization.
        const snapshot = await getDocs(rehearsalsCol);
        const rehearsals = snapshot.docs.map(doc => processDocTimestamps(doc) as RehearsalData);
        
        rehearsals.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const today = startOfToday();
            const aIsPast = isBefore(dateA, today);
            const bIsPast = isBefore(dateB, today);

            if (aIsPast && !bIsPast) return 1;
            if (!aIsPast && bIsPast) return -1;
            if (!aIsPast) return dateA.getTime() - dateB.getTime();
            return dateB.getTime() - dateA.getTime();
        });
        
        return rehearsals;
    } catch (error) {
        console.error("Error fetching rehearsals:", error);
        return [];
    }
}

export async function createRehearsal(data: RehearsalInputData): Promise<{ success: boolean; rehearsalId?: string, error?: string }> {
  try {
    const docRef = await addDoc(collection(db, "rehearsals"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { success: true, rehearsalId: docRef.id };
  } catch (error) {
     console.error("Error creating rehearsal:", error);
     return { success: false, error: "Failed to create rehearsal in database." };
  }
}


// --- MANUAL FINANCE ENTRY FUNCTIONS ---

export async function getManualFinanceEntries(): Promise<ManualFinanceEntry[]> {
    console.log("Fetching manual finance entries from Firestore");
    try {
        const entriesCol = collection(db, "manualFinanceEntries");
        const q = query(entriesCol, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => processDocTimestamps(doc) as ManualFinanceEntry);
    } catch (error) {
        console.error("Error fetching manual entries:", error);
        return [];
    }
}

export async function createManualFinanceEntry(data: ManualFinanceEntryInputData): Promise<{ success: boolean; entryId?: string }> {
    try {
        const docRef = await addDoc(collection(db, 'manualFinanceEntries'), {
            ...data,
            createdBy: 'admin', // Hardcoded for now
            createdAt: serverTimestamp(),
        });
        return { success: true, entryId: docRef.id };
    } catch (error) {
        console.error("Error creating manual entry:", error);
        return { success: false };
    }
}


// --- MOCK DATA FOR STATIC CONTENT (TO BE MIGRATED) ---
// NOTE: In a real app, this data would also be fetched from Firestore.
// It is kept here for now to ensure the UI remains populated during development.

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

const media: MediaFile[] = [
    { id: 'med_1', name: 'Boda Pérez - Baile.jpg', type: 'image', url: 'https://placehold.co/600x400.png', size: 1200000, uploadedBy: 'admin', linkedEventId: 'evt_1', uploadedAt: new Date().toISOString(), tags: ['boda', 'fiesta'], hint: "mariachi wedding" },
    { id: 'med_2', name: 'Innovatech Speech.mp4', type: 'video', url: 'https://placehold.co/600x400.png', size: 25000000, uploadedBy: 'admin', linkedEventId: 'evt_2', uploadedAt: new Date().toISOString(), tags: ['corporativo'], hint: "conference presentation" },
    { id: 'med_3', name: 'Serenata a Carlos - Las Mañanitas.mp3', type: 'audio', url: 'https://placehold.co/600x400.png', size: 3500000, uploadedBy: 'admin', linkedEventId: 'evt_3', uploadedAt: new Date().toISOString(), tags: ['serenata', 'cumpleaños'], hint: "music notes" },
    { id: 'med_4', name: 'Ensayo Voces.jpg', type: 'image', url: 'https://placehold.co/400x600.png', size: 950000, uploadedBy: 'admin', uploadedAt: new Date().toISOString(), tags: ['ensayo'], hint: "choir singing" },
    { id: 'med_5', name: 'Foto de Grupo Promocional.jpg', type: 'image', url: 'https://placehold.co/600x400.png', size: 1500000, uploadedBy: 'admin', uploadedAt: new Date().toISOString(), tags: ['promo'], hint: "mariachi band" },
    { id: 'med_6', name: 'Video Testimonio Boda Pérez.mp4', type: 'video', url: 'https://placehold.co/600x400.png', size: 45000000, uploadedBy: 'admin', linkedEventId: 'evt_1', uploadedAt: new Date().toISOString(), tags: ['testimonio', 'boda'], hint: "wedding interview" },
    { id: 'med_7', name: 'Vihuela Solo.mp3', type: 'audio', url: 'https://placehold.co/600x400.png', size: 2100000, uploadedBy: 'admin', uploadedAt: new Date().toISOString(), tags: ['instrumental', 'ensayo'], hint: "guitar closeup" },
    { id: 'med_8', name: 'Fiesta Corporativa Ambiente.jpg', type: 'image', url: 'https://placehold.co/600x400.png', size: 1100000, uploadedBy: 'admin', linkedEventId: 'evt_2', uploadedAt: new Date().toISOString(), tags: ['corporativo'], hint: "corporate party" },
];

export async function getSongs(): Promise<SongDetail[]> {
    console.log("Obteniendo todas las canciones (mocked)");
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return JSON.parse(JSON.stringify(songs));
}

export async function getMedia(): Promise<MediaFile[]> {
    console.log("Obteniendo todos los archivos multimedia (mocked)");
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return JSON.parse(JSON.stringify(media));
}

export async function getSuggestedSongs(eventType: string): Promise<SongDetail[]> {
    const suggestions: SongDetail[] = [];
    const eventTypeLower = eventType.toLowerCase();

    songs.forEach(song => {
        if (song.suggestedEvents?.includes(eventTypeLower)) {
            suggestions.push(song);
        }
    });

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
