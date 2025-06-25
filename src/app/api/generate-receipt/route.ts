
import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Helper to format currency consistently.
const formatCurrency = (value: number | undefined) => {
  if (typeof value !== "number" || isNaN(value)) {
    return "RD$0.00";
  }
  return `RD$${(value).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper to format time to 12-hour format with AM/PM.
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return "";
  if (timeString.toLowerCase().includes("am") || timeString.toLowerCase().includes("pm")) {
    return timeString;
  }
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeString;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? "0" + String(minutes) : String(minutes);
  return `${hours}:${minutesStr} ${ampm}`;
};

// Helper to sanitize filenames for safe storage.
const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9_.-]/gi, "_").toLowerCase();
};

async function generateReceipt(eventData: any): Promise<Buffer> {
  console.log("Step 1: Starting PDF generation.");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const {width, height} = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  try {
    const bucket = storage.bucket();
    const logoFile = bucket.file("logo.png");
    const [logoExists] = await logoFile.exists();
    if (logoExists) {
        console.log("Step 2: Logo found in Storage. Embedding logo.");
        const [logoImageBytes] = await logoFile.download();
        const logoImage = await pdfDoc.embedPng(logoImageBytes);
        const logoDims = logoImage.scale(0.25);
        page.drawImage(logoImage, {
          x: (width - logoDims.width) / 2,
          y: height - 100,
          width: logoDims.width,
          height: logoDims.height,
        });
    } else {
      console.warn("Step 2: Logo 'logo.png' not found in Storage. Continuing without it.");
    }
  } catch (error) {
    console.error("Step 2: Error loading logo from Storage. Continuing without it.", error);
  }

  let y = height - 140;

  page.drawText("Recibo de Evento Completado", {
    x: 0,
    y: y,
    width,
    font: boldFont,
    size: 20,
    color: rgb(0.1, 0.1, 0.1),
    align: "center",
  });
  y -= 50;

  const drawDetailRow = (label: string, value: string | undefined, isBold = false) => {
    if (value === undefined || value === null) return;
    page.drawText(label, {x: 50, y, font: boldFont, size: 12, color: rgb(0.3, 0.3, 0.3)});
    page.drawText(value, {x: 200, y, font: isBold ? boldFont : font, size: 12, color: rgb(0.1, 0.1, 0.1)});
    y -= 25;
  };

  const { clientName, eventDate, eventTime, eventType, location, sector, contractedAmount, amountPaid, paymentMethod } = eventData;
  console.log("Step 3: Drawing event details onto PDF.");

  let formattedDate = "Fecha inválida";
  if (eventDate && typeof eventDate === "string") {
    try {
        const parsedDate = parseISO(eventDate);
        formattedDate = format(parsedDate, "eeee, dd 'de' MMMM 'de' yyyy", {locale: es});
    } catch (e) {
        console.error("Could not parse event date:", eventDate, e);
    }
  }

  drawDetailRow("Cliente:", clientName);
  drawDetailRow("Fecha:", formattedDate);
  drawDetailRow("Hora:", formatTime(eventTime));
  drawDetailRow("Tipo de Evento:", eventType);
  drawDetailRow("Dirección:", `${location}, ${sector}`);
  y -= 10;
  drawDetailRow("Monto Total:", formatCurrency(contractedAmount), true);
  drawDetailRow("Monto Pagado:", formatCurrency(amountPaid), true);
  drawDetailRow("Método de Pago:", paymentMethod);
  y -= 20;

  page.drawText(
      "Gracias por confiar en Mariachi Reyes de México. ¡Fue un honor formar parte de tu celebración! 🎺", {
        x: 50, y, font, size: 14, color: rgb(0.2, 0.2, 0.2), lineHeight: 20, width: width - 100, align: "center",
      },
  );

  console.log("Step 4: Saving PDF to buffer.");
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}


export async function POST(req: NextRequest) {
    console.log("--- generate-receipt API called ---");
    const { eventId } = await req.json();

    if (!eventId) {
        console.error("API Error: Event ID is required.");
        return NextResponse.json({ success: false, error: 'Event ID is required.' }, { status: 400 });
    }
    console.log(`Processing receipt for event ID: ${eventId}`);

    try {
        const eventRef = db.collection("events").doc(eventId);
        const eventSnap = await eventRef.get();

        if (!eventSnap.exists) {
            console.error(`API Error: Event with ID ${eventId} not found.`);
            return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
        }
        
        const eventData = eventSnap.data();
        if (!eventData) {
            console.error(`API Error: Event data is empty for ID ${eventId}.`);
            return NextResponse.json({ success: false, error: 'Event data is empty.' }, { status: 500 });
        }

        console.log("Event data fetched successfully.");
        const pdfBuffer = await generateReceipt(eventData);
        
        console.log("Step 5: PDF buffer created. Uploading to Firebase Storage.");
        const bucket = storage.bucket();
        const clientNameForFile = eventData.clientName || "sin_nombre";
        const sanitizedClientName = sanitizeFilename(clientNameForFile);
        const filePath = `receipts/recibo-${sanitizedClientName}-${eventData.eventDate}.pdf`;
        const file = bucket.file(filePath);

        await file.save(pdfBuffer, {
            metadata: { contentType: "application/pdf", cacheControl: "public, max-age=31536000" },
        });
        console.log(`Step 6: File uploaded successfully to: ${filePath}`);

        console.log("Step 7: Generating signed URL for the file.");
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: "01-01-2100", // A very distant future date.
        });
        console.log("Step 8: Signed URL generated. Updating event document.");
        
        await eventRef.update({
            receiptUrlPDF: signedUrl,
        });
        console.log("Step 9: Event document updated with PDF URL. Process complete.");

        return NextResponse.json({ success: true, receiptUrl: signedUrl });

    } catch (error: any) {
        console.error(`--- FATAL ERROR for event ${eventId} ---`, error);
        // Try to update Firestore to indicate an error state for better UX
        try {
            await db.collection("events").doc(eventId).update({ receiptUrlPDF: "error" });
        } catch (updateError) {
             console.error(`Could not even update event ${eventId} with error state.`, updateError);
        }
        return NextResponse.json({ success: false, error: error.message || 'An unknown server error occurred.' }, { status: 500 });
    }
}
