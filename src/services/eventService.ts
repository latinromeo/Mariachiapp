
// src/services/eventService.ts
'use server';

import { add, sub, parse, format as formatDateFns } from "date-fns";
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase-admin'; // Usar la instancia de admin centralizada
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { EVENT_PLANS } from "@/lib/constants";

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
  createdAt: string;
  updatedAt: string;
  status: 'confirmed' | 'pending' | 'external' | 'cancelled' | 'completed';
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt?: string;
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

export interface MusicianIncome {
    id: string; // Will be composite key userId_eventId
    userId: string;
    eventId: string;
    amount: number;
    date: string; // event date
}

export interface MusicianExpense {
    id:string;
    userId: string;
    description: string;
    category: string;
    amount: number;
    date: string; // 'YYYY-MM-DD'
    createdAt: string;
}


// --- FORM INPUT TYPES ---

type EventInputData = Omit<EventData, 'id'|'pendingBalance'|'profit'|'createdAt'|'updatedAt'|'status'> & { 
    otherExternalContact?: string;
};
type ClientInputData = Omit<ClientData, 'id'|'createdAt'|'updatedAt'>;
type RehearsalInputData = Omit<RehearsalData, 'id'|'createdAt'|'updatedAt'|'status'>;
type ManualFinanceEntryInputData = Omit<ManualFinanceEntry, 'id'|'createdBy'|'createdAt'>;
type SongInputData = Omit<SongDetail, 'id' | 'createdAt' | 'updatedAt' | 'suggestedEvents'>;
type MusicianExpenseInput = Omit<MusicianExpense, 'id' | 'userId' | 'createdAt'>;


// --- HELPER FUNCTIONS ---

