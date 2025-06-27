
import {NextRequest, NextResponse} from 'next/server';
import { createManualFinanceEntry } from '@/services/eventService';
import { storage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { z } from 'zod';
import { FINANCE_CATEGORIES } from '@/lib/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categoryValues = FINANCE_CATEGORIES.map(c => c.value) as [string, ...string[]];

// Zod schema for validating the AI's output
const InvoiceDataSchema = z.object({
    description: z.string().describe('El concepto o descripción detallada del gasto extraído de la factura (ej. "Cena de equipo en Restaurante El Sol").'),
    amount: z.number().describe('El monto total del gasto extraído de la factura.'),
    date: z.string().describe('La fecha de la transacción en formato YYYY-MM-DD. Si no se encuentra en la factura, usar la fecha actual.'),
    category: z.enum(categoryValues).describe('La categoría más apropiada para el gasto.'),
});

type InvoiceData = z.infer<typeof InvoiceDataSchema>;

export async function POST(req: NextRequest) {
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json({ success: false, error: 'La API key de OpenAI no está configurada.' }, { status: 500 });
  }

  const { imageDataUri } = await req.json();

  if (!imageDataUri) {
    return NextResponse.json({ success: false, error: 'No se recibió la imagen de la factura.' }, { status: 400 });
  }
  
  try {
    const systemPrompt = `Eres un asistente contable experto para una banda de mariachis. Tu tarea es analizar la imagen de una factura o recibo. Extrae con precisión los siguientes campos y responde ÚNICA Y EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, explicaciones o markdown.
    
    CAMPOS REQUERIDOS:
    - description: El concepto o descripción detallada del gasto (string).
    - amount: El monto total del gasto, como un NÚMERO (number), no un string. Ej: 1500.50.
    - date: La fecha de la transacción en formato YYYY-MM-DD (string). Si no se encuentra, usa la fecha actual: ${new Date().toISOString().split('T')[0]}.
    - category: La categoría más apropiada para el gasto, debe ser uno de los valores permitidos: ${categoryValues.join(', ')}.

    Asegúrate de que la salida sea un JSON perfecto que se ajuste al esquema.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza esta factura y extrae los datos requeridos en formato JSON." },
            {
              type: "image_url",
              image_url: {
                url: imageDataUri,
              },
            },
          ],
        },
      ],
    });

    if (!response.choices[0].message.content) {
         throw new Error('La IA no pudo procesar la factura correctamente.');
    }

    const extractedJson = JSON.parse(response.choices[0].message.content);
    const validationResult = InvoiceDataSchema.safeParse(extractedJson);

    if (!validationResult.success) {
        console.error("OpenAI response validation error:", validationResult.error);
        throw new Error("La IA devolvió datos en un formato inesperado.");
    }

    const extractedData: InvoiceData = validationResult.data;

    // Upload the original invoice image to Firebase Storage
    let invoiceUrl = '';
    try {
      const bucket = storage.bucket();
      const match = imageDataUri.match(/^data:(image\/.+);base64,(.+)$/);
      if (!match) {
          throw new Error('Formato de imagen no válido.');
      }
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const extension = mimeType.split('/')[1]?.split('+')[0] || 'bin';
      const fileName = `invoices/${uuidv4()}.${extension}`;
      const file = bucket.file(fileName);

      await file.save(buffer, { metadata: { contentType: mimeType } });

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2100',
      });
      invoiceUrl = signedUrl;
    } catch (uploadError: any) {
      console.error('Error subiendo la factura a Firebase Storage:', uploadError.message);
    }
    
    // Create the finance entry in Firestore
    const result = await createManualFinanceEntry({
      ...extractedData,
      type: 'expense',
      invoiceUrl: invoiceUrl,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: `Gasto "${extractedData.description}" registrado exitosamente.` });
    } else {
      return NextResponse.json({ success: false, error: `Error al registrar en la base de datos: ${result.error}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error en la API de análisis de factura (OpenAI):', error);
    let errorMessage = 'Ocurrió un error al comunicarse con la IA.';
    if (error.status === 401) {
        errorMessage = 'La API key de OpenAI no es válida o ha expirado. Por favor, verifica tu clave.'
    } else if (error instanceof OpenAI.APIError) {
        errorMessage = `Error de OpenAI: ${error.message}`;
    } else {
        errorMessage = error.message || errorMessage;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
