import { env } from "./env";
import { logger } from "./logger";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// Lazy-loaded nodemailer transporter (optional dependency)
let transporter: any = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    return transporter;
  } catch {
    logger.warn("nodemailer not available — emails will be logged to console");
    return null;
  }
}

export async function sendMail(options: MailOptions): Promise<void> {
  const t = getTransporter();

  if (t) {
    await t.sendMail({ from: env.SMTP_FROM, ...options });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } else {
    logger.info(`[EMAIL SIMULATION] To: ${options.to} | Subject: ${options.subject}`);
    logger.info(`[EMAIL BODY]\n${options.html.replace(/<[^>]+>/g, "")}`);
  }
}

export function buildPasswordResetEmail(name: string, resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Réinitialisation de votre mot de passe</h2>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Ce lien expire dans <strong>1 heure</strong>.</p>
      <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe ne changera pas.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">TEX Pro — Gestion de Maintenance Assistée par Ordinateur</p>
    </div>
  `;
}

export function buildAssignmentEmail(techName: string, interventionNumber: string, interventionUrl: string, details: { type: string; address?: string; scheduledDate?: string }): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Nouvelle mission assignée — ${interventionNumber}</h2>
      <p>Bonjour ${techName},</p>
      <p>Une nouvelle intervention vous a été assignée.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Référence :</strong> ${interventionNumber}</p>
        <p style="margin: 0 0 8px 0;"><strong>Type :</strong> ${details.type}</p>
        ${details.address ? `<p style="margin: 0 0 8px 0;"><strong>Adresse :</strong> ${details.address}</p>` : ""}
        ${details.scheduledDate ? `<p style="margin: 0;"><strong>Date prévue :</strong> ${new Date(details.scheduledDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${interventionUrl}"
           style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Voir l'intervention
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Connectez-vous à TEX Pro pour accepter ou refuser cette mission.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">TEX Pro — Gestion de Maintenance Assistée par Ordinateur</p>
    </div>
  `;
}

export function buildActivationEmail(name: string, activationUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Bienvenue sur GMAO Pro, ${name} !</h2>
      <p>Votre compte a été créé. Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre compte.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${activationUrl}"
           style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Activer mon compte
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Ce lien expire dans 24 heures.</p>
      <p style="color: #666; font-size: 14px;">Si vous n'attendiez pas cet email, ignorez-le.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">GMAO Pro — Gestion de Maintenance Assistée par Ordinateur</p>
    </div>
  `;
}
