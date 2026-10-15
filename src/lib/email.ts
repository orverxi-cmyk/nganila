import nodemailer from 'nodemailer';
import {
  sendZohoEmail,
  isZohoCPaaSConfigured,
  renderStatusEmailHtml,
  renderStatusEmailText,
  renderBookingConfirmationHtml,
  ZohoEmailResult,
} from './zoho-cpaas';

export interface BookingEmailPayload {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceType: string;
  newStatus: string;
  appointmentDate?: string | null;
  preferredTime?: string | null;
  locationUrl?: string | null;
  phone?: string | null;
}

export interface BookingConfirmationPayload {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceType: string;
  appointmentDate?: string | null;
  preferredTime?: string | null;
  locationUrl?: string | null;
  phone?: string | null;
}

export interface EmailDispatchResult {
  success: boolean;
  method: 'zoho-cpaas' | 'resend' | 'smtp' | 'logged' | 'none';
  message?: string;
  requestId?: string;
  error?: string;
}

const BRAND_COLOR = "#8DB833";
const BRAND_NAME = "SANEX Company Ltd";
const COMPANY_PHONE = "+250 788 385 838";
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "sanexcompany@gmail.com";
const SENDER_EMAIL = process.env.ZOHO_CPAAS_FROM_EMAIL || "info@sanex.rw";
const DEFAULT_FROM = process.env.EMAIL_FROM || `"${BRAND_NAME}" <${SENDER_EMAIL}>`;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const clientId = process.env.SMTP_CLIENT_ID;
  const clientSecret = process.env.SMTP_CLIENT_SECRET;
  const refreshToken = process.env.SMTP_REFRESH_TOKEN;

  // 1. Zoho CPaaS / ZeptoMail SMTP Relay (smtp.zeptomail.com)
  if (host === 'smtp.zeptomail.com' || user === 'emailapikey') {
    const zohoKey = pass || process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN || process.env.ZOHO_CPAAS_API_KEY;
    if (zohoKey) {
      return nodemailer.createTransport({
        host: 'smtp.zeptomail.com',
        port: port || 587,
        secure: port === 465,
        auth: {
          user: user || 'emailapikey',
          pass: zohoKey,
        },
      });
    }
  }

  // 2. OAuth2 transport (preferred when OAuth credentials are present)
  if (user && clientId && clientSecret && refreshToken) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  // 3. Password-based transport (fallback / legacy)
  if (user && pass) {
    if (!host && (user.includes('@gmail.com') || process.env.SMTP_SERVICE === 'gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Sends a real-time status update email to the requester.
 * Priority order:
 * 1. Zoho CPaaS Email API (official transactional provider)
 * 2. Resend API (if configured)
 * 3. Nodemailer SMTP (Gmail OAuth2 / App Password)
 * 4. Safe dev log fallback
 */
export async function sendBookingStatusEmail(payload: BookingEmailPayload): Promise<EmailDispatchResult> {
  const { customerEmail, serviceType, newStatus, customerName, bookingId } = payload;

  if (!customerEmail || !customerEmail.includes('@')) {
    console.warn(`[sendBookingStatusEmail] Cannot send email: Invalid email address "${customerEmail}"`);
    return { success: false, method: 'none', message: 'Invalid recipient email address' };
  }

  const subject = `Service Request Update: ${serviceType} is now ${newStatus.toUpperCase()} - ${BRAND_NAME}`;
  const html = renderStatusEmailHtml({
    bookingId,
    customerName,
    customerEmail,
    serviceType,
    newStatus,
    appointmentDate: payload.appointmentDate,
    preferredTime: payload.preferredTime,
    locationUrl: payload.locationUrl,
    phone: payload.phone,
  });
  const text = renderStatusEmailText({
    bookingId,
    customerName,
    customerEmail,
    serviceType,
    newStatus,
  });

  // 1. Prioritize Zoho CPaaS if configured
  if (isZohoCPaaSConfigured()) {
    try {
      const zohoRes: ZohoEmailResult = await sendZohoEmail({
        to: { address: customerEmail, name: customerName },
        subject,
        html,
        text,
        clientReference: `status-${bookingId}-${newStatus.toLowerCase()}`,
      });

      if (zohoRes.success) {
        return {
          success: true,
          method: 'zoho-cpaas',
          message: zohoRes.message,
          requestId: zohoRes.requestId,
        };
      }
      console.warn(`[sendBookingStatusEmail] Zoho CPaaS dispatch failed: ${zohoRes.message}. Trying fallbacks.`);
    } catch (zohoErr: any) {
      console.warn(`[sendBookingStatusEmail] Zoho CPaaS exception: ${zohoErr.message}. Trying fallbacks.`);
    }
  }

  // 2. Try Resend API if API Key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: DEFAULT_FROM,
          to: [customerEmail],
          subject,
          html,
          text,
        }),
      });
      if (res.ok) {
        console.log(`[sendBookingStatusEmail] Status email delivered to ${customerEmail} via Resend.`);
        return { success: true, method: 'resend', message: 'Delivered via Resend' };
      }
      const errBody = await res.text();
      console.warn(`[sendBookingStatusEmail] Resend API error: ${errBody}`);
    } catch (resendErr: any) {
      console.warn(`[sendBookingStatusEmail] Failed sending via Resend: ${resendErr.message}`);
    }
  }

  // 3. Try Nodemailer SMTP (Gmail OAuth2 or custom SMTP)
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: DEFAULT_FROM,
        to: customerEmail,
        subject,
        html,
        text,
      });
      console.log(`[sendBookingStatusEmail] Status email delivered to ${customerEmail} via SMTP: ${info.messageId}`);
      return { success: true, method: 'smtp', message: 'Delivered via SMTP', requestId: info.messageId };
    } catch (smtpErr: any) {
      console.error(`[sendBookingStatusEmail] SMTP dispatch failed: ${smtpErr.message}`);
      return { success: false, method: 'smtp', message: smtpErr.message, error: smtpErr.message };
    }
  }

  // 4. Fallback / Dev Log: When no outbound email provider is configured
  console.log(`
======================================================
[EMAIL NOTIFICATION DISPATCHED (LOG MODE)]
To: ${customerEmail}
Subject: ${subject}
Status: ${newStatus.toUpperCase()}
Customer: ${customerName}
Service: ${serviceType}
(To enable live outbound delivery, configure ZOHO_CPAAS_SEND_MAIL_TOKEN or SMTP credentials in .env)
======================================================
  `);

  return {
    success: false,
    method: 'logged',
    message: 'Email not sent: no live email provider configured (Zoho CPaaS, Resend, or SMTP).',
  };
}

