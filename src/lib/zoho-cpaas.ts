/**
 * Zoho CPaaS Transactional Email Client
 * Official Documentation: https://www.zoho.com/cpaas/help/api/email-sending.html
 *
 * Endpoint: POST https://cpaas.zoho.com/v1.1/email
 * Header: Authorization: Zoho-enczapikey {apiKey}
 */

export interface ZohoEmailAddress {
  address: string;
  name?: string;
}

export interface ZohoRecipientItem {
  email_address: ZohoEmailAddress;
}

export interface ZohoAttachment {
  name: string;
  mime_type: string;
  content: string; // Base64 encoded
  file_cache_key?: string;
}

export interface ZohoInlineImage {
  name: string;
  mime_type: string;
  content: string; // Base64 encoded
  cid: string;
}

export interface ZohoSendEmailOptions {
  to: string | string[] | ZohoEmailAddress | ZohoEmailAddress[];
  subject?: string;
  html?: string;
  text?: string;
  templateKey?: string;
  templateAlias?: string;
  mergeInfo?: Record<string, any>;
  fromEmail?: string;
  fromName?: string;
  cc?: string | string[] | ZohoEmailAddress | ZohoEmailAddress[];
  bcc?: string | string[] | ZohoEmailAddress | ZohoEmailAddress[];
  replyTo?: string | ZohoEmailAddress;
  clientReference?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  attachments?: ZohoAttachment[];
  inlineImages?: ZohoInlineImage[];
  mimeHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface ZohoEmailResult {
  success: boolean;
  status: 'accepted' | 'failed' | 'simulated';
  requestId?: string;
  code?: string;
  message: string;
  clientReference?: string;
  recipientCount?: number;
  error?: string;
  rawResponse?: any;
}

const DEFAULT_API_URL = 'https://cpaas.zoho.com/v1.1/email';
const DEFAULT_TIMEOUT_MS = 10000;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Mask an email address for safe logging: e.g. "john.doe@example.com" -> "j***e@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Validates a single email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
}

/**
 * Formats the Authorization header value for Zoho CPaaS
 * Requirement: Authorization: Zoho-enczapikey {apiKey}
 */
export function formatZohoAuthHeader(token: string): string {
  const trimmed = token.trim();
  if (trimmed.toLowerCase().startsWith('zoho-enczapikey ')) {
    return trimmed;
  }
  return `Zoho-enczapikey ${trimmed}`;
}

/**
 * Parses and separates valid vs invalid email addresses from a string or array of strings.
 * Supports comma, semicolon, space, or newline delimited addresses.
 */
export function parseEmailList(input?: string | string[]): { valid: string[]; invalid: string[] } {
  if (!input) return { valid: [], invalid: [] };

  const rawItems = Array.isArray(input) ? input : [input];
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    if (typeof item !== 'string') continue;
    // Split by comma, semicolon, newline, or whitespace
    const tokens = item.split(/[\s,;\n\r]+/);
    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed) continue;
      if (isValidEmail(trimmed)) {
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          valid.push(trimmed);
        }
      } else {
        invalid.push(trimmed);
      }
    }
  }

  return { valid, invalid };
}

/**
 * Normalizes email input to Zoho's recipient array format:
 * [ { email_address: { address: '...', name: '...' } } ]
 * Transparently parses comma/semicolon/newline separated string inputs and removes duplicates.
 */
export function normalizeRecipients(
  input?: string | string[] | ZohoEmailAddress | ZohoEmailAddress[]
): ZohoRecipientItem[] {
  if (!input) return [];

  const items = Array.isArray(input) ? input : [input];
  const results: ZohoRecipientItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (typeof item === 'string') {
      const splitTokens = item.split(/[\s,;\n\r]+/);
      for (const token of splitTokens) {
        const trimmed = token.trim();
        if (trimmed) {
          const lower = trimmed.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            results.push({ email_address: { address: trimmed } });
          }
        }
      }
    } else if (item && typeof item === 'object' && item.address) {
      const trimmed = item.address.trim();
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          results.push({
            email_address: {
              address: trimmed,
              ...(item.name ? { name: item.name.trim() } : {}),
            },
          });
        }
      }
    }
  }

  return results;
}

/**
 * Checks whether Zoho CPaaS is configured in environment variables
 */
export function isZohoCPaaSConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN ||
    process.env.ZOHO_CPAAS_API_KEY
  );
}

