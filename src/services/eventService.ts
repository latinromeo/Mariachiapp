
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
    updateDoc
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

type EventInputData = Omit<EventData, 'id'|'clientId'|'pendingBalance'|'profit'|'createdAt'|'updatedAt'|'status'>;
type ClientInputData = Omit<ClientData, 'id'|'createdAt'|'updatedAt'>;
type RehearsalInputData = Omit<RehearsalData, 'id'|'createdAt'|'updatedAt'>;
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
        return snapshot.docs.map(doc => processDocTimestamps(doc) as SongDetail);
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
        return snapshot.docs.map(doc => processDocTimestamps(doc) as MediaFile);
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
        'cumpleanos': ['Cumpleaños', 'Infantiles', 'Rancheras'],
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
