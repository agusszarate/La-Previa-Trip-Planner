import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"La Previa" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export function flightAlertEmail(
  flight: { origin: string; destination: string; price: number; currency: string },
  previousPrice?: number
) {
  const priceChange = previousPrice
    ? `<p>Precio anterior: ${previousPrice} ${flight.currency}</p>`
    : "";

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">✈️ Alerta de Vuelo</h2>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
        <p><strong>${flight.origin} → ${flight.destination}</strong></p>
        <p style="font-size: 24px; color: #059669; font-weight: bold;">
          ${flight.price} ${flight.currency}
        </p>
        ${priceChange}
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        — La Previa
      </p>
    </div>
  `;
}