const processDocTimestamps = (doc: FirebaseFirestore.DocumentSnapshot) => {
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
    console.log("Fetching clients from Firestore using Admin SDK");
    try {
        const snapshot = await db.collection('clients').orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as ClientData[];
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function findClientByPhone(phone: string): Promise<ClientData | null> {
    try {
        const snapshot = await db.collection('clients').where('phone', '==', phone).limit(1).get();
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
        const docRef = await db.collection('clients').add({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true, clientId: docRef.id };
    } catch (error) {
        console.error("Error creating client:", error);
        return { success: false, error: "Failed to create client in database." };
    }
}

export async function getClientById(id: string): Promise<ClientData | null> {
    try {
        const docSnap = await db.collection("clients").doc(id).get();
        if (!docSnap.exists) {
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
        await db.collection("clients").doc(id).update({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating client:", error);
        return { success: false, error: "Failed to update client in database." };
    }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.collection("clients").doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error("Error deleting client:", error);
        return { success: false, error: "Failed to delete client from database." };
    }
}

// --- EVENT SERVICE FUNCTIONS ---

export async function getEvents(): Promise<EventData[]> {
    try {
        const snapshot = await db.collection("events").orderBy("eventDate", "desc").get();
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as EventData[];
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getEventById(id: string): Promise<EventData | null> {
    try {
        const docSnap = await db.collection("events").doc(id).get();
        if (!docSnap.exists) {
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
      const clientResult = await createClient({ name: data.clientName, phone: data.clientPhone, sector: data.sector });
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
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await db.collection("events").add(newEventData);
    return { success: true, eventId: docRef.id };
  } catch (error) {
     console.error("Error creating event:", error);
     return { success: false, error: "Failed to create event in database." };
  }
}

export async function updateEvent(id: string, data: Partial<EventInputData>): Promise<{ success: boolean; error?: string }> {
    const eventRef = db.collection("events").doc(id);

    try {
        const eventSnap = await eventRef.get();
        if (!eventSnap.exists) {
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
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (data.externalGroup !== undefined) {
            if (existingData.status !== 'completed' && existingData.status !== 'cancelled') {
                updatePayload.status = data.externalGroup ? 'external' : 'pending';
            }
        }

        await eventRef.update(updatePayload);
        return { success: true };
    } catch (error) {
        console.error("Error updating event:", error);
        return { success: false, error: "Failed to update event in database." };
    }
}


export async function completeEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return { success: false, error: "Event not found." };
    }

    const eventData = eventSnap.data();
    const contractedAmount = eventData?.contractedAmount || 0;

    await eventRef.update({
      status: 'completed',
      amountPaid: contractedAmount,
      pendingBalance: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing event:", error);
    return { success: false, error: "Failed to update event in database." };
  }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.collection("events").doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false, error: "Failed to delete event from database." };
    }
}


// --- REHEARSAL SERVICE FUNCTIONS ---

export async function getRehearsals(): Promise<RehearsalData[]> {
    try {
        const snapshot = await db.collection("rehearsals").orderBy("date", "desc").get();
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as RehearsalData[];
    } catch (error) {
        console.error("Error fetching rehearsals:", error);
        return [];
    }
}

export async function createRehearsal(data: RehearsalInputData): Promise<{ success: boolean; rehearsalId?: string, error?: string }> {
  try {
    // Sanitize data to remove 'undefined' values, which Firestore rejects.
    const sanitizedData = JSON.parse(JSON.stringify(data));
    const docRef = await db.collection("rehearsals").add({
        ...sanitizedData,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, rehearsalId: docRef.id };
  } catch (error) {
     console.error("Error creating rehearsal:", error);
     return { success: false, error: "Failed to create rehearsal in database." };
  }
}

export async function getRehearsalById(id: string): Promise<RehearsalData | null> {
    try {
        const docSnap = await db.collection("rehearsals").doc(id).get();
        if (!docSnap.exists) {
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
        // Sanitize data to remove 'undefined' values, which Firestore rejects.
        const sanitizedData = JSON.parse(JSON.stringify(data));
        await db.collection("rehearsals").doc(id).update({
            ...sanitizedData,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating rehearsal:", error);
        return { success: false, error: "Failed to update rehearsal in database." };
    }
}

export async function completeRehearsal(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.collection("rehearsals").doc(id).update({
            status: 'completed',
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error completing rehearsal:", error);
        return { success: false, error: "Failed to complete rehearsal in database." };
    }
}

export async function deleteRehearsal(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.collection("rehearsals").doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error("Error deleting rehearsal:", error);
        return { success: false, error: "Failed to delete rehearsal from database." };
    }
}


// --- AI ASSISTANT FUNCTIONS ---

function parseDateTime(prompt: string): { eventDate: string; eventTime: string } {
    const today = new Date();
    let eventDate = new Date();
    
    if (prompt.toLowerCase().includes('mañana')) {
        eventDate = add(today, { days: 1 });
    }

    const timeRegex = /(\d{1,2})\s*([ap]m)/i;
    const timeMatch = prompt.toLowerCase().match(timeRegex);
    let eventTime = 'Hora no especificada';

    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const period = timeMatch[2].toLowerCase();
        if (period === 'pm' && hour < 12) {
            hour += 12;
        }
        if (period === 'am' && hour === 12) {
            hour = 0;
        }
        eventTime = `${hour}:00`;
    }
    
    return {
        eventDate: formatDateFns(eventDate, 'yyyy-MM-dd'),
        eventTime: eventTime
    };
}


export async function createEventFromPrompt(prompt: string): Promise<{ success: boolean; details?: Partial<EventData>; error?: string }> {
    try {
        const isRehearsal = prompt.toLowerCase().includes('ensayo');
        const { eventDate, eventTime } = parseDateTime(prompt);

        const eventDetails = {
            clientName: isRehearsal ? "Ensayo Interno" : "Cliente desde AI",
            clientPhone: "0000000000",
            eventType: isRehearsal ? "ensayo" : "evento (AI)",
            eventDate,
            eventTime,
            location: "Estudio (por defecto)",
            sector: "N/A",
            plan: "personalizado",
            paymentMethod: "other",
            contractedAmount: 0,
            amountPaid: 0,
            musiciansPay: isRehearsal ? 0 : 5000,
            externalGroup: false,
        };

        const result = await createEvent(eventDetails);

        if (result.success) {
            return { success: true, details: eventDetails };
        } else {
            return { success: false, error: result.error };
        }
    } catch (e) {
        console.error("Error in createEventFromPrompt:", e);
        return { success: false, error: "Error interno al procesar el prompt para crear evento." };
    }
}


// --- MANUAL FINANCE ENTRY FUNCTIONS ---

export async function getManualFinanceEntries(): Promise<ManualFinanceEntry[]> {
    try {
        const snapshot = await db.collection("manualFinanceEntries").orderBy("date", "desc").get();
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as ManualFinanceEntry[];
    } catch (error) {
        console.error("Error fetching manual entries:", error);
        return [];
    }
}

export async function createManualFinanceEntry(data: ManualFinanceEntryInputData): Promise<{ success: boolean; entryId?: string }> {
    try {
        const docRef = await db.collection('manualFinanceEntries').add({
            ...data,
            createdBy: 'admin', // Hardcoded for now
            createdAt: FieldValue.serverTimestamp(),
        });
        return { success: true, entryId: docRef.id };
    } catch (error) {
        console.error("Error creating manual entry:", error);
        return { success: false };
    }
}

// --- MUSICIAN FINANCE FUNCTIONS ---

export async function upsertMusicianIncome(userId: string, eventId: string, amount: number, eventDate: string): Promise<{ success: boolean; error?: string }> {
    if (!userId || !eventId) {
        return { success: false, error: "User ID and Event ID are required." };
    }
    const incomeRef = db.collection("musicianIncomes").doc(`${userId}_${eventId}`);
    try {
        await incomeRef.set({
            userId,
            eventId,
            amount,
            date: eventDate,
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error upserting musician income:", error);
        return { success: false, error: "Failed to save musician income." };
    }
}

export async function getMusicianIncomes(userId: string): Promise<MusicianIncome[]> {
    if (!userId) return [];
    try {
        const snapshot = await db.collection("musicianIncomes").where("userId", "==", userId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicianIncome));
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
        const docRef = await db.collection("musicianExpenses").add({
            ...data,
            userId,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true, expenseId: docRef.id };
    } catch (error) {
        console.error("Error creating musician expense:", error);
        return { success: false, error: "Failed to create expense." };
    }
}

export async function getMusicianExpenses(userId: string): Promise<MusicianExpense[]> {
     if (!userId) return [];
     try {
        const snapshot = await db.collection("musicianExpenses").where("userId", "==", userId).get();
        const expenses = snapshot.docs.map(processDocTimestamps).filter(Boolean) as MusicianExpense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return expenses;
    } catch (error) {
        console.error("Error fetching musician expenses:", error);
        return [];
    }
}

// --- REPERTOIRE & MEDIA SERVICE FUNCTIONS ---

const initialSongs: Omit<SongDetail, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // ... (same song list as before)
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
    console.log("Checking for initial songs to seed...");
    const songsCol = db.collection('songs');
    const existingSongsSnapshot = await songsCol.limit(1).get();
    if (!existingSongsSnapshot.empty) {
        console.log("Songs collection is not empty. Skipping seed.");
        return;
    }

    console.log(`Seeding ${initialSongs.length} initial song(s)...`);
    const batch = db.batch();
    for (const songData of initialSongs) {
        const docRef = songsCol.doc(); 
        batch.set(docRef, {
            ...songData,
            createdAt: FieldValue.serverTimestamp()
        });
    }
    await batch.commit();
}

export async function getSongs(): Promise<SongDetail[]> {
    try {
        await seedInitialSongs();
        const snapshot = await db.collection('songs').orderBy("title", "asc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as SongDetail[];
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

export async function createSong(data: SongInputData): Promise<{ success: boolean; songId?: string, error?: string }> {
  try {
    const docRef = await db.collection("songs").add({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, songId: docRef.id };
  } catch (error) {
     console.error("Error creating song:", error);
     return { success: false, error: "Failed to create song in database." };
  }
}

export async function updateSong(id: string, data: Partial<SongInputData>): Promise<{ success: boolean; error?: string }> {
    try {
        await db.collection("songs").doc(id).update({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating song:", error);
        return { success: false, error: "Failed to update song in database." };
    }
}

export async function deleteSong(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.collection("songs").doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error("Error deleting song:", error);
        return { success: false, error: "Failed to delete song from database." };
    }
}


export async function getMedia(): Promise<MediaFile[]> {
    try {
        const snapshot = await db.collection('media').orderBy("uploadedAt", "desc").get();
         if (snapshot.empty) {
          const dummyMedia: MediaFile[] = [
            {
              id: "1", name: "Boda Pérez 2024", type: "image", url: "https://placehold.co/600x400.png", hint: "wedding mariachi",
              size: 1200000, uploadedBy: "Admin", uploadedAt: new Date().toISOString(), tags: ["boda", "2024"],
            },
             {
              id: "2", name: "Serenata a Mamá", type: "video", url: "https://placehold.co/600x400.png", hint: "serenade music",
              size: 25000000, uploadedBy: "Admin", uploadedAt: sub(new Date(), { days: 5 }).toISOString(), tags: ["serenata", "familia"],
            },
            {
              id: "3", name: "Cumpleaños Sr. Juan", type: "image", url: "https://placehold.co/600x400.png", hint: "birthday party",
              size: 980000, uploadedBy: "Admin", uploadedAt: sub(new Date(), { days: 10 }).toISOString(), tags: ["cumpleaños"],
            },
             {
              id: "4", name: "Audio de Referencia - El Rey", type: "audio", url: "",
              size: 4500000, uploadedBy: "Admin", uploadedAt: sub(new Date(), { months: 1 }).toISOString(), tags: ["repertorio", "referencia"],
            }
          ];
          return dummyMedia;
        }
        return snapshot.docs.map(processDocTimestamps).filter(Boolean) as MediaFile[];
    } catch (error) {
        console.error("Error fetching media:", error);
        return [];
    }
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
