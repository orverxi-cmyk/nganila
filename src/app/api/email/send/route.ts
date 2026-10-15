import { NextResponse } from 'next/server';
import {
  sendZohoEmailBatch,
  getZohoConfig,
  parseEmailList,
  renderCustomBroadcastHtml,
  renderCustomBroadcastText,
  maskEmail,
} from '@/lib/zoho-cpaas';
import {
  verifyAdminAuthorization,
  checkRateLimit,
  getClientIp,
} from '@/lib/api-auth';

interface SendRequestBody {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  message?: string;
  html?: string;
  text?: string;
  useBrandedTemplate?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  clientReference?: string;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // 1. Rate limiting (max 20 requests per 60s window per IP)
  const rateLimit = checkRateLimit(`email-send:${ip}`, 20, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please throttle your requests.',
        resetInSeconds: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
        },
      }
    );
  }

  // 2. Authentication and Authorization (Privileged Operation)
  const auth = await verifyAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error || 'Unauthorized access. Valid administrative token required.',
      },
      { status: auth.statusCode || 401 }
    );
  }

  // 3. Parse and validate request body
  let body: SendRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed JSON payload.' },
      { status: 400 }
    );
  }

  const {
    to,
    cc,
    bcc,
    subject,
    message,
    html: rawHtml,
    text: rawText,
    useBrandedTemplate = true,
    ctaText,
    ctaUrl,
    clientReference,
  } = body;

  // Validate recipients
  if (!to) {
    return NextResponse.json(
      { success: false, error: 'Recipient address "to" is required.' },
      { status: 400 }
    );
  }

  const { valid: cleanedRecipients, invalid: invalidRecipients } = parseEmailList(to);

  if (invalidRecipients.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid email address format detected: ${invalidRecipients.map(maskEmail).join(', ')}`,
      },
      { status: 400 }
    );
  }

  if (cleanedRecipients.length === 0) {
    return NextResponse.json(
      { success: false, error: 'At least one valid recipient email address is required.' },
      { status: 400 }
    );
  }

  if (cleanedRecipients.length > 500) {
    return NextResponse.json(
      { success: false, error: 'Maximum 500 recipients per broadcast request allowed.' },
      { status: 400 }
    );
  }

  // Parse CC and BCC if provided
  const ccParsed = cc ? parseEmailList(cc) : { valid: [], invalid: [] };
  const bccParsed = bcc ? parseEmailList(bcc) : { valid: [], invalid: [] };

  if (ccParsed.invalid.length > 0) {
    return NextResponse.json(
      { success: false, error: `Invalid CC email format: ${ccParsed.invalid.map(maskEmail).join(', ')}` },
      { status: 400 }
    );
  }
  if (bccParsed.invalid.length > 0) {
    return NextResponse.json(
      { success: false, error: `Invalid BCC email format: ${bccParsed.invalid.map(maskEmail).join(', ')}` },
      { status: 400 }
    );
  }

  // Validate subject
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json(
      { success: false, error: 'Subject line is required.' },
      { status: 400 }
    );
  }

  // Resolve HTML and Text contents
  let finalHtml = rawHtml;
  let finalText = rawText;

  if (message && message.trim()) {
    if (useBrandedTemplate) {
      finalHtml = renderCustomBroadcastHtml({
        title: subject.trim(),
        message: message.trim(),
        ctaText: ctaText?.trim() || undefined,
        ctaUrl: ctaUrl?.trim() || undefined,
      });
      finalText = renderCustomBroadcastText({
        title: subject.trim(),
        message: message.trim(),
        ctaText: ctaText?.trim() || undefined,
        ctaUrl: ctaUrl?.trim() || undefined,
      });
    } else {
      finalHtml = `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">${message
        .trim()
        .replace(/\n/g, '<br/>')}</div>`;
      finalText = message.trim();
    }
  }

  if (!finalHtml && !finalText) {
    return NextResponse.json(
      { success: false, error: 'Email content ("message", "html", or "text") is required.' },
      { status: 400 }
    );
  }

  // 4. Enforce verified sender identity (strictly @sanex.rw)
  const config = getZohoConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: 'Email service is not configured on this server.',
      },
      { status: 503 }
    );
  }

  // 5. Send through Zoho CPaaS (supporting transparent 50-recipient chunking)
  const result = await sendZohoEmailBatch({
    to: cleanedRecipients,
    cc: ccParsed.valid.length > 0 ? ccParsed.valid : undefined,
    bcc: bccParsed.valid.length > 0 ? bccParsed.valid : undefined,
    subject: subject.trim(),
    html: finalHtml,
    text: finalText,
    clientReference: clientReference || `broadcast-${Date.now()}`,
    fromEmail: config.fromEmail, // Locked to verified sender identity info@sanex.rw
    fromName: config.fromName,
  });

  if (result.success) {
    return NextResponse.json({
      success: true,
      status: 'accepted',
      message: result.message || 'Email accepted by Zoho CPaaS for delivery queue.',
      requestId: result.requestId,
      requestIds: result.requestIds || (result.requestId ? [result.requestId] : []),
      recipientCount: cleanedRecipients.length,
      batchCount: result.batchCount || 1,
      clientReference: result.clientReference,
    });
  }

  return NextResponse.json(
    {
      success: false,
      status: 'failed',
      error: 'Failed to dispatch email through Zoho CPaaS.',
      message: result.message,
      code: result.code,
    },
    { status: 502 }
  );
}
