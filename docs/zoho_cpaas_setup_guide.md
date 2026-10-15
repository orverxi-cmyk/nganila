# Zoho CPaaS Transactional Email Integration & Operational Guide

This document describes how to configure, test, and troubleshoot the Zoho CPaaS ([cpaas.zoho.com](https://cpaas.zoho.com/)) email service integrated into the SANEX Company web platform.

---

## 1. Overview of the Architecture

- **Official API Endpoint**: `POST https://cpaas.zoho.com/v1.1/email`
- **Authentication**: `Authorization: Zoho-enczapikey {apiKey}`
- **Service Layer**: [`src/lib/zoho-cpaas.ts`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/src/lib/zoho-cpaas.ts)
- **High-level Dispatcher**: [`src/lib/email.ts`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/src/lib/email.ts)
- **API Endpoints**:
  - Direct Email Dispatch (Authorized): [`POST /api/email/send`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/src/app/api/email/send/route.ts)
  - Diagnostic Test Email (Admin): [`POST /api/email/test`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/src/app/api/email/test/route.ts)
  - Status Check: [`GET /api/email/test`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/src/app/api/email/test/route.ts)
  - Booking Status Trigger: [`POST /api/bookings/notify-status`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/src/app/api/bookings/notify-status/route.ts)
- **Admin UI Console**: Embedded in the Admin Dashboard at `/admin` (`ZohoEmailDiagnostics.tsx`)

---

## 2. Obtaining Zoho CPaaS Credentials

To send emails through Zoho CPaaS, you must obtain an **Agent API Key**:

1. Log in to your Zoho CPaaS Console at [https://cpaas.zoho.com/](https://cpaas.zoho.com/).
2. Select your Organization / Application.
3. Navigate to **Email** (or **Transactional Mail**) &rarr; **API Keys** / **Agents**.
4. Generate or copy your **Agent API Key**.
5. Note the key string (e.g. `23.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
   *Note: In the API request header, the key is sent with the prefix `Zoho-enczapikey`. The SANEX integration automatically prefixes this header if you provide only the raw key.*

---

## 3. Sender Domain Verification & DNS Records

For reliable delivery and to prevent your emails from going to spam or being rejected with `TM_3004` (domain not verified), you must configure your domain DNS records:

1. In the Zoho CPaaS Console, go to **Domains** &rarr; **Add Domain** (e.g., `sanex.rw`).
2. Add the following DNS TXT/CNAME records at your DNS host (e.g. Cloudflare, Namecheap, GoDaddy):
   - **SPF Record (TXT)**:
     ```
     v=spf1 include:zoho.com ~all
     ```
     *(If you already have an SPF record, add `include:zoho.com` before `~all`)*
   - **DKIM Record (TXT)**:
     - Name/Host: `zoho._domainkey` (or as specified in Zoho console)
     - Value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...`
   - **DMARC Record (TXT)**:
     - Name/Host: `_dmarc`
     - Value: `v=DMARC1; p=none; rua=mailto:sanexcompany@gmail.com`
   - **CNAME (Tracking/Bounces - Optional)**:
     - Set as requested in Zoho CPaaS domain settings.
3. Return to the Zoho CPaaS console and click **Verify**.

---

## 4. Configuring Environment Variables

### Local Development (`.env.local` or `.env`)

Add the following keys to `.env.local` (never commit real tokens to Git):

```dotenv
# ============================================================
# ZOHO CPAAS REST API (Recommended Primary Engine)
# ============================================================
# Host: cpaas.zoho.com
# Agent Alias: 7c6dc6fcbb934ccb
# Verified Domain: sanex.rw
ZOHO_CPAAS_SEND_MAIL_TOKEN=Zoho-enczapikey your_actual_api_key_here
ZOHO_CPAAS_API_URL=https://cpaas.zoho.com/v1.1/email
ZOHO_CPAAS_FROM_EMAIL=info@sanex.rw
ZOHO_CPAAS_FROM_NAME="SANEX Company Ltd"
ZOHO_CPAAS_AGENT_ALIAS=7c6dc6fcbb934ccb

# Optional Secret Key for server-to-server calls / API test automation
ADMIN_API_SECRET=your_super_secret_admin_token_here

# ============================================================
# ZOHO CPAAS / ZEPTOMAIL SMTP RELAY (Alternative / Fallback)
# ============================================================
SMTP_HOST=smtp.zeptomail.com
SMTP_PORT=587
SMTP_USER=emailapikey
SMTP_PASS=your_actual_api_key_here
EMAIL_FROM="SANEX Company Ltd" <info@sanex.rw>
```

### Production Deployment (Firebase App Hosting)

For production hosting on Firebase App Hosting:

1. Store the secret in Google Cloud Secret Manager:
   ```bash
   echo -n "Zoho-enczapikey YOUR_KEY" | gcloud secrets create ZOHO_CPAAS_SEND_MAIL_TOKEN --data-file=- --project studio-9595184890-5bb3c
   ```
2. Grant Firebase App Hosting backend permission to read the secret:
   ```bash
   npx firebase-tools apphosting:secrets:grantaccess -l us-central1 -b studio ZOHO_CPAAS_SEND_MAIL_TOKEN --project studio-9595184890-5bb3c
   ```
3. The environment variables are already mapped in [`apphosting.yaml`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/apphosting.yaml):
   ```yaml
   - variable: ZOHO_CPAAS_API_URL
     value: https://cpaas.zoho.com/v1.1/email
   - variable: ZOHO_CPAAS_FROM_EMAIL
     value: info@sanex.rw
   - variable: ZOHO_CPAAS_FROM_NAME
     value: "SANEX Company Ltd"
   - variable: ZOHO_CPAAS_AGENT_ALIAS
     value: "7c6dc6fcbb934ccb"
   - variable: ZOHO_CPAAS_SEND_MAIL_TOKEN
     secret: ZOHO_CPAAS_SEND_MAIL_TOKEN
     availability:
       - RUNTIME
   ```

---

## 5. Sending a Test Email

### Option A: From the Admin UI (Interactive)

1. Sign in to the SANEX Admin Dashboard at `/admin` using an authorized administrator account (`orverxi@gmail.com` or `sanexcompany@gmail.com`).
2. Scroll to the **Zoho CPaaS Email Infrastructure** panel.
3. Review the current status indicator:
   - Green badge: **Active Provider**
   - Amber badge: **Unconfigured (Using Fallback)**
4. Enter the recipient email in **Recipient Email Address**.
5. Click **Transmit Test Email**.
6. The panel will display:
   - Dispatch acceptance status
   - Zoho CPaaS Request ID (`request_id`)
   - Latency in milliseconds
   - Response code (`EM_104`)

> **Important**: Zoho CPaaS returns HTTP 200 with code `EM_104` to confirm that the message has been **accepted** into Zoho's outbound queue. This confirms valid authentication, schema, and queueing. Final delivery to the recipient inbox depends on recipient mailserver status and sender domain DNS records.

### Option B: Via cURL / API

```bash
# Using Admin Secret Key:
curl -X POST https://sanex.rw/api/email/test \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_SECRET" \
  -d '{"recipientEmail": "admin@sanex.rw"}'
```

---

## 6. Integrated Application Events

1. **Booking Status Updates**:
   - Triggered when an operator updates booking status (`confirmed`, `in-progress`, `completed`, `cancelled`) in the Admin Dashboard (`/admin` and `/admin/bookings`).
   - Dispatches a branded HTML email to the client using Zoho CPaaS.
   - Includes client reference: `status-{bookingId}-{status}` for tracking and duplicate prevention.
2. **Booking Submission Confirmation**:
   - When a customer submits an inquiry on `/book`, a confirmation receipt with Reference ID is automatically queued.
3. **Firebase Authentication**:
   - Firebase Authentication password-resets and email verifications remain managed via Firebase Auth SDK directly to guarantee compatibility and security.

---

## 7. Running the Automated Test Suite

A complete unit and integration test suite with mocked Zoho CPaaS responses is provided in [`tests/zoho-cpaas.test.ts`](file:///c:/Users/tharushyamagara/Downloads/SANEX%20Website/tests/zoho-cpaas.test.ts).

Run tests with:
```bash
npm test
```

### Test Coverage includes:
- RFC 5322 Email syntax validation
- Email masking for safe logging
- Zoho Authorization header formatting (`Zoho-enczapikey`)
- Missing credential handling
- Mocked 200 OK success handling (`request_id` and acceptance)
- Mocked 400 error handling without credential leakage
- Timeout / AbortSignal handling
- Sliding window rate limiting enforcement
- HTML & text template rendering

---

## 8. Common Troubleshooting & Error Codes

| Code / Error | Cause | Resolution |
| :--- | :--- | :--- |
| `CONFIG_MISSING` | `ZOHO_CPAAS_SEND_MAIL_TOKEN` is unset | Add `ZOHO_CPAAS_SEND_MAIL_TOKEN` to `.env.local` or Secret Manager. |
| `TM_3004` / Invalid Request | Sender address or domain unverified | Ensure `ZOHO_CPAAS_FROM_EMAIL` matches an approved domain in Zoho CPaaS. |
| `401 Unauthorized` | Invalid Agent API Key | Verify and regenerate the key from the Zoho CPaaS console. |
| `REQUEST_TIMEOUT` | API connection latency exceeded 10s | Check outbound network access or Zoho CPaaS service status. |
| Rate Limit 429 | Exceeded 5 test emails/minute | Wait for the `resetInSeconds` window to expire before retesting. |
| Email not in Inbox | Spam filter / Missing SPF | Check SPF, DKIM, and DMARC records for `sanex.rw` in Zoho CPaaS console. |
