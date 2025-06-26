
// src/services/eventService.ts
'use server';

import { db } from '@/lib/firebase';
import { 
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    orderBy,
    writeBatch,
    type DocumentSnapshot,
    setDoc
} from 'firebase/firestore';
import { EVENT_PLANS } from "@/lib/constants";

// --- HELPER FUNCTIONS ---

const cleanForFirestore = (data: any): any => {
    if (data === null || data === undefined) {
        return null; // Firestore can handle nulls, but not undefined
    }
    if (Array.isArray(data)) {
        return data.map(item => cleanForFirestore(item));
    }
    // Ensure we don't process Timestamps or other special objects
    if (typeof data === 'object' && !(data instanceof Date) && typeof data.toDate !== 'function') {
        const cleaned: { [key: string]: any } = {};
        for (const key of Object.keys(data)) {
            if (data[key] !== undefined) {
                cleaned[key] = cleanForFirestore(data[key]);
            }
        }
        return cleaned;
    }
    return data;
};

const processDocTimestamps = (docSnap: DocumentSnapshot) => {
    const data = docSnap.data();
    if (!data) return null;

    const processedData: { [key: string]: any } = { id: docSnap.id };
    for (const key in data) {
        const value = data[key];
        // Check if it's a Firestore Timestamp and convert it
        if (value && typeof value.toDate === 'function') {
            processedData[key] = value.toDate().toISOString();
        } else {
            processedData[key] = value;
        }
    }
    return processedData;
};


// --- INTERFACES ---

export interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  sector?: string;
  createdAt: any;
  updatedAt: any;
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
  paymentMethod: string;
  location: string;
  sector: string;
  contractedAmount: number;
  amountPaid: number;
  pendingBalance: number;
  musiciansPay?: number;
  profit?: number;
  externalGroup: boolean;
  externalContact?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  status: 'confirmed' | 'pending' | 'external' | 'cancelled' | 'completed';
  receiptUrlPDF?: string | null;
}

export interface SongToRehearse {
  name: string;
  artist?: string;
  key?: string;
  youtubeUrl?: string;
  sheetMusicUrl?: string;
  audioUrl?: string;
}

export interface RehearsalData {
  id: string;
  date: string; // Stored as 'YYYY-MM-DD'
  time: string;
  location: string;
  focus: string;
  songs?: SongToRehearse[];
  notes?: string;
  createdAt: any;
  updatedAt: any;
  status: 'pending' | 'completed';
}

export interface SongDetail {
  id: string;
  title: string;
  artist?: string;
  category: string;
  key?: string;
  suggestedEvents?: string[];
  lyrics?: string;
  notes?: string;
  sheetMusicUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  createdAt: any;
  updatedAt?: any;
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
  invoiceUrl?: string;
  createdBy: string;
  createdAt: any;
}

export interface MusicianIncome {
    id: string; // Will be composite key userId_eventId
    userId: string;
    eventId: string;
    amount: number;
    date: string; // event date
    createdAt: any;
    updatedAt: any;
}

export interface MusicianExpense {
    id:string;
    userId: string;
    description: string;
    category: string;
    amount: number;
    date: string; // 'YYYY-MM-DD'
    createdAt: any;
}


// --- FORM INPUT TYPES ---

type EventInputData = Omit<EventData, 'id'|'pendingBalance'|'profit'|'createdAt'|'updatedAt'|'status'|'receiptUrlPDF'> & { 
    otherExternalContact?: string;
};
type ClientInputData = Omit<ClientData, 'id'|'createdAt'|'updatedAt'>;
type RehearsalInputData = Omit<RehearsalData, 'id'|'createdAt'|'updatedAt'|'status'>;
type ManualFinanceEntryInputData = Omit<ManualFinanceEntry, 'id'|'createdBy'|'createdAt'>;
type SongInputData = Omit<SongDetail, 'id' | 'createdAt' | 'updatedAt' | 'suggestedEvents'>;
type MusicianExpenseInput = Omit<MusicianExpense, 'id' | 'userId' | 'createdAt'>;