/**
 * Retrieves Zoho CPaaS configuration from environment
 */
export function getZohoConfig() {
  const token =
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN ||
    process.env.ZOHO_CPAAS_API_KEY ||
    '';

  const apiUrl =
    process.env.ZOHO_CPAAS_API_URL ||
    DEFAULT_API_URL;

  const fromEmail =
    process.env.ZOHO_CPAAS_FROM_EMAIL ||
    'info@sanex.rw';

  const fromName =
    process.env.ZOHO_CPAAS_FROM_NAME ||
    'SANEX Company Ltd';

  const agentAlias =
    process.env.ZOHO_CPAAS_AGENT_ALIAS ||
    '7c6dc6fcbb934ccb';

  return {
    token,
    apiUrl,
    fromEmail,
    fromName,
    agentAlias,
    isConfigured: Boolean(token),
  };
}

/**
 * Sends a transactional email through the official Zoho CPaaS Email API.
 *
 * NOTE: As per Zoho CPaaS documentation, HTTP 200 confirms that the request
 * has been successfully ACCEPTED into Zoho's delivery pipeline. It is not an
 * end-recipient mailbox delivery receipt.
 */
export async function sendZohoEmail(options: ZohoSendEmailOptions): Promise<ZohoEmailResult> {
  const config = getZohoConfig();

  // Validate configuration
  if (!config.isConfigured) {
    console.warn('[ZohoCPaaS] Token not configured (ZOHO_CPAAS_SEND_MAIL_TOKEN is empty).');
    return {
      success: false,
      status: 'failed',
      message: 'Zoho CPaaS is not configured. Set ZOHO_CPAAS_SEND_MAIL_TOKEN in environment variables.',
      error: 'CONFIG_MISSING',
    };
  }

  // Validate recipients
  const recipients = normalizeRecipients(options.to);
  if (recipients.length === 0) {
    return {
      success: false,
      status: 'failed',
      message: 'No valid recipient email address provided.',
      error: 'INVALID_RECIPIENTS',
    };
  }

  for (const r of recipients) {
    if (!isValidEmail(r.email_address.address)) {
      return {
        success: false,
        status: 'failed',
        message: `Invalid recipient email format: ${maskEmail(r.email_address.address)}`,
        error: 'INVALID_EMAIL_FORMAT',
      };
    }
  }

  const isTemplateDispatch = Boolean(options.templateKey || options.templateAlias);

  // Validate subject (mandatory unless template dispatch where Zoho template has predefined subject)
  if (!isTemplateDispatch && (!options.subject || !options.subject.trim())) {
    return {
      success: false,
      status: 'failed',
      message: 'Email subject is mandatory.',
      error: 'MISSING_SUBJECT',
    };
  }

  // Validate body presence (mandatory unless template dispatch)
  if (!isTemplateDispatch && !options.html && !options.text) {
    return {
      success: false,
      status: 'failed',
      message: 'Email body is mandatory. Provide html or text content.',
      error: 'MISSING_BODY',
    };
  }

  // Build sender
  const senderEmail = options.fromEmail || config.fromEmail;
  const senderName = options.fromName || config.fromName;
  if (!isValidEmail(senderEmail)) {
    return {
      success: false,
      status: 'failed',
      message: `Invalid sender email format: ${maskEmail(senderEmail)}`,
      error: 'INVALID_SENDER_EMAIL',
    };
  }

  // Construct request body conforming strictly to Zoho CPaaS specifications
  const payload: Record<string, any> = {
    from: {
      address: senderEmail,
      ...(senderName ? { name: senderName } : {}),
    },
    to: recipients,
  };

  if (options.subject && options.subject.trim()) {
    payload.subject = options.subject.trim();
  }
  if (options.templateKey) {
    payload.template_key = options.templateKey.trim();
  } else if (options.templateAlias) {
    payload.template_alias = options.templateAlias.trim();
  }
  if (options.mergeInfo && Object.keys(options.mergeInfo).length > 0) {
    payload.merge_info = options.mergeInfo;
  }

  if (options.html) {
    payload.htmlbody = options.html;
  }
  if (options.text) {
    payload.textbody = options.text;
  }
  if (options.clientReference) {
    payload.client_reference = options.clientReference.slice(0, 100);
  }
  if (options.trackOpens !== undefined) {
    payload.track_opens = options.trackOpens;
  }
  if (options.trackClicks !== undefined) {
    payload.track_clicks = options.trackClicks;
  }

  if (options.cc) {
    const ccRecipients = normalizeRecipients(options.cc);
    if (ccRecipients.length > 0) payload.cc = ccRecipients;
  }
  if (options.bcc) {
    const bccRecipients = normalizeRecipients(options.bcc);
    if (bccRecipients.length > 0) payload.bcc = bccRecipients;
  }
  if (options.replyTo) {
    if (typeof options.replyTo === 'string') {
      payload.reply_to = [{ address: options.replyTo.trim() }];
    } else if (options.replyTo.address) {
      payload.reply_to = [{
        address: options.replyTo.address.trim(),
        ...(options.replyTo.name ? { name: options.replyTo.name.trim() } : {}),
      }];
    }
  }
  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments;
  }
  if (options.inlineImages && options.inlineImages.length > 0) {
    payload.inline_images = options.inlineImages;
  }
  if (options.mimeHeaders && Object.keys(options.mimeHeaders).length > 0) {
    payload.mime_headers = options.mimeHeaders;
  }

  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const maskedRecipients = recipients.map(r => maskEmail(r.email_address.address)).join(', ');
  const logPrefix = `[ZohoCPaaS][Ref:${options.clientReference || 'N/A'}]`;
  const subjectDisplay = options.subject?.slice(0, 40) || options.templateKey || 'Template Dispatch';

  console.log(`${logPrefix} Initiating dispatch to ${maskedRecipients} (Target: "${subjectDisplay}...")`);

  const targetUrl = isTemplateDispatch
    ? config.apiUrl.replace(/\/email\/?$/, '/email/template')
    : config.apiUrl;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': formatZohoAuthHeader(config.token),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawText: responseText };
    }

    if (!response.ok) {
      const errCode = responseData?.data?.error_code || `HTTP_${response.status}`;
      const errMsg = responseData?.data?.message || responseData?.message || response.statusText || 'Request failed';
      console.error(`${logPrefix} API Error ${response.status} (${errCode}): ${errMsg}`);
      return {
        success: false,
        status: 'failed',
        code: errCode,
        message: `Zoho CPaaS returned error ${response.status}: ${errMsg}`,
        error: errMsg,
        clientReference: options.clientReference,
        recipientCount: recipients.length,
        rawResponse: responseData,
      };
    }

    // Success response handling
    // Sample Zoho 200 OK:
    // { "data": [{ "code": "EM_104", "message": "OK", "additional_info": [...] }], "message": "OK", "request_id": "req-xxxx" }
    const requestId = responseData?.request_id || responseData?.data?.[0]?.request_id;
    const resultCode = responseData?.data?.[0]?.code || 'EM_104';

    console.log(`${logPrefix} Dispatch ACCEPTED by Zoho CPaaS (Request ID: ${requestId || 'N/A'}, Code: ${resultCode})`);

    return {
      success: true,
      status: 'accepted',
      requestId,
      code: resultCode,
      message: `Email accepted by Zoho CPaaS for delivery (Request ID: ${requestId || 'N/A'}).`,
      clientReference: options.clientReference,
      recipientCount: recipients.length,
      rawResponse: responseData,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error(`${logPrefix} Request timed out after ${timeoutMs}ms`);
      return {
        success: false,
        status: 'failed',
        message: `Request to Zoho CPaaS timed out after ${timeoutMs}ms.`,
        error: 'REQUEST_TIMEOUT',
        clientReference: options.clientReference,
      };
    }

    console.error(`${logPrefix} Network/Dispatch exception:`, error.message);
    return {
      success: false,
      status: 'failed',
      message: `Failed to connect to Zoho CPaaS: ${error.message}`,
      error: error.message,
      clientReference: options.clientReference,
    };
  }
}

