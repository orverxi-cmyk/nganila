import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmail,
  maskEmail,
  formatZohoAuthHeader,
  normalizeRecipients,
  sendZohoEmail,
  renderStatusEmailHtml,
  renderStatusEmailText,
  renderBookingConfirmationHtml,
  renderTestEmailHtml,
} from '../src/lib/zoho-cpaas';
import { checkRateLimit } from '../src/lib/api-auth';

describe('Zoho CPaaS Email Validation and Formatting', () => {
  it('validates email formats accurately', () => {
    assert.equal(isValidEmail('sanexcompany@gmail.com'), true);
    assert.equal(isValidEmail('dispatch@sanex.rw'), true);
    assert.equal(isValidEmail('john.doe+tag@sub.domain.co'), true);

    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail('invalid-email'), false);
    assert.equal(isValidEmail('@missinguser.com'), false);
    assert.equal(isValidEmail('user@missingtld'), false);
    assert.equal(isValidEmail(null as any), false);
    assert.equal(isValidEmail(undefined as any), false);
  });

  it('masks email addresses safely for logs', () => {
    assert.equal(maskEmail('sanexcompany@gmail.com'), 's***y@gmail.com');
    assert.equal(maskEmail('dispatch@sanex.rw'), 'd***h@sanex.rw');
    assert.equal(maskEmail('ab@domain.com'), 'a*@domain.com');
    assert.equal(maskEmail(''), '***');
  });

  it('formats Zoho authorization header correctly', () => {
    // When raw token is provided
    assert.equal(
      formatZohoAuthHeader('abc123xyzSecretKey'),
      'Zoho-enczapikey abc123xyzSecretKey'
    );

    // When token already includes prefix (prevents double-prefixing)
    assert.equal(
      formatZohoAuthHeader('Zoho-enczapikey abc123xyzSecretKey'),
      'Zoho-enczapikey abc123xyzSecretKey'
    );
  });

  it('normalizes various recipient formats into Zoho CPaaS payload structure', () => {
    // Single string
    const r1 = normalizeRecipients('client@example.com');
    assert.deepEqual(r1, [
      { email_address: { address: 'client@example.com' } },
    ]);

    // Array of strings
    const r2 = normalizeRecipients(['a@sanex.rw', 'b@sanex.rw']);
    assert.deepEqual(r2, [
      { email_address: { address: 'a@sanex.rw' } },
      { email_address: { address: 'b@sanex.rw' } },
    ]);

    // Object with name
    const r3 = normalizeRecipients({ address: 'vip@sanex.rw', name: 'VIP Client' });
    assert.deepEqual(r3, [
      { email_address: { address: 'vip@sanex.rw', name: 'VIP Client' } },
    ]);
  });
});