// --- CLIENT SERVICE FUNCTIONS ---

export async function getClients(): Promise<ClientData[]> {
    try {
        const q = query(collection(db, 'clients'), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as ClientData[];
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function findClientByPhone(phone: string): Promise<ClientData | null> {
    try {
        const q = query(collection(db, 'clients'), where('phone', '==', phone), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
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
        const payload = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const docRef = await addDoc(collection(db, 'clients'), cleanForFirestore(payload));
        return { success: true, clientId: docRef.id };
    } catch (error) {
        console.error("Error creating client:", error);
        return { success: false, error: "Failed to create client in database." };
    }
}

export async function getClientById(id: string): Promise<ClientData | null> {
    try {
        const docRef = doc(db, "clients", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.error("No such client!");
            return null;
        }
        return processDocTimestamps(docSnap) as ClientData;
    } catch (error) {
        console.error("Error fetching client by ID:", error);
        return null;
    }
}

export async function updateClient(id: string, data: Partial<ClientInputData>): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, "clients", id);
        const payload = {
            ...data,
            updatedAt: new Date(),
        };
        await updateDoc(docRef, cleanForFirestore(payload));
        return { success: true };
    } catch (error) {
        console.error("Error updating client:", error);
        return { success: false, error: "Failed to update client in database." };
    }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, "clients", id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting client:", error);
        return { success: false, error: "Failed to delete client from database." };
    }
}

export async function getClientCount(): Promise<number> {
    try {
        const q = query(collection(db, 'clients'));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error fetching client count:", error);
        return 0;
    }
}

// --- EVENT SERVICE FUNCTIONS ---

