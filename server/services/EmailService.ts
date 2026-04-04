import nodemailer from 'nodemailer';
import { logger } from '../logger';

export interface InvitationEmailData {
  to: string;
  orgName: string;
  inviterName: string;
  role: string;
  token: string;
  expiresAt: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Fallback to Ethereal-style preview in dev when SMTP not configured
  if (!host || !user || !pass) {
    logger.warn('SMTP not configured — email sending disabled (set SMTP_HOST, SMTP_USER, SMTP_PASS)');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM_ADDRESS = process.env.SMTP_FROM ?? 'CogniSys BA <noreply@cognisys.io>';
const APP_URL = process.env.APP_URL ?? 'https://cognisys.io';

export class EmailService {
  private static transport = createTransport();

  /** Send an org invitation email. */
  static async sendInvitation(data: InvitationEmailData): Promise<void> {
    if (!EmailService.transport) {
      logger.info({ to: data.to }, 'Email skipped (SMTP not configured)');
      return;
    }

    const acceptUrl = `${APP_URL}/invitations/${data.token}/accept`;
    const expiry = new Date(data.expiresAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    await EmailService.transport.sendMail({
      from: FROM_ADDRESS,
      to: data.to,
      subject: `You're invited to join ${data.orgName} on CogniSys BA`,
      text: [
        `Hi there,`,
        ``,
        `${data.inviterName} has invited you to join ${data.orgName} as a ${data.role}.`,
        ``,
        `Accept your invitation (expires ${expiry}):`,
        acceptUrl,
        ``,
        `If you didn't expect this email, you can safely ignore it.`,
        ``,
        `— The CogniSys BA Team`,
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 8px">You're invited to join <strong>${data.orgName}</strong></h2>
          <p style="color:#555;margin:0 0 24px">${data.inviterName} has invited you as a <strong>${data.role}</strong>.</p>
          <a href="${acceptUrl}"
             style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Accept Invitation
          </a>
          <p style="color:#888;font-size:13px;margin:24px 0 0">This invitation expires on ${expiry}. If you didn't expect this, ignore it.</p>
        </div>
      `,
    });

    logger.info({ to: data.to, org: data.orgName }, 'Invitation email sent');
  }

  /** Send a welcome email after a user accepts an invitation. */
  static async sendWelcome(to: string, name: string, orgName: string, role: string): Promise<void> {
    if (!EmailService.transport) return;

    await EmailService.transport.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: `Welcome to ${orgName} on CogniSys BA`,
      text: `Hi ${name},\n\nYou've successfully joined ${orgName} as a ${role}. Log in to get started:\n${APP_URL}\n\n— The CogniSys BA Team`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2>Welcome to <strong>${orgName}</strong>!</h2>
          <p>Hi ${name}, you've joined as a <strong>${role}</strong>.</p>
          <a href="${APP_URL}"
             style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Open CogniSys BA
          </a>
        </div>
      `,
    });

    logger.info({ to, org: orgName }, 'Welcome email sent');
  }

  /** Send a digest of unread notifications. */
  static async sendNotificationDigest(to: string, notifications: { title: string; message: string }[]): Promise<void> {
    if (!EmailService.transport || notifications.length === 0) return;

    const items = notifications
      .map((n) => `• ${n.title}: ${n.message}`)
      .join('\n');

    await EmailService.transport.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: `You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''} on CogniSys BA`,
      text: `Here's what you missed:\n\n${items}\n\nView all: ${APP_URL}\n\n— The CogniSys BA Team`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2>You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}</h2>
          <ul style="padding-left:16px;color:#333">
            ${notifications.map((n) => `<li><strong>${n.title}</strong>: ${n.message}</li>`).join('')}
          </ul>
          <a href="${APP_URL}"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            View All
          </a>
        </div>
      `,
    });

    logger.info({ to, count: notifications.length }, 'Notification digest sent');
  }
}