describe('Zoho CPaaS Email Client (Mocked API Responses)', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('fails gracefully when ZOHO_CPAAS_SEND_MAIL_TOKEN is not configured', async () => {
    delete process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN;
    delete process.env.ZOHO_CPAAS_API_KEY;

    const res = await sendZohoEmail({
      to: 'client@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    });

    assert.equal(res.success, false);
    assert.equal(res.status, 'failed');
    assert.equal(res.error, 'CONFIG_MISSING');
  });

  it('rejects invalid recipient format before making HTTP call', async () => {
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN = 'mock-valid-token';

    const res = await sendZohoEmail({
      to: 'not-a-valid-email',
      subject: 'Test Subject',
      text: 'Test Body',
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'INVALID_EMAIL_FORMAT');
  });

  it('rejects missing subject or body', async () => {
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN = 'mock-valid-token';

    const res1 = await sendZohoEmail({
      to: 'client@example.com',
      subject: '',
      text: 'Body only',
    });
    assert.equal(res1.success, false);
    assert.equal(res1.error, 'MISSING_SUBJECT');

    const res2 = await sendZohoEmail({
      to: 'client@example.com',
      subject: 'Subject only',
    });
    assert.equal(res2.success, false);
    assert.equal(res2.error, 'MISSING_BODY');
  });

  it('handles mocked Zoho CPaaS 200 OK success response', async () => {
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN = 'test-token-12345';
    process.env.ZOHO_CPAAS_FROM_EMAIL = 'sanexcompany@gmail.com';
    process.env.ZOHO_CPAAS_FROM_NAME = 'SANEX Company Ltd';

    let interceptedUrl = '';
    let interceptedHeaders: any = {};
    let interceptedBody: any = {};

    global.fetch = async (url: any, init: any): Promise<Response> => {
      interceptedUrl = String(url);
      interceptedHeaders = init.headers;
      interceptedBody = JSON.parse(init.body);

      const mockResponse = {
        data: [
          {
            code: 'EM_104',
            additional_info: [{ to: { email_address: {} } }],
            message: 'OK',
          },
        ],
        message: 'OK',
        request_id: 'req-zoho-98765',
      };

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await sendZohoEmail({
      to: 'customer@example.com',
      subject: 'Service Booking Confirmed',
      html: '<strong>Confirmed!</strong>',
      text: 'Confirmed!',
      clientReference: 'booking-999',
    });

    assert.equal(interceptedUrl, 'https://cpaas.zoho.com/v1.1/email');
    assert.equal(interceptedHeaders['Authorization'], 'Zoho-enczapikey test-token-12345');
    assert.equal(interceptedHeaders['Content-Type'], 'application/json');
    assert.equal(interceptedBody.from.address, 'sanexcompany@gmail.com');
    assert.equal(interceptedBody.from.name, 'SANEX Company Ltd');
    assert.equal(interceptedBody.to[0].email_address.address, 'customer@example.com');
    assert.equal(interceptedBody.subject, 'Service Booking Confirmed');
    assert.equal(interceptedBody.client_reference, 'booking-999');

    assert.equal(res.success, true);
    assert.equal(res.status, 'accepted');
    assert.equal(res.requestId, 'req-zoho-98765');
    assert.equal(res.code, 'EM_104');
  });

  it('handles mocked Zoho CPaaS 400 error response without exposing tokens', async () => {
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN = 'secret-agent-token-do-not-leak';

    global.fetch = async (): Promise<Response> => {
      const mockErrorResponse = {
        data: {
          error_code: 'TM_3004',
          message: 'Invalid request: sender domain not verified',
        },
        message: 'error',
      };

      return new Response(JSON.stringify(mockErrorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await sendZohoEmail({
      to: 'customer@example.com',
      subject: 'Test Error',
      text: 'Body text',
    });

    assert.equal(res.success, false);
    assert.equal(res.status, 'failed');
    assert.equal(res.code, 'TM_3004');
    assert.match(res.message, /sender domain not verified/);
    // Ensure token was not embedded in error message
    assert.equal(res.message.includes('secret-agent-token-do-not-leak'), false);
  });

  it('handles request timeout gracefully', async () => {
    process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN = 'test-token';

    global.fetch = async (): Promise<Response> => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    };

    const res = await sendZohoEmail({
      to: 'customer@example.com',
      subject: 'Timeout Test',
      text: 'Body',
      timeoutMs: 50,
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'REQUEST_TIMEOUT');
    assert.match(res.message, /timed out/);
  });
});

describe('Rate Limiter Behavior', () => {
  it('allows requests within limit and throttles excess requests', () => {
    const key = `test-ip-${Date.now()}`;
    const maxRequests = 3;
    const windowMs = 5000;

    const r1 = checkRateLimit(key, maxRequests, windowMs);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = checkRateLimit(key, maxRequests, windowMs);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = checkRateLimit(key, maxRequests, windowMs);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    // 4th request must be rejected
    const r4 = checkRateLimit(key, maxRequests, windowMs);
    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.resetInSeconds > 0);
  });
});

describe('Email Templates Rendering', () => {
  it('renders booking status HTML template with brand markers', () => {
    const html = renderStatusEmailHtml({
      bookingId: 'BK-1001',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      serviceType: 'Exhauster Truck Emptying',
      newStatus: 'confirmed',
      appointmentDate: '2026-10-20',
      preferredTime: '10:00 AM',
      phone: '+250 788 111 222',
    });

    assert.match(html, /SANEX/);
    assert.match(html, /BK-1001/);
    assert.match(html, /Exhauster Truck Emptying/);
    assert.match(html, /CONFIRMED/);
    assert.match(html, /Jean Dupont/);
  });

  it('renders plain text fallback for status emails', () => {
    const text = renderStatusEmailText({
      bookingId: 'BK-1002',
      customerName: 'Aline Umutoni',
      customerEmail: 'aline@example.com',
      serviceType: 'Wastewater Treatment',
      newStatus: 'completed',
    });

    assert.match(text, /Aline Umutoni/);
    assert.match(text, /COMPLETED/);
    assert.match(text, /BK-1002/);
  });

  it('renders booking confirmation HTML template', () => {
    const html = renderBookingConfirmationHtml({
      bookingId: 'BK-2001',
      customerName: 'David Mugisha',
      customerEmail: 'david@example.com',
      serviceType: 'Decentralized Sanitation',
      appointmentDate: '2026-10-22',
    });

    assert.match(html, /BK-2001/);
    assert.match(html, /David Mugisha/);
    assert.match(html, /Booking Request Confirmation/);
  });

  it('renders test email HTML with diagnostics', () => {
    const html = renderTestEmailHtml({
      recipientEmail: 'admin@sanex.rw',
      triggeredBy: 'Master Admin',
      timestamp: '2026-10-15T10:00:00Z',
    });

    assert.match(html, /admin@sanex\.rw/);
    assert.match(html, /Master Admin/);
    assert.match(html, /Zoho CPaaS Integration Test/);
  });
});