export async function getEvents(): Promise<EventData[]> {
    try {
        const q = query(collection(db, 'events'), orderBy("eventDate", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as EventData[];
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getEventById(id: string): Promise<EventData | null> {
    try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.error("No such event!");
            return null;
        }
        return processDocTimestamps(docSnap) as EventData;
    } catch (error) {
        console.error("Error fetching event by ID:", error);
        return null;
    }
}

export async function createEvent(data: EventInputData): Promise<{ success: boolean; eventId?: string, error?: string }> {
  let clientId = data.clientId;

  if (!clientId) {
    if (!data.clientPhone) {
        return { success: false, error: "Para crear un nuevo cliente, el número de teléfono es obligatorio." };
    }
    let client = await findClientByPhone(data.clientPhone);
    if (client) {
      clientId = client.id;
    } else {
      const clientResult = await createClient({ name: data.clientName, phone: data.clientPhone });
      if (!clientResult.success || !clientResult.clientId) {
        return { success: false, error: "No se pudo crear el cliente asociado al evento." };
      }
      clientId = clientResult.clientId;
    }
  }
  
  const selectedPlan = data.plan ? EVENT_PLANS.find(p => p.value === data.plan) : null;

  const contractedAmount = data.contractedAmount ?? selectedPlan?.price ?? 0;
  const musiciansPay = data.musiciansPay ?? (data.externalGroup ? 0 : (selectedPlan?.musicianPay ?? 0));
  const amountPaid = data.amountPaid ?? 0;

  const pendingBalance = contractedAmount - amountPaid;
  const profit = contractedAmount - musiciansPay;

  let finalExternalContact = data.externalContact;
  if (data.externalContact === 'otro' && data.otherExternalContact) {
      finalExternalContact = data.otherExternalContact;
  }

  const { otherExternalContact, ...eventDataForFirestore } = data;

  const newEventData = {
    ...eventDataForFirestore,
    clientId,
    externalContact: finalExternalContact,
    contractedAmount,
    amountPaid,
    musiciansPay,
    pendingBalance,
    profit,
    status: data.externalGroup ? 'external' as const : 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const docRef = await addDoc(collection(db, "events"), cleanForFirestore(newEventData));
    return { success: true, eventId: docRef.id };
  } catch (error) {
     console.error("Error creating event:", error);
     return { success: false, error: "Failed to create event in database." };
  }
}

export async function updateEvent(id: string, data: Partial<EventInputData | { receiptUrlPDF: string | null }>): Promise<{ success: boolean; error?: string }> {
    const eventRef = doc(db, "events", id);

    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            return { success: false, error: "Event not found." };
        }
        
        const existingData = eventSnap.data() as EventData;
        const mergedData = { ...existingData, ...data };
        const selectedPlan = mergedData.plan ? EVENT_PLANS.find(p => p.value === mergedData.plan) : null;

        const contractedAmount = data.contractedAmount !== undefined ? data.contractedAmount : (data.plan ? (selectedPlan?.price ?? existingData.contractedAmount) : existingData.contractedAmount);
        const musiciansPay = data.musiciansPay !== undefined ? data.musiciansPay : (data.plan && !mergedData.externalGroup ? (selectedPlan?.musicianPay ?? existingData.musiciansPay) : existingData.musiciansPay);
        const amountPaid = data.amountPaid !== undefined ? data.amountPaid : existingData.amountPaid;
        
        const pendingBalance = contractedAmount - amountPaid;
        const profit = contractedAmount - (musiciansPay || 0);
        
        let finalExternalContact = mergedData.externalContact;
        if (data.externalContact === 'otro' && data.otherExternalContact) {
            finalExternalContact = data.otherExternalContact;
        }

        const { otherExternalContact, ...updateDataForFirestore } = data;

        const updatePayload: { [key: string]: any } = {
            ...updateDataForFirestore,
            externalContact: finalExternalContact,
            pendingBalance,
            profit,
            contractedAmount,
            musiciansPay,
            amountPaid,
            updatedAt: new Date(),
        };

        if (data.externalGroup !== undefined) {
            if (existingData.status !== 'completed' && existingData.status !== 'cancelled') {
                updatePayload.status = data.externalGroup ? 'external' : 'pending';
            }
        }
        
        // This allows updating receiptUrlPDF without affecting other logic
        if ('receiptUrlPDF' in data) {
            updatePayload.receiptUrlPDF = data.receiptUrlPDF;
        }

        await updateDoc(eventRef, cleanForFirestore(updatePayload));
        return { success: true };
    } catch (error) {
        console.error("Error updating event:", error);
        return { success: false, error: "Failed to update event in database." };
    }
}


export async function completeEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return { success: false, error: "Event not found." };
    }

    const eventData = eventSnap.data();
    const contractedAmount = eventData?.contractedAmount || 0;

    await updateDoc(eventRef, {
      status: 'completed',
      amountPaid: contractedAmount,
      pendingBalance: 0,
      receiptUrlPDF: null, // Set to null to indicate "generating"
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing event:", error);
    return { success: false, error: "Failed to update event in database." };
  }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "events", id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false, error: "Failed to delete event from database." };
    }
}


// --- REHEARSAL SERVICE FUNCTIONS ---

