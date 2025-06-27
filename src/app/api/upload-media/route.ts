
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import { createMediaFile } from '@/services/eventService';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const UploadRequestSchema = z.object({
    fileDataUri: z.string().startsWith('data:'),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    category: z.enum(["scores", "promo-videos", "pro-photos", "client-photos", "other"]),
});

const BUCKET_NAME = "mariachi-app-ygp7h.appspot.com";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validationResult = UploadRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({ success: false, error: 'Datos de solicitud inválidos.', details: validationResult.error.flatten() }, { status: 400 });
        }

        const { fileDataUri, fileName, fileType, fileSize, category } = validationResult.data;

        const match = fileDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
            throw new Error('Formato de imagen (Data URI) no válido.');
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `media/${category}/${uuidv4()}-${sanitizedFileName}`;
        
        const bucket = storage.bucket(BUCKET_NAME);
        const file = bucket.file(filePath);

        await file.save(buffer, { metadata: { contentType: mimeType } });

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '01-01-2100', // Long-lived URL
        });
        
        const mediaFileData = {
            name: fileName,
            category,
            fileType,
            url: signedUrl,
            size: fileSize,
        };

        const result = await createMediaFile(mediaFileData);

        if (!result.success) {
            // Optional: Clean up uploaded file if DB entry fails
            await file.delete().catch(e => console.error("Failed to cleanup file on DB error:", e));
            throw new Error(result.error || "No se pudo guardar la información del archivo en la base de datos.");
        }

        return NextResponse.json({ success: true, message: "Archivo subido exitosamente.", fileId: result.fileId });

    } catch (error: any) {
        console.error('--- DETAILED UPLOAD ERROR ---');
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('--- END DETAILED UPLOAD ERROR ---');
        return NextResponse.json({ success: false, error: error.message || 'Ocurrió un error en el servidor.' }, { status: 500 });
    }
}