/**
 * Sends transactional email to single or multiple recipients.
 * Transparently chunks into batches of 50 if the recipient list exceeds Zoho CPaaS per-request limits.
 */
export async function sendZohoEmailBatch(
  options: ZohoSendEmailOptions
): Promise<ZohoEmailResult & { batchCount?: number; requestIds?: string[] }> {
  const recipients = normalizeRecipients(options.to);
  if (recipients.length === 0) {
    return {
      success: false,
      status: 'failed',
      message: 'No valid recipient email address provided.',
      error: 'INVALID_RECIPIENTS',
    };
  }

  // If 50 or fewer recipients, execute in a single dispatch
  if (recipients.length <= 50) {
    const singleResult = await sendZohoEmail(options);
    return {
      ...singleResult,
      batchCount: 1,
      requestIds: singleResult.requestId ? [singleResult.requestId] : [],
    };
  }

  // Chunk recipients in batches of 50
  const CHUNK_SIZE = 50;
  const chunks: ZohoRecipientItem[][] = [];
  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    chunks.push(recipients.slice(i, i + CHUNK_SIZE));
  }

  const requestIds: string[] = [];
  const errors: string[] = [];
  let successfulRecipients = 0;

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const chunkOptions: ZohoSendEmailOptions = {
      ...options,
      to: chunk.map((c) => c.email_address),
      clientReference: options.clientReference
        ? `${options.clientReference}-b${index + 1}`
        : undefined,
    };

    const res = await sendZohoEmail(chunkOptions);
    if (res.success) {
      if (res.requestId) requestIds.push(res.requestId);
      successfulRecipients += chunk.length;
    } else {
      errors.push(`Batch ${index + 1}: ${res.message || res.error}`);
    }
  }

  const allSuccess = errors.length === 0;
  return {
    success: allSuccess || requestIds.length > 0,
    status: allSuccess ? 'accepted' : requestIds.length > 0 ? 'accepted' : 'failed',
    message: allSuccess
      ? `Email queued by Zoho CPaaS for all ${recipients.length} recipients across ${chunks.length} batch(es).`
      : `Partially sent (${successfulRecipients}/${recipients.length} recipients queued). Warnings: ${errors.join('; ')}`,
    requestId: requestIds.join(', '),
    requestIds,
    batchCount: chunks.length,
    recipientCount: recipients.length,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

// ============================================================================
// REUSABLE BRAND TEMPLATES
// ============================================================================

const BRAND_COLOR = "#8DB833";
const BRAND_NAME = "SANEX Company Ltd";
const COMPANY_PHONE = "+250 788 385 838";
const COMPANY_EMAIL = "sanexcompany@gmail.com";

export interface StatusEmailTemplateData {
  bookingId: string;
  customerName?: string;
  customerEmail: string;
  serviceType: string;
  newStatus: string;
  appointmentDate?: string | null;
  preferredTime?: string | null;
  locationUrl?: string | null;
  phone?: string | null;
}

export function renderStatusEmailHtml(data: StatusEmailTemplateData): string {
  const { bookingId, customerName, serviceType, newStatus, appointmentDate, preferredTime, locationUrl, phone } = data;
  const s = (newStatus || 'pending').toLowerCase();

  let badgeColor = BRAND_COLOR;
  let statusMessage = "Your service request status has been updated.";
  let nextStep = "Our operations desk will keep you updated.";

  if (s === 'confirmed') {
    statusMessage = "Your service request has been confirmed. Equipment and operations crew have been scheduled.";
    nextStep = "Our dispatch team will arrive at your designated location during the scheduled window.";
  } else if (s === 'in-progress') {
    statusMessage = "Our operations crew is currently en-route or actively executing your sanitation service.";
    nextStep = "Our supervisor on-site will coordinate with you to ensure quality completion.";
  } else if (s === 'completed') {
    statusMessage = "Your liquid waste management service has been successfully completed.";
    nextStep = "Thank you for partnering with SANEX. If you require invoicing or waste disposal certification, please contact us.";
  } else if (s === 'cancelled') {
    badgeColor = "#64748b";
    statusMessage = "Your service request has been cancelled or could not be scheduled at this time.";
    nextStep = "If you wish to reschedule or believe this was done in error, please reach out to our desk.";
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Request Update - ${BRAND_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left; border-bottom: 4px solid ${BRAND_COLOR};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: ${BRAND_COLOR}; letter-spacing: 0.5px; text-transform: uppercase;">
                      SANEX <span style="color: #ffffff; font-weight: 400;">Company Ltd</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                      Sustainable Liquid Waste Management · Rwanda
                    </p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${badgeColor}; color: #000000; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px;">
                      ${newStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
                Hello ${customerName || 'Valued Customer'},
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155;">
                ${statusMessage}
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid ${badgeColor}; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Next Step:</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;">${nextStep}</p>
              </div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">
                  Service Request Details
                </h3>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
                  <tr>
                    <td style="color: #64748b; width: 35%; padding-bottom: 8px;">Reference ID:</td>
                    <td style="color: #0f172a; font-weight: 700; padding-bottom: 8px;"><code>#${bookingId}</code></td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Service:</td>
                    <td style="color: #0f172a; font-weight: 700; padding-bottom: 8px;">${serviceType}</td>
                  </tr>
                  ${appointmentDate ? `
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Preferred Date:</td>
                    <td style="color: #0f172a; font-weight: 600; padding-bottom: 8px;">${appointmentDate}${preferredTime ? ` (${preferredTime})` : ''}</td>
                  </tr>` : ''}
                  ${phone ? `
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Contact Phone:</td>
                    <td style="color: #0f172a; font-weight: 600; padding-bottom: 8px;">${phone}</td>
                  </tr>` : ''}
                  ${locationUrl ? `
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Service Location:</td>
                    <td style="padding-bottom: 8px;"><a href="${locationUrl}" style="color: #2563eb; text-decoration: underline;" target="_blank">View Location Pin</a></td>
                  </tr>` : ''}
                  <tr>
                    <td style="color: #64748b;">Current Status:</td>
                    <td style="color: #0f172a; font-weight: 700;">
                      <span style="color: #4d7c0f; text-transform: uppercase;">
                        ● ${newStatus}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b;">
                Need assistance? Contact our dispatch desk directly at
                <a href="tel:${COMPANY_PHONE.replace(/\s+/g, '')}" style="color: #0f172a; font-weight: 700; text-decoration: none;">${COMPANY_PHONE}</a> or
                <a href="mailto:${COMPANY_EMAIL}" style="color: #0f172a; font-weight: 700; text-decoration: none;">${COMPANY_EMAIL}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a;">${BRAND_NAME}</p>
              <p style="margin: 0 0 6px 0;">Leading Liquid Waste Management, Decentralized Wastewater Treatment & Eco-Sanitation.</p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">Kigali, Rwanda · Phone: ${COMPANY_PHONE} · Email: ${COMPANY_EMAIL}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function renderStatusEmailText(data: StatusEmailTemplateData): string {
  const { customerName, serviceType, newStatus, bookingId } = data;
  return `Hello ${customerName || 'Customer'},\n\nYour service request (${serviceType}) [Ref: #${bookingId}] status has been updated to: ${newStatus.toUpperCase()}.\n\nFor questions, contact SANEX Company Ltd at ${COMPANY_PHONE} or ${COMPANY_EMAIL}.\n\nThank you,\n${BRAND_NAME}`;
}

export interface BookingConfirmationTemplateData {
  bookingId: string;
  customerName?: string;
  customerEmail: string;
  serviceType: string;
  appointmentDate?: string | null;
  preferredTime?: string | null;
  phone?: string | null;
}

export function renderBookingConfirmationHtml(data: BookingConfirmationTemplateData): string {
  const { bookingId, customerName, serviceType, appointmentDate, preferredTime, phone } = data;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Request Received - ${BRAND_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left; border-bottom: 4px solid ${BRAND_COLOR};">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: ${BRAND_COLOR}; letter-spacing: 0.5px; text-transform: uppercase;">
                SANEX <span style="color: #ffffff; font-weight: 400;">Company Ltd</span>
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                Booking Request Confirmation
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
                Hello ${customerName || 'Valued Customer'},
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155;">
                We have received your service request. Our dispatch team is reviewing your schedule and details. You will receive an email update as soon as your booking is confirmed.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">
                  Your Request Summary
                </h3>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
                  <tr>
                    <td style="color: #64748b; width: 35%; padding-bottom: 8px;">Reference ID:</td>
                    <td style="color: #0f172a; font-weight: 700; padding-bottom: 8px;"><code>#${bookingId}</code></td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Requested Service:</td>
                    <td style="color: #0f172a; font-weight: 700; padding-bottom: 8px;">${serviceType}</td>
                  </tr>
                  ${appointmentDate ? `
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Requested Date:</td>
                    <td style="color: #0f172a; font-weight: 600; padding-bottom: 8px;">${appointmentDate}${preferredTime ? ` (${preferredTime})` : ''}</td>
                  </tr>` : ''}
                  ${phone ? `
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Contact Phone:</td>
                    <td style="color: #0f172a; font-weight: 600; padding-bottom: 8px;">${phone}</td>
                  </tr>` : ''}
                </table>
              </div>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b;">
                If you have immediate questions, call our dispatch desk at
                <a href="tel:${COMPANY_PHONE.replace(/\s+/g, '')}" style="color: #0f172a; font-weight: 700; text-decoration: none;">${COMPANY_PHONE}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a;">${BRAND_NAME}</p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">Kigali, Rwanda · Phone: ${COMPANY_PHONE} · Email: ${COMPANY_EMAIL}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function renderTestEmailHtml(params: {
  recipientEmail: string;
  triggeredBy?: string;
  timestamp?: string;
}): string {
  const ts = params.timestamp || new Date().toISOString();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Zoho CPaaS Test Email</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background-color: #0f172a; padding: 20px 24px; border-bottom: 4px solid ${BRAND_COLOR};">
      <h2 style="margin: 0; color: ${BRAND_COLOR}; font-size: 18px; text-transform: uppercase;">
        Zoho CPaaS Integration Test
      </h2>
      <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Automated Delivery Verification</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 15px; color: #0f172a; font-weight: 600; margin-top: 0;">
        ✅ Zoho CPaaS integration is operational!
      </p>
      <p style="font-size: 14px; color: #334155;">
        This test message was dispatched from your application through the official Zoho CPaaS Email API (<code>POST https://cpaas.zoho.com/v1.1/email</code>).
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td style="color: #64748b; width: 35%;">Recipient:</td>
            <td style="color: #0f172a; font-weight: 600;">${params.recipientEmail}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Triggered By:</td>
            <td style="color: #0f172a; font-weight: 600;">${params.triggeredBy || 'Admin Diagnostic'}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Timestamp:</td>
            <td style="color: #0f172a; font-family: monospace;">${ts}</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
        Note: Zoho CPaaS acceptance confirms the email was queued by Zoho servers. Final inbox delivery depends on verified domain DNS records (SPF, DKIM).
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface CustomBroadcastTemplateData {
  title?: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  recipientName?: string;
}

/**
 * Renders an official SANEX Company Ltd branded HTML template for custom admin messages,
 * client announcements, and broadcast communications.
 */
export function renderCustomBroadcastHtml(data: CustomBroadcastTemplateData): string {
  const { title, message, ctaText, ctaUrl, recipientName } = data;

  // Format paragraphs safely
  const paragraphs = (message || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br/>')}</p>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || BRAND_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left; border-bottom: 4px solid ${BRAND_COLOR};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: ${BRAND_COLOR}; letter-spacing: 0.5px; text-transform: uppercase;">
                      SANEX <span style="color: #ffffff; font-weight: 400;">Company Ltd</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                      Sustainable Liquid Waste Management · Rwanda
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${title ? `<h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a; font-weight: 700;">${title}</h2>` : ''}
              ${recipientName ? `<p style="margin: 0 0 14px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${recipientName},</p>` : ''}
              ${paragraphs || `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${message}</p>`}
              ${
                ctaText && ctaUrl
                  ? `
              <div style="margin: 28px 0; text-align: center;">
                <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #000000; font-size: 14px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${ctaText}
                </a>
              </div>`
                  : ''
              }
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; font-size: 13px; color: #64748b;">
                <p style="margin: 0;">For questions or operational support, contact SANEX at
                  <a href="tel:${COMPANY_PHONE.replace(/\s+/g, '')}" style="color: #0f172a; font-weight: 700; text-decoration: none;">${COMPANY_PHONE}</a> or
                  <a href="mailto:info@sanex.rw" style="color: #0f172a; font-weight: 700; text-decoration: none;">info@sanex.rw</a>.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a;">${BRAND_NAME}</p>
              <p style="margin: 0 0 6px 0;">Leading Liquid Waste Management, Decentralized Wastewater Treatment & Eco-Sanitation.</p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">Kigali, Rwanda · Phone: ${COMPANY_PHONE} · Email: info@sanex.rw</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text fallback for custom broadcast messages.
 */
export function renderCustomBroadcastText(data: CustomBroadcastTemplateData): string {
  const { title, message, ctaText, ctaUrl, recipientName } = data;
  let text = '';
  if (recipientName) text += `Dear ${recipientName},\n\n`;
  if (title) text += `${title.toUpperCase()}\n\n`;
  text += `${message}\n\n`;
  if (ctaText && ctaUrl) text += `${ctaText}: ${ctaUrl}\n\n`;
  text += `---\n${BRAND_NAME}\nPhone: ${COMPANY_PHONE}\nEmail: info@sanex.rw\nKigali, Rwanda`;
  return text;
}
