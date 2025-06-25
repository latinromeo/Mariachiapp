import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {PDFDocument, rgb, StandardFonts} from "pdf-lib";
import {format, parseISO} from "date-fns";
import {es} from "date-fns/locale";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Helper to format currency
const formatCurrency = (value: number | undefined) => {
  if (typeof value !== "number" || isNaN(value)) {
    return "RD$0.00";
  }
  return `RD$${(value).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper to format time to 12-hour format with AM/PM
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) {
    return "";
  }
  if (timeString.toLowerCase().includes("am") ||
      timeString.toLowerCase().includes("pm")) {
    return timeString;
  }
  const parts = timeString.split(":");
  if (parts.length < 2) {
    return timeString;
  }
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) {
    return timeString;
  }
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? "0" + minutes : String(minutes);
  return `${hours}:${minutesStr} ${ampm}`;
};

// Helper to sanitize filenames
const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9_.-]/gi, "_").toLowerCase();
};


async function generateReceipt(eventData: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const {width, height} = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Logo from Firebase Storage
  const bucket = storage.bucket();
  const logoFile = bucket.file("logo.png"); // Assumes logo.png is in the root of the bucket
  try {
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
        functions.logger.warn("Logo file 'logo.png' does not exist in the root of the Storage bucket. Skipping logo.");
    }
  } catch (error) {
    functions.logger.error("Could not fetch or embed logo from Storage.", error);
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
    if (!value) return;
    page.drawText(label, {
      x: 50,
      y,
      font: boldFont,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(value, {
      x: 200,
      y,
      font: isBold ? boldFont : font,
      size: 12,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 25;
  };

  // Defensive checks for eventData fields
  const clientName = eventData.clientName || "N/A";
  const eventDate = eventData.eventDate;
  const eventTime = eventData.eventTime || "N/A";
  const eventType = eventData.eventType || "N/A";
  const location = eventData.location || "N/A";
  const sector = eventData.sector || "N/A";
  const contractedAmount = eventData.contractedAmount;
  const amountPaid = eventData.amountPaid;
  const paymentMethod = eventData.paymentMethod || "N/A";

  let formattedDate = "Fecha inválida";
  if (eventDate) {
    try {
        const parsedDate = parseISO(eventDate);
        formattedDate = format(parsedDate, "eeee, dd 'de' MMMM 'de' yyyy", {locale: es});
    } catch (e) {
        functions.logger.error("Could not parse event date:", eventDate, e);
    }
  }
  const formattedTime = formatTime(eventTime);

  drawDetailRow("Cliente:", clientName);
  drawDetailRow("Fecha:", formattedDate);
  drawDetailRow("Hora:", formattedTime);
  drawDetailRow("Tipo de Evento:", eventType);
  drawDetailRow("Dirección:", `${location}, ${sector}`);
  y -= 10;
  drawDetailRow("Monto Total:", formatCurrency(contractedAmount), true);
  drawDetailRow("Monto Pagado:", formatCurrency(amountPaid), true);
  drawDetailRow("Método de Pago:", paymentMethod);
  y -= 20;

  // 4. Thank You Message
  page.drawText(
      "Gracias por confiar en Mariachi Reyes de México. " +
      "¡Fue un honor formar parte de tu celebración! 🎺",
      {
        x: 50,
        y: y,
        font: font,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        lineHeight: 20,
        width: width - 100,
        align: "center",
      },
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}


export const onEventCompleted = functions.region("us-central1")
    .firestore.document("events/{eventId}")
    .onUpdate(async (change, context) => {
      const eventId = context.params.eventId;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if status changed to 'completed'
      if (beforeData.status !== "completed" && afterData.status === "completed") {
        functions.logger.log(`Event ${eventId} marked as completed. Generating receipt.`);

        try {
          // 1. Generate PDF
          const pdfBuffer = await generateReceipt(afterData);

          // 2. Upload to Firebase Storage
          const bucket = storage.bucket();
          const clientNameForFile = afterData.clientName || "sin_nombre";
          const sanitizedClientName = sanitizeFilename(clientNameForFile);
          const fileName = `receipts/recibo-${sanitizedClientName}-${afterData.eventDate}.pdf`;
          const file = bucket.file(fileName);

          await file.save(pdfBuffer, {
            metadata: {
              contentType: "application/pdf",
            },
          });

          // 3. Make file public and get URL
          await file.makePublic();
          const publicUrl = file.publicUrl();
          functions.logger.log(`Receipt uploaded to ${publicUrl}`);

          // 4. Update Firestore document with the URL
          await db.collection("events").doc(eventId).update({
            receiptUrlPDF: publicUrl,
          });

          functions.logger.log(`Successfully updated event ${eventId} with receipt URL.`);
        } catch (error) {
          functions.logger.error(`Failed to generate or upload receipt for event ${eventId}:`, error);
        }
      }
      return null;
    });
