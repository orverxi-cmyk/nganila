import { NextResponse } from 'next/server';
import {
  sendZohoEmail,
  getZohoConfig,
  isZohoCPaaSConfigured,
  isValidEmail,
  maskEmail,
  renderTestEmailHtml,
} from '@/lib/zoho-cpaas';
import {
  verifyAdminAuthorization,
  checkRateLimit,
  getClientIp,
} from '@/lib/api-auth';

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // 1. Rate limiting check (max 5 test emails per 60s window)
  const rateLimit = checkRateLimit(`email-test:${ip}`, 5, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many test requests. Please wait before retrying.',
        resetInSeconds: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Authentication and Authorization
  const auth = await verifyAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error || 'Unauthorized',
      },
      { status: auth.statusCode || 401 }
    );
  }

  // 3. Parse and validate body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const { recipientEmail, customSubject } = body || {};

  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Parameter "recipientEmail" is required.' },
      { status: 400 }
    );
  }

  const cleanRecipient = recipientEmail.trim().toLowerCase();
  if (!isValidEmail(cleanRecipient)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid email address format: "${maskEmail(cleanRecipient)}"`,
      },
      { status: 400 }
    );
  }

  // 4. Inspect current Zoho configuration
  const config = getZohoConfig();
  const configStatus = {
    configured: config.isConfigured,
    senderEmail: config.fromEmail,
    senderName: config.fromName,
    apiUrl: config.apiUrl,
  };

  if (!config.isConfigured) {
    return NextResponse.json(
      {
        success: false,
        status: 'unconfigured',
        error: 'Zoho CPaaS is not configured. Set ZOHO_CPAAS_SEND_MAIL_TOKEN in your environment.',
        configStatus,
      },
      { status: 503 }
    );
  }

  // 5. Build and send test message
  const subject = (customSubject && typeof customSubject === 'string' && customSubject.trim())
    ? customSubject.trim()
    : `Zoho CPaaS Test Dispatch - ${new Date().toLocaleDateString()}`;

  const timestamp = new Date().toISOString();
  const html = renderTestEmailHtml({
    recipientEmail: cleanRecipient,
    triggeredBy: auth.userEmail || 'Admin Diagnostic Panel',
    timestamp,
  });
  const text = `Zoho CPaaS Integration Test\n\nRecipient: ${cleanRecipient}\nTriggered By: ${auth.userEmail || 'Admin'}\nTimestamp: ${timestamp}\n\nNote: This confirms API dispatch acceptance by Zoho CPaaS.`;

  const startTime = Date.now();
  const result = await sendZohoEmail({
    to: cleanRecipient,
    subject,
    html,
    text,
    clientReference: `test-${Date.now()}`,
    timeoutMs: 12000,
  });
  const durationMs = Date.now() - startTime;

  if (result.success) {
    return NextResponse.json({
      success: true,
      status: 'accepted',
      message: 'Email accepted by Zoho CPaaS for delivery queue.',
      notice: 'Note: This confirms API dispatch acceptance, not final mailbox delivery confirmation. Delivery depends on verified sender domain DNS records.',
      recipientMasked: maskEmail(cleanRecipient),
      requestId: result.requestId,
      code: result.code,
      durationMs,
      configStatus,
    });
  }

  return NextResponse.json(
    {
      success: false,
      status: 'failed',
      error: result.error || 'Zoho CPaaS dispatch failed',
      code: result.code,
      message: result.message,
      durationMs,
      configStatus,
    },
    { status: 502 }
  );
}

/**
 * GET handler to check current Zoho CPaaS configuration status without triggering an email
 */
export async function GET(request: Request) {
  const auth = await verifyAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Unauthorized' },
      { status: auth.statusCode || 401 }
    );
  }

  const config = getZohoConfig();
  return NextResponse.json({
    configured: config.isConfigured,
    senderEmail: config.fromEmail,
    senderName: config.fromName,
    apiUrl: config.apiUrl,
    authPrefix: 'Zoho-enczapikey',
  });
}