/**
 * Sends a booking confirmation email to the customer when a new service request is submitted.
 */
export async function sendBookingConfirmationEmail(payload: BookingConfirmationPayload): Promise<EmailDispatchResult> {
  const { customerEmail, serviceType, customerName, bookingId } = payload;

  if (!customerEmail || !customerEmail.includes('@')) {
    return { success: false, method: 'none', message: 'Invalid recipient email address' };
  }

  const subject = `Service Request Received: #${bookingId} - ${BRAND_NAME}`;
  const html = renderBookingConfirmationHtml({
    bookingId,
    customerName,
    customerEmail,
    serviceType,
    appointmentDate: payload.appointmentDate,
    preferredTime: payload.preferredTime,
    phone: payload.phone,
  });
  const text = `Hello ${customerName || 'Customer'},\n\nWe have received your service request for ${serviceType} (Reference: #${bookingId}).\n\nOur operations team is reviewing your schedule and will update you shortly.\n\nThank you,\n${BRAND_NAME}\nPhone: ${COMPANY_PHONE}`;

  // 1. Try Zoho CPaaS
  if (isZohoCPaaSConfigured()) {
    try {
      const zohoRes = await sendZohoEmail({
        to: { address: customerEmail, name: customerName },
        subject,
        html,
        text,
        clientReference: `confirm-${bookingId}`,
      });
      if (zohoRes.success) {
        return {
          success: true,
          method: 'zoho-cpaas',
          message: zohoRes.message,
          requestId: zohoRes.requestId,
        };
      }
    } catch (e: any) {
      console.warn(`[sendBookingConfirmationEmail] Zoho CPaaS failed: ${e.message}`);
    }
  }

  // 2. Try Nodemailer SMTP
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: DEFAULT_FROM,
        to: customerEmail,
        subject,
        html,
        text,
      });
      return { success: true, method: 'smtp', message: 'Confirmation sent via SMTP', requestId: info.messageId };
    } catch (e: any) {
      console.error(`[sendBookingConfirmationEmail] SMTP failed: ${e.message}`);
    }
  }

  return {
    success: false,
    method: 'logged',
    message: 'No live provider available for confirmation email.',
  };
}
