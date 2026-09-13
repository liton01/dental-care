import nodemailer from "nodemailer";
import twilio from "twilio";

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  });
  return transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

export async function sendSms(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID) throw new Error("Twilio is not configured");
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({ body, from: process.env.TWILIO_FROM, to });
}

export async function sendWhatsApp(to: string, body: string) {
  if (!process.env.WHATSAPP_PROVIDER_URL) throw new Error("WhatsApp provider is not configured");
  const response = await fetch(process.env.WHATSAPP_PROVIDER_URL, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.WHATSAPP_PROVIDER_TOKEN || ""}` },
    body: JSON.stringify({ to, body })
  });
  if (!response.ok) throw new Error(`WhatsApp provider returned ${response.status}`);
  return response.json();
}
