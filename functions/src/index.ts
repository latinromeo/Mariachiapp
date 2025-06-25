
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {PDFDocument, rgb, StandardFonts} from "pdf-lib";
import {format, parseISO} from "date-fns";
import {es} from "date-fns/locale";

// Initialize Firebase Admin SDK.
// It will automatically use the project's service account credentials.
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

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
  // If already in AM/PM format, return as is.
  if (timeString.toLowerCase().includes("am") || timeString.toLowerCase().includes("pm")) {
    return timeString;
  }
  // Otherwise, attempt to parse from 24-hour format.
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeString;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? "0" + minutes : String(minutes);
  return `${hours}:${minutesStr} ${ampm}`;
};

// Helper to sanitize filenames for safe storage.
const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9_.-]/gi, "_").toLowerCase();
};

/**
 * Generates a PDF receipt for a given event.
 * @param {any} eventData The data of the completed event.
 * @return {Promise<Buffer>} A promise that resolves with the PDF as a Buffer.
 */
async function generateReceipt(eventData: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const {width, height} = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Embed Logo from Firebase Storage (if it exists)
  try {
    // The bucket() method without arguments refers to the default GCS bucket.
    const bucket = storage.bucket();
    const logoFile = bucket.file("logo.png"); // Assumes logo.png is in the root.
    const [logoExists] = await logoFile.exists();
    if (logoExists) {
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
        logger.warn("Logo file 'logo.png' not found in Storage. Skipping.");
    }
  } catch (error) {
    logger.error("Could not embed logo from Storage. Continuing without it.", error);
  }

  let y = height - 140;

  // 2. Title
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

  // 3. Details Section
  const drawDetailRow = (
      label: string,
      value: string | undefined,
      isBold = false,
  ) => {
    if (value === undefined || value === null) return;
    page.drawText(label, {x: 50, y, font: boldFont, size: 12, color: rgb(0.3, 0.3, 0.3)});
    page.drawText(value, {x: 200, y, font: isBold ? boldFont : font, size: 12, color: rgb(0.1, 0.1, 0.1)});
    y -= 25;
  };

  const {
      clientName = "N/A",
      eventDate,
      eventTime = "N/A",
      eventType = "N/A",
      location = "N/A",
      sector = "N/A",
      contractedAmount,
      amountPaid,
      paymentMethod = "N/A",
  } = eventData;

  let formattedDate = "Fecha inválida";
  if (eventDate && typeof eventDate === "string") {
    try {
        const parsedDate = parseISO(eventDate);
        formattedDate = format(parsedDate, "eeee, dd 'de' MMMM 'de' yyyy", {locale: es});
    } catch (e) {
        logger.error("Could not parse event date:", eventDate, e);
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

  // 4. Thank You Message
  page.drawText(
      "Gracias por confiar en Mariachi Reyes de México. ¡Fue un honor formar parte de tu celebración! 🎺", {
        x: 50, y, font, size: 14, color: rgb(0.2, 0.2, 0.2), lineHeight: 20, width: width - 100, align: "center",
      },
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Triggered when an event document is updated.
 * Checks if the status changed to "completed" and generates a PDF receipt.
 */
export const onEventCompleted = onDocumentUpdated({region: "us-central1", document: "events/{eventId}"}, async (event) => {
    const eventId = event.params.eventId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
        logger.log(`Data missing for event update: ${eventId}. Exiting.`);
        return;
    }

    // The core logic: proceed only if status transitions to 'completed'.
    if (beforeData.status !== "completed" && afterData.status === "completed") {
        logger.log(`Event ${eventId} completed. Starting receipt generation.`);
        
        try {
            // Step 1: Generate PDF from event data.
            const pdfBuffer = await generateReceipt(afterData);
            
            // Step 2: Define file path and upload to Storage.
            const bucket = storage.bucket();
            const clientNameForFile = afterData.clientName || "sin_nombre";
            const sanitizedClientName = sanitizeFilename(clientNameForFile);
            const filePath = `receipts/recibo-${sanitizedClientName}-${afterData.eventDate}.pdf`;
            const file = bucket.file(filePath);

            await file.save(pdfBuffer, {
                metadata: { contentType: "application/pdf", cacheControl: "public, max-age=31536000" },
            });

            // Step 3: Make the file public and get its URL.
            await file.makePublic();
            
            // The public URL format is predictable for GCS.
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            logger.log(`Receipt for ${eventId} uploaded to: ${publicUrl}`);
            
            // Step 4: Update the event document in Firestore with the new PDF URL.
            await db.collection("events").doc(eventId).update({
                receiptUrlPDF: publicUrl,
            });

            logger.log(`Successfully updated event ${eventId} with receipt URL.`);

        } catch (error) {
            logger.error(`Failed to process receipt for event ${eventId}. Error:`, error);
        }
    }
});