export async function getRehearsals(): Promise<RehearsalData[]> {
    try {
        const q = query(collection(db, 'rehearsals'), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as RehearsalData[];
    } catch (error) {
        console.error("Error fetching rehearsals:", error);
        return [];
    }
}

export async function createRehearsal(data: RehearsalInputData): Promise<{ success: boolean; rehearsalId?: string, error?: string }> {
    try {
        const songsForDb = (data.songs || [])
            .filter(song => song && song.name && song.name.trim() !== "")
            .map(song => ({
                name: song.name || '',
                artist: song.artist || '',
                key: song.key || '',
                youtubeUrl: song.youtubeUrl || '',
                sheetMusicUrl: song.sheetMusicUrl || '',
                audioUrl: song.audioUrl || '',
            }));

        const payload = {
            ...data,
            songs: songsForDb,
            status: 'pending' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await addDoc(collection(db, 'rehearsals'), cleanForFirestore(payload));
        return { success: true, rehearsalId: docRef.id };
    } catch (error) {
        console.error("Error creating rehearsal:", error);
        return { success: false, error: "Failed to create rehearsal in database." };
    }
}

export async function getRehearsalById(id: string): Promise<RehearsalData | null> {
    try {
        const docRef = doc(db, 'rehearsals', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.error("No such rehearsal!");
            return null;
        }
        return processDocTimestamps(docSnap) as RehearsalData;
    } catch (error) {
        console.error("Error fetching rehearsal by ID:", error);
        return null;
    }
}

export async function updateRehearsal(id: string, data: Partial<RehearsalInputData>): Promise<{ success: boolean; error?: string }> {
    try {
        const songsForDb = (data.songs || [])
            .filter(song => song && song.name && song.name.trim() !== "")
            .map(song => ({
                name: song.name || '',
                artist: song.artist || '',
                key: song.key || '',
                youtubeUrl: song.youtubeUrl || '',
                sheetMusicUrl: song.sheetMusicUrl || '',
                audioUrl: song.audioUrl || '',
            }));
        
        const payload: { [key: string]: any } = { ...data };
        if (data.songs) {
            payload.songs = songsForDb;
        }
        
        payload.updatedAt = new Date();

        const docRef = doc(db, "rehearsals", id);
        await updateDoc(docRef, cleanForFirestore(payload));
        return { success: true };
    } catch (error) {
        console.error("Error updating rehearsal:", error);
        return { success: false, error: "Failed to update rehearsal in database." };
    }
}

export async function completeRehearsal(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, "rehearsals", id);
        await updateDoc(docRef, {
            status: 'completed',
            updatedAt: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error completing rehearsal:", error);
        return { success: false, error: "Failed to complete rehearsal in database." };
    }
}

export async function deleteRehearsal(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "rehearsals", id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting rehearsal:", error);
        return { success: false, error: "Failed to delete rehearsal from database." };
    }
}

// --- MANUAL FINANCE ENTRY FUNCTIONS ---

export async function getManualFinanceEntries(): Promise<ManualFinanceEntry[]> {
    try {
        const q = query(collection(db, "manualFinanceEntries"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as ManualFinanceEntry[];
    } catch (error) {
        console.error("Error fetching manual entries:", error);
        return [];
    }
}

export async function createManualFinanceEntry(data: ManualFinanceEntryInputData): Promise<{ success: boolean; entryId?: string, error?: string }> {
    try {
        const payload = {
            ...data,
            createdBy: 'admin', // Hardcoded for now
            createdAt: new Date(),
        };
        const docRef = await addDoc(collection(db, 'manualFinanceEntries'), cleanForFirestore(payload));
        return { success: true, entryId: docRef.id };
    } catch (error) {
        console.error("Error creating manual entry:", error);
        return { success: false, error: "Failed to create manual entry in database." };
    }
}

// --- MUSICIAN FINANCE FUNCTIONS ---

export async function upsertMusicianIncome(userId: string, eventId: string, amount: number, eventDate: string): Promise<{ success: boolean; error?: string }> {
    if (!userId || !eventId) {
        return { success: false, error: "User ID and Event ID are required." };
    }
    const incomeId = `${userId}_${eventId}`;
    const incomeRef = doc(db, "musicianIncomes", incomeId);
    try {
        const docSnap = await getDoc(incomeRef);

        const payload: { [key: string]: any } = {
            userId,
            eventId,
            amount,
            date: eventDate,
            updatedAt: new Date(),
        };

        if (!docSnap.exists()) {
            payload.createdAt = new Date();
        }
        
        await setDoc(incomeRef, cleanForFirestore(payload), { merge: true });

        return { success: true };
    } catch (error) {
        console.error("Error upserting musician income:", error);
        return { success: false, error: "Failed to save musician income." };
    }
}


export async function getMusicianIncomes(userId: string): Promise<MusicianIncome[]> {
    if (!userId) return [];
    try {
        const q = query(collection(db, "musicianIncomes"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as MusicianIncome[];
    } catch (error) {
        console.error("Error fetching musician incomes:", error);
        return [];
    }
}

export async function createMusicianExpense(userId: string, data: MusicianExpenseInput): Promise<{ success: boolean; expenseId?: string; error?: string }> {
     if (!userId) {
        return { success: false, error: "User ID is required." };
    }
    try {
        const payload = {
            ...data,
            userId,
            createdAt: new Date()
        };
        const docRef = await addDoc(collection(db, "musicianExpenses"), cleanForFirestore(payload));
        return { success: true, expenseId: docRef.id };
    } catch (error) {
        console.error("Error creating musician expense:", error);
        return { success: false, error: "Failed to create expense." };
    }
}

export async function getMusicianExpenses(userId: string): Promise<MusicianExpense[]> {
    if (!userId) return [];
    try {
        // Query without ordering to avoid needing a composite index
        const q = query(collection(db, "musicianExpenses"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const expenses = snapshot.docs.map(processDocTimestamps).filter(Boolean) as MusicianExpense[];
        
        // Sort in-memory to ensure descending order by date
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return expenses;
    } catch (error) {
        console.error("Error fetching musician expenses:", error);
        return [];
    }
}

// --- REPERTOIRE & MEDIA SERVICE FUNCTIONS ---

const initialSongs: Omit<SongDetail, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // Cumpleaños
    { title: 'Las Mañanitas', artist: 'Tradicional', category: 'Cumpleaños' },
    { title: 'En Tu Día', artist: 'Javier Solís', category: 'Cumpleaños' },
    { title: 'Que Dios Te Bendiga', artist: 'Peter Manjarrés', category: 'Cumpleaños' },
    { title: 'Cumpleaños Feliz', artist: 'Tradicional', category: 'Cumpleaños' },

    // Serenatas
    { title: 'Amorcito Corazón', artist: 'Pedro Infante', category: 'Serenatas' },
    { title: 'Si Nos Dejan', artist: 'José Alfredo Jiménez', category: 'Serenatas' },
    { title: 'Cielito Lindo', artist: 'Tradicional', category: 'Serenatas' },
    { title: 'Serenata Sin Luna', artist: 'José Alfredo Jiménez', category: 'Serenatas' },
    { title: 'Serenata Huasteca', artist: 'José Alfredo Jiménez', category: 'Serenatas' },
    { title: 'Serenata Tapatía', artist: 'Manuel Esperón', category: 'Serenatas' },
    { title: 'Luz de Luna', artist: 'Javier Solís', category: 'Serenatas' },
    { title: 'Malagueña Salerosa', artist: 'Tradicional', category: 'Serenatas' },
    { title: 'La Barca', artist: 'Luis Miguel', category: 'Serenatas' },
    { title: 'Contigo Aprendí', artist: 'Armando Manzanero', category: 'Serenatas' },
    { title: 'Júrame', artist: 'María Grever', category: 'Serenatas' },
    { title: 'Bésame Mucho', artist: 'Consuelo Velázquez', category: 'Serenatas' },
    { title: 'La Gloria Eres Tú', artist: 'José Antonio Méndez', category: 'Serenatas' },
    { title: 'Gema', artist: 'Los Dandys', category: 'Serenatas' },
    { title: 'Usted', artist: 'Los Tres Diamantes', category: 'Serenatas' },
    { title: 'Solamente una Vez', artist: 'Agustín Lara', category: 'Serenatas' },
    { title: 'Te Quiero, Te Quiero', artist: 'Nino Bravo', category: 'Serenatas' },
    { title: 'Te Amo', artist: 'Franco de Vita', category: 'Serenatas' },
    { title: 'Mi Razón de Ser', artist: 'Banda MS', category: 'Serenatas' },
    { title: 'No Tengo Dinero', artist: 'Juan Gabriel', category: 'Serenatas' },

    // Corridos
    { title: 'El Corrido de Juan Charrasqueado', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'El Hijo Desobediente', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'El Corrido de Lucio Vásquez', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'Gabino Barrera', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'Sonaron 4 Balazos', artist: 'José Alfredo Jiménez', category: 'Corridos' },
    { title: 'El Prieto Satanás', artist: 'Varios', category: 'Corridos' },
    { title: 'Caballo Bayo', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'Caballo de Patas Blancas', artist: 'José Alfredo Jiménez', category: 'Corridos' },
    { title: 'Caballo Prieto Azabache', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'La Martina', artist: 'Antonio Aguilar', category: 'Corridos' },
    { title: 'Rosita Alvirez', artist: 'Varios', category: 'Corridos' },
    { title: 'La Muerte del Gallero', artist: 'Lucha Villa', category: 'Corridos' },

    // Sones
    { title: 'El Son de la Negra', artist: 'Tradicional', category: 'Sones' },
    { title: 'La Madrugada', artist: 'Tradicional', category: 'Sones' },
    { title: 'El Sinaloense', artist: 'Banda El Recodo', category: 'Sones' },
    { title: 'El Gusto', artist: 'Tradicional', category: 'Sones' },
    { title: 'Jarabe Tapatío', artist: 'Tradicional', category: 'Sones' },
    { title: 'Guadalajara', artist: 'Pepe Guízar', category: 'Sones' },
    { title: 'Jalisco', artist: 'Jorge Negrete', category: 'Sones' },
    { title: 'Camino de Guanajuato', artist: 'José Alfredo Jiménez', category: 'Sones' },
    { title: 'El Mariachi Loco', artist: 'Tradicional', category: 'Sones' },

    // Rancheras
    { title: 'Mátalas', artist: 'Alejandro Fernández', category: 'Rancheras' },
    { title: 'Mujeres Divinas', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Hermoso Cariño', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Si Dios Me Quita la Vida', artist: 'Javier Solís', category: 'Rancheras' },
    { title: 'Esclavo y Amo', artist: 'Javier Solís', category: 'Rancheras' },
    { title: 'Sombras Nada Más', artist: 'Javier Solís', category: 'Rancheras' },
    { title: 'Te Amaré Toda la Vida', artist: 'Javier Solís', category: 'Rancheras' },
    { title: 'La Diferencia', artist: 'Juan Gabriel', category: 'Rancheras' },
    { title: 'Hasta que Te Conocí', artist: 'Juan Gabriel', category: 'Rancheras' },
    { title: 'Volver, Volver', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'La Bikina', artist: 'Luis Miguel', category: 'Rancheras' },
    { title: 'Que Te Vaya Bonito', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'Cruz de Olvido', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'El Cigarrillo', artist: 'Ana Gabriel', category: 'Rancheras' },
    { title: 'Por Tu Maldito Amor', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'La Media Vuelta', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'No Me Sé Rajar', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Me Cansé de Rogarle', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'Ella', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'Te lo Pido por Favor', artist: 'Juan Gabriel', category: 'Rancheras' },
    { title: 'Acá Entre Nos', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'El Rey', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'La Ley del Monte', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Fallaste Corazón', artist: 'Cuco Sánchez', category: 'Rancheras' },
    { title: 'Se Me Olvidó Otra Vez', artist: 'Juan Gabriel', category: 'Rancheras' },
    { title: 'La Venia Bendita', artist: 'Marco Antonio Solís', category: 'Rancheras' },
    { title: 'A Mi Manera', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Cien Años', artist: 'Pedro Infante', category: 'Rancheras' },
    { title: 'La Misma', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Que Bonita es Esta Vida', artist: 'Jorge Celedón', category: 'Rancheras' },
    { title: 'Un Mundo Raro', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'Así Fue', artist: 'Isabel Pantoja', category: 'Rancheras' },
    { title: 'De Qué Manera Te Olvido', artist: 'Vicente Fernández', category: 'Rancheras' },
    { title: 'Paloma Negra', artist: 'Lola Beltrán', category: 'Rancheras' },
    { title: 'El Andariego', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'Sombras', artist: 'Javier Solís', category: 'Rancheras' },
    { title: 'El Jinete', artist: 'José Alfredo Jiménez', category: 'Rancheras' },
    { title: 'Caminos de Michoacán', artist: 'Federico Villa', category: 'Rancheras' },

    // Para Madres y Padres
    { title: 'Madrecita', artist: 'José José', category: 'Para Madres y Padres' },
    { title: 'Madrecita Querida', artist: 'Vicente Fernández', category: 'Para Madres y Padres' },
    { title: 'Por el Amor a Mi Madre', artist: 'Antonio Aguilar', category: 'Para Madres y Padres' },
    { title: 'El Retrato de Mamá', artist: 'Héctor Lavoe', category: 'Para Madres y Padres' },
    { title: 'Mil Puñados de Oro', artist: 'Cuco Sánchez', category: 'Para Madres y Padres' },
    { title: 'Aunque no Sea Mayo', artist: 'Los Tigres del Norte', category: 'Para Madres y Padres' },
    { title: 'Mi Querido Viejo', artist: 'Piero', category: 'Para Madres y Padres' },
    { title: 'Cuando Yo Quería Ser Grande', artist: 'Alejandro Fernández', category: 'Para Madres y Padres' },
    { title: 'El Hombre que Más Te Amó', artist: 'Vicente Fernández', category: 'Para Madres y Padres' },
    { title: 'Amor Eterno', artist: 'Rocío Dúrcal', category: 'Para Madres y Padres' },
];

async function seedInitialSongs() {
    try {
        const songsCol = collection(db, 'songs');
        const q = query(songsCol, limit(1));
        const existingSongsSnapshot = await getDocs(q);

        if (!existingSongsSnapshot.empty) {
            return;
        }
        
        const batch = writeBatch(db);
        for (const songData of initialSongs) {
            const docRef = doc(songsCol); 
            const payload = {
                ...songData,
                createdAt: new Date()
            };
            batch.set(docRef, cleanForFirestore(payload));
        }
        await batch.commit();
    } catch(e) {
        console.error("Error seeding songs:", e);
    }
}

export async function getSongs(): Promise<SongDetail[]> {
    try {
        await seedInitialSongs();
        const q = query(collection(db, 'songs'), orderBy("title", "asc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as SongDetail[];
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

export async function createSong(data: SongInputData): Promise<{ success: boolean; songId?: string, error?: string }> {
  try {
    const payload = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const docRef = await addDoc(collection(db, "songs"), cleanForFirestore(payload));
    return { success: true, songId: docRef.id };
  } catch (error) {
     console.error("Error creating song:", error);
     return { success: false, error: "Failed to create song in database." };
  }
}

export async function updateSong(id: string, data: Partial<SongInputData>): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, "songs", id);
        const payload = {
            ...data,
            updatedAt: new Date(),
        };
        await updateDoc(docRef, cleanForFirestore(payload));
        return { success: true };
    } catch (error) {
        console.error("Error updating song:", error);
        return { success: false, error: "Failed to update song in database." };
    }
}

export async function deleteSong(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "songs", id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting song:", error);
        return { success: false, error: "Failed to delete song from database." };
    }
}


export async function getMedia(): Promise<MediaFile[]> {
    // This function is not fully implemented with firebase-admin yet,
    // returning dummy data to avoid breaking the UI.
    const dummyMedia: MediaFile[] = [
        {
          id: "1", name: "Boda Pérez 2024", type: "image", url: "https://placehold.co/600x400.png", hint: "wedding mariachi",
          size: 1200000, uploadedBy: "Admin", uploadedAt: new Date().toISOString(), tags: ["boda", "2024"],
        },
         {
          id: "2", name: "Serenata a Mamá", type: "video", url: "https://placehold.co/600x400.png", hint: "serenade music",
          size: 25000000, uploadedBy: "Admin", uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), tags: ["serenata", "familia"],
        },
        {
          id: "3", name: "Cumpleaños Sr. Juan", type: "image", url: "https://placehold.co/600x400.png", hint: "birthday party",
          size: 980000, uploadedBy: "Admin", uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), tags: ["cumpleaños"],
        },
         {
          id: "4", name: "Audio de Referencia - El Rey", type: "audio", url: "",
          size: 4500000, uploadedBy: "Admin", uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), tags: ["repertorio", "referencia"],
        }
    ];
    return Promise.resolve(dummyMedia);
}


export async function getSuggestedSongs(eventType: string): Promise<SongDetail[]> {
    const allSongs = await getSongs();
    if (allSongs.length === 0) return [];

    const suggestions: SongDetail[] = [];
    const eventTypeLower = eventType.toLowerCase();

    allSongs.forEach(song => {
        if (song.suggestedEvents?.includes(eventTypeLower)) {
            suggestions.push(song);
        }
    });

    const categoryMap: Record<string, string[]> = {
        'boda': ['Románticas', 'Pop en Mariachi'],
        'cumpleaños': ['Cumpleaños', 'Infantiles', 'Rancheras'],
        'serenata': ['Serenatas', 'Románticas'],
        'funeral': ['Dolor'],
        'corporativo': ['Clásicos Mexicanos', 'Pop en Mariachi', 'Sones']
    };

    if (categoryMap[eventTypeLower]) {
        allSongs.forEach(song => {
            if (categoryMap[eventTypeLower].includes(song.category) && !suggestions.find(s => s.id === song.id)) {
                suggestions.push(song);
            }
        });
    }

    return suggestions;
}

// --- AI Assistant Read Functions ---

export async function getEventsByDateRange(startDate: string, endDate: string): Promise<EventData[]> {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where("eventDate", ">=", startDate), where("eventDate", "<=", endDate), orderBy("eventDate"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as EventData[];
    } catch (error) {
        console.error("Error fetching events by date range:", error);
        return [];
    }
}

export async function getRehearsalsByDateRange(startDate: string, endDate: string): Promise<RehearsalData[]> {
    try {
        const rehearsalsRef = collection(db, 'rehearsals');
        const q = query(rehearsalsRef, where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as RehearsalData[];
    } catch (error) {
        console.error("Error fetching rehearsals by date range:", error);
        return [];
    }
}

export async function getFinancialSummary(startDate: string, endDate: string) {
    try {
        const eventsRef = collection(db, 'events');
        const manualEntriesRef = collection(db, 'manualFinanceEntries');

        const eventsQuery = query(eventsRef, where('eventDate', '>=', startDate), where('eventDate', '<=', endDate));
        const manualEntriesQuery = query(manualEntriesRef, where('date', '>=', startDate), where('date', '<=', endDate));

        const [eventsSnapshot, manualEntriesSnapshot] = await Promise.all([
            getDocs(eventsQuery),
            getDocs(manualEntriesQuery)
        ]);

        const eventsData = eventsSnapshot.docs.map(processDocTimestamps).filter(Boolean) as EventData[];
        const manualEntriesData = manualEntriesSnapshot.docs.map(processDocTimestamps).filter(Boolean) as ManualFinanceEntry[];

        const income = eventsData.reduce((acc, e) => acc + (e.externalGroup ? 0 : e.contractedAmount), 0) +
                       manualEntriesData.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);

        const expenses = eventsData.reduce((acc, e) => acc + (e.externalGroup ? 0 : (e.musiciansPay || 0)), 0) +
                         manualEntriesData.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);
        
        const netBalance = income - expenses;

        return {
            totalIncome: income,
            totalExpenses: expenses,
            netBalance: netBalance,
            numberOfEvents: eventsData.length,
            numberOfTransactions: eventsData.length + manualEntriesData.length
        };
    } catch (error) {
        console.error("Error fetching financial summary:", error);
        return { totalIncome: 0, totalExpenses: 0, netBalance: 0, numberOfEvents: 0, numberOfTransactions: 0, error: "Failed to fetch financial data." };
    }
}
