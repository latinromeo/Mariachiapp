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
    orderBy,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
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

type EventInputData = Omit<EventData, 'id'|'pendingBalance'|'profit'|'createdAt'|'updatedAt'|'status'> & { 
    otherExternalContact?: string;
};
type ClientInputData = Omit<ClientData, 'id'|'createdAt'|'updatedAt'>;
type RehearsalInputData = Omit<RehearsalData, 'id'|'createdAt'|'updatedAt'|'status'>;
type ManualFinanceEntryInputData = Omit<ManualFinanceEntry, 'id'|'createdBy'|'createdAt'>;
type SongInputData = Omit<SongDetail, 'id' | 'createdAt' | 'suggestedEvents'>;


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
        const clients = snapshot.docs.map(processDocTimestamps).filter(Boolean);
        return clients as ClientData[];
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

export async function getClientById(id: string): Promise<ClientData | null> {
    console.log(`Fetching client with ID: ${id}`);
    try {
        const clientRef = doc(db, "clients", id);
        const docSnap = await getDoc(clientRef);

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
    const clientRef = doc(db, "clients", id);
    try {
        await updateDoc(clientRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating client:", error);
        return { success: false, error: "Failed to update client in database." };
    }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
    const clientRef = doc(db, "clients", id);
    try {
        await deleteDoc(clientRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting client:", error);
        return { success: false, error: "Failed to delete client from database." };
    }
}

// --- EVENT SERVICE FUNCTIONS ---

export async function getEvents(): Promise<EventData[]> {
    console.log("Fetching events from Firestore");
     try {
        const eventsCol = collection(db, "events");
        const q = query(eventsCol, orderBy("eventDate", "desc"));
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map(processDocTimestamps).filter(Boolean);
        return events as EventData[];
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getEventById(id: string): Promise<EventData | null> {
    console.log(`Fetching event with ID: ${id}`);
    try {
        const eventRef = doc(db, "events", id);
        const docSnap = await getDoc(eventRef);

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

  // If no clientId is provided (i.e., new client flow), find or create the client
  if (!clientId) {
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
  
  const pendingBalance = data.contractedAmount - data.amountPaid;
  const profit = data.contractedAmount - (data.musiciansPay || 0);

  let finalExternalContact = data.externalContact;
  if (data.externalContact === 'otro' && data.otherExternalContact) {
      finalExternalContact = data.otherExternalContact;
  }

  // Create a new object for Firestore without the temporary 'otherExternalContact' field
  const { otherExternalContact, ...eventDataForFirestore } = data;

  const newEventData = {
    ...eventDataForFirestore,
    clientId,
    externalContact: finalExternalContact,
    pendingBalance,
    profit,
    status: data.externalGroup ? 'external' : 'pending',
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

export async function updateEvent(id: string, data: Partial<EventInputData>): Promise<{ success: boolean; error?: string }> {
    const eventRef = doc(db, "events", id);

    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            return { success: false, error: "Event not found." };
        }
        
        const existingData = eventSnap.data() as EventData;
        const contractedAmount = data.contractedAmount ?? existingData.contractedAmount;
        const amountPaid = data.amountPaid ?? existingData.amountPaid;
        const musiciansPay = data.musiciansPay ?? existingData.musiciansPay;

        const pendingBalance = contractedAmount - amountPaid;
        const profit = contractedAmount - (musiciansPay || 0);
        
        let finalExternalContact = data.externalContact;
        if (data.externalContact === 'otro' && data.otherExternalContact) {
            finalExternalContact = data.otherExternalContact;
        }

        const { otherExternalContact, ...updateDataForFirestore } = data;

        const updateData: { [key: string]: any } = {
            ...updateDataForFirestore,
            externalContact: finalExternalContact,
            pendingBalance,
            profit,
            updatedAt: serverTimestamp(),
        };

        if (data.externalGroup !== undefined) {
            if (existingData.status !== 'completed' && existingData.status !== 'cancelled') {
                updateData.status = data.externalGroup ? 'external' : 'pending';
            }
        }

        await updateDoc(eventRef, updateData);
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
    const contractedAmount = eventData.contractedAmount || 0;

    await updateDoc(eventRef, {
      status: 'completed',
      amountPaid: contractedAmount,
      pendingBalance: 0,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing event:", error);
    return { success: false, error: "Failed to update event in database." };
  }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
    const eventRef = doc(db, "events", id);
    try {
        await deleteDoc(eventRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false, error: "Failed to delete event from database." };
    }
}


// --- REHEARSAL SERVICE FUNCTIONS ---

export async function getRehearsals(): Promise<RehearsalData[]> {
    console.log("Fetching rehearsals from Firestore");
    try {
        const rehearsalsCol = collection(db, "rehearsals");
        const snapshot = await getDocs(query(rehearsalsCol, orderBy("date", "desc")));
        const rehearsals = snapshot.docs.map(processDocTimestamps).filter(Boolean) as RehearsalData[];
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
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { success: true, rehearsalId: docRef.id };
  } catch (error) {
     console.error("Error creating rehearsal:", error);
     return { success: false, error: "Failed to create rehearsal in database." };
  }
}

export async function getRehearsalById(id: string): Promise<RehearsalData | null> {
    console.log(`Fetching rehearsal with ID: ${id}`);
    try {
        const rehearsalRef = doc(db, "rehearsals", id);
        const docSnap = await getDoc(rehearsalRef);

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
    const rehearsalRef = doc(db, "rehearsals", id);
    try {
        await updateDoc(rehearsalRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating rehearsal:", error);
        return { success: false, error: "Failed to update rehearsal in database." };
    }
}

export async function completeRehearsal(id: string): Promise<{ success: boolean; error?: string }> {
    const rehearsalRef = doc(db, "rehearsals", id);
    try {
        await updateDoc(rehearsalRef, {
            status: 'completed',
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error completing rehearsal:", error);
        return { success: false, error: "Failed to complete rehearsal in database." };
    }
}

export async function deleteRehearsal(id: string): Promise<{ success: boolean; error?: string }> {
    const rehearsalRef = doc(db, "rehearsals", id);
    try {
        await deleteDoc(rehearsalRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting rehearsal:", error);
        return { success: false, error: "Failed to delete rehearsal from database." };
    }
}


// --- MANUAL FINANCE ENTRY FUNCTIONS ---

export async function getManualFinanceEntries(): Promise<ManualFinanceEntry[]> {
    console.log("Fetching manual finance entries from Firestore");
    try {
        const entriesCol = collection(db, "manualFinanceEntries");
        const q = query(entriesCol, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(processDocTimestamps).filter(Boolean);
        return entries as ManualFinanceEntry[];
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

// --- REPERTOIRE & MEDIA SERVICE FUNCTIONS ---

export async function getSongs(): Promise<SongDetail[]> {
    console.log("Fetching songs from Firestore");
    try {
        const songsCol = collection(db, 'songs');
        const q = query(songsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          console.log("No songs found in Firestore. The 'songs' collection might be empty.");
          return [];
        }
        const songs = snapshot.docs.map(processDocTimestamps).filter(Boolean);
        return songs as SongDetail[];
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

export async function createSong(data: SongInputData): Promise<{ success: boolean; songId?: string, error?: string }> {
  try {
    const docRef = await addDoc(collection(db, "songs"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return { success: true, songId: docRef.id };
  } catch (error) {
     console.error("Error creating song:", error);
     return { success: false, error: "Failed to create song in database." };
  }
}


export async function getMedia(): Promise<MediaFile[]> {
    console.log("Fetching media from Firestore");
    try {
        const mediaCol = collection(db, 'media');
        const q = query(mediaCol, orderBy("uploadedAt", "desc"));
        const snapshot = await getDocs(q);
         if (snapshot.empty) {
          console.log("No media found in Firestore. The 'media' collection might be empty.");
          return [];
        }
        const media = snapshot.docs.map(processDocTimestamps).filter(Boolean);
        return media as MediaFile[];
    } catch (error) {
        console.error("Error fetching media:", error);
        return [];
    }
}


export async function getSuggestedSongs(eventType: string): Promise<SongDetail[]> {
    console.log(`Getting suggested songs for event type: ${eventType}`);
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
