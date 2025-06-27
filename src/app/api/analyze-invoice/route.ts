import {NextRequest, NextResponse} from 'next/server';
import { analyzeInvoice, AnalyzeInvoiceOutputSchema } from '@/ai/flows/analyze-invoice-flow';
import { createManualFinanceEntry } from '@/services/eventService';
import { storage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const BUCKET_NAME = "mariachi-app-ygp7h.appspot.com";

export async function POST(req: NextRequest) {
  const { imageDataUri } = await req.json();

  if (!imageDataUri) {
    return NextResponse.json({ success: false, error: 'No se recibió la imagen de la factura.' }, { status: 400 });
  }

  try {
    // Step 1: Analyze the invoice using the Genkit flow
    const analysisResult = await analyzeInvoice({ imageDataUri });

    // Validate the output from the flow
    const validation = AnalyzeInvoiceOutputSchema.safeParse(analysisResult);
    if (!validation.success) {
        console.error("Genkit flow response validation error:", validation.error);
        throw new Error("La IA devolvió datos en un formato inesperado.");
    }
    const extractedData = validation.data;

    // Step 2: Upload the original invoice image to Firebase Storage
    let invoiceUrl = '';
    try {
      const bucket = storage.bucket(BUCKET_NAME);
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
      console.error('Error subiendo la factura a Firebase Storage:', uploadError);
      // We can decide to proceed without the URL or fail. Let's proceed but log it.
    }

    // Step 3: Create the finance entry in Firestore
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
    console.error('Error en la API de análisis de factura:', error);
    return NextResponse.json({ success: false, error: error.message || 'Ocurrió un error al comunicarse con la IA.' }, { status: 500 });
  }
}
