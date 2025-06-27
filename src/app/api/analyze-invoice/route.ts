
import {NextRequest, NextResponse} from 'next/server';
import { createManualFinanceEntry } from '@/services/eventService';
import { storage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { analyzeInvoice } from '@/ai/flows/analyze-invoice-flow';

export async function POST(req: NextRequest) {
  // Check for Genkit's API key. You should set GEMINI_API_KEY in your environment variables.
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json({ error: 'La API key de Gemini/Genkit no está configurada.' }, { status: 500 });
  }

  const { imageDataUri } = await req.json();

  if (!imageDataUri) {
    return NextResponse.json({ error: 'No se recibió la imagen de la factura.' }, { status: 400 });
  }
  
  try {
    // Call the Genkit flow to extract data
    const extractedData = await analyzeInvoice({ imageDataUri });
    
    // Upload the original invoice image to Firebase Storage
    let invoiceUrl = '';
    try {
      const bucket = storage.bucket();
      const match = imageDataUri.match(/^data:(image\/.+);base64,(.+)$/);
      if (!match) {
          throw new Error('Formato de imagen no válido. El archivo debe ser un data URI de imagen.');
      }
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const extension = mimeType.split('/')[1]?.split('+')[0] || 'bin';
      const fileName = `invoices/${uuidv4()}.${extension}`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
          metadata: { contentType: mimeType },
      });

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2100',
      });
      invoiceUrl = signedUrl;
    } catch (uploadError: any) {
      console.error('Error subiendo la factura a Firebase Storage (la operación continuará):', uploadError.message);
      // The expense will be created without an invoiceUrl, but the request won't fail.
    }
    
    // Create the finance entry in Firestore with the extracted data and image URL
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
    console.error('Error en API de análisis de factura (Genkit):', error);
    const errorMessage = error.message || 'Ocurrió un error al comunicarse con la IA.';
    
    if (error.cause?.message?.includes('API key not valid')) {
        return NextResponse.json({ success: false, error: 'La API key de Gemini no es válida.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
