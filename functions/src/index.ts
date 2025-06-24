
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import OpenAI from "openai";
import { add, format } from "date-fns";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize CORS middleware
const corsHandler = cors({origin: true});

// Initialize OpenAI client with the provided API key
// For production, it's highly recommended to store the key in a secret manager.
const openai = new OpenAI({
  apiKey: "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",
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  prompt: string;
  history: ChatMessage[];
}

// A simplified function to extract details from a prompt.
function parseDateTime(prompt: string): { eventDate: string; eventTime: string } {
    const today = new Date();
    let eventDate = new Date();
    
    if (prompt.toLowerCase().includes('mañana')) {
        eventDate = add(today, { days: 1 });
    }

    const timeRegex = /(\d{1,2})\s*(pm|am)/i;
    const timeMatch = prompt.toLowerCase().match(timeRegex);
    let eventTime = 'Hora no especificada';

    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const period = timeMatch[2].toLowerCase();
        if (period === 'pm' && hour < 12) {
            hour += 12;
        }
        if (period === 'am' && hour === 12) {
            hour = 0; // Midnight case for 12 AM
        }
        eventTime = `${hour.toString().padStart(2, '0')}:00`; // Basic time format
    }
    
    return {
        eventDate: format(eventDate, 'yyyy-MM-dd'),
        eventTime: eventTime,
    };
}


export const chatWithAssistant = functions.https.onRequest((req, res) => {
  // Handle CORS preflight requests
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {prompt, history} = req.body as RequestBody;

      if (!prompt) {
        res.status(400).json({error: "Prompt is required"});
        return;
      }

      // --- Intent Detection & Action ---
      const createIntentKeywords = ["crea", "programa", "agenda", "ensayo", "evento"];
      const hasCreateIntent = createIntentKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
      let eventCreated = false;
      let actionResponse = "";

      if (hasCreateIntent) {
        try {
            const isRehearsal = prompt.toLowerCase().includes('ensayo');
            const { eventDate, eventTime } = parseDateTime(prompt);

            const eventData = {
                clientName: isRehearsal ? "Ensayo Interno" : "Evento desde AI",
                clientPhone: "N/A",
                eventType: isRehearsal ? "ensayo" : "evento",
                eventDate,
                eventTime,
                location: "Ubicación por definir",
                sector: "Sector por definir",
                plan: "personalizado",
                paymentMethod: "other",
                contractedAmount: 0,
                amountPaid: 0,
                pendingBalance: 0,
                musiciansPay: isRehearsal ? 0 : 5000,
                externalGroup: false,
                notes: `Creado por AI a partir del prompt: "${prompt}"`,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            
            await db.collection("events").add(eventData);
            
            eventCreated = true;
            actionResponse = `\n\n¡Entendido! He agendado un "${eventData.eventType}" para ti.`;
            functions.logger.info("Event created successfully from prompt:", eventData);
        } catch (e) {
          functions.logger.error("Error trying to create event from prompt:", e);
          actionResponse = "\n\nIntenté crear el evento, pero algo salió mal. Por favor, revísalo manualmente.";
        }
      }

      // --- Chat Completion ---
      const systemPrompt: ChatMessage = {
        role: "system",
        content: `Eres "Maestro Mariachi AI", un asistente experto en la gestión de una agrupación de mariachis. Eres amigable, servicial y conoces todos los aspectos del negocio. Tus respuestas deben ser concisas, útiles y en español.`,
      };

      const messages: ChatMessage[] = [
        systemPrompt,
        ...(history || []),
        {role: "user", content: prompt},
      ];

      const chatResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      let reply = chatResponse.choices[0]?.message?.content || "No pude obtener una respuesta.";
      
      // Add the action confirmation to the reply.
      if (actionResponse) {
          reply += actionResponse;
      }

      res.status(200).json({reply, eventCreated});
    } catch (error: any) {
      functions.logger.error("Error calling OpenAI API:", error);
      if (error.response) {
        functions.logger.error(error.response.status, error.response.data);
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({error: "An internal error occurred while processing the request with OpenAI"});
      }
    }
  });
});
