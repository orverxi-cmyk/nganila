import { NextResponse } from 'next/server';
import {
  sendZohoEmail,
  getZohoConfig,
  isValidEmail,
  maskEmail,
} from '@/lib/zoho-cpaas';
import {
  verifyAdminAuthorization,
  checkRateLimit,
  getClientIp,
} from '@/lib/api-auth';

interface SendRequestBody {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
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

  const { to, subject, html, text, clientReference } = body;

  // Validate recipients
  if (!to) {
    return NextResponse.json(
      { success: false, error: 'Recipient address "to" is required.' },
      { status: 400 }
    );
  }

  const rawRecipients = Array.isArray(to) ? to : [to];
  const cleanedRecipients: string[] = [];

  for (const r of rawRecipients) {
    if (typeof r !== 'string' || !isValidEmail(r.trim())) {
      return NextResponse.json(
        { success: false, error: `Invalid recipient email address format: "${maskEmail(String(r))}"` },
        { status: 400 }
      );
    }
    cleanedRecipients.push(r.trim().toLowerCase());
  }

  if (cleanedRecipients.length > 50) {
    return NextResponse.json(
      { success: false, error: 'Maximum 50 recipients per request allowed.' },
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

  // Validate content
  if (!html && !text) {
    return NextResponse.json(
      { success: false, error: 'Email content ("html" or "text") is required.' },
      { status: 400 }
    );
  }

  // 4. Enforce verified sender identity (never allow client-specified arbitrary sender)
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

  // 5. Send through Zoho CPaaS
  const result = await sendZohoEmail({
    to: cleanedRecipients,
    subject: subject.trim(),
    html,
    text,
    clientReference: clientReference || `send-${Date.now()}`,
    fromEmail: config.fromEmail, // Locked to verified sender identity
    fromName: config.fromName,
  });

  if (result.success) {
    return NextResponse.json({
      success: true,
      status: 'accepted',
      message: 'Email accepted by Zoho CPaaS for delivery queue.',
      requestId: result.requestId,
      recipientCount: cleanedRecipients.length,
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
