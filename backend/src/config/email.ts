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
