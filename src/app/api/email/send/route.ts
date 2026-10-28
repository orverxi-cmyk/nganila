import { NextResponse } from 'next/server';
import {
  sendZohoEmailBatch,
  sendZohoEmail,
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
import { initializeFirebase } from '@/firebase/init';
import { doc, setDoc } from 'firebase/firestore';
import { extractFirstImage, extractExcerptFromHtml, Publication } from '@/lib/publications';
import { slugify } from '@/lib/slug';
import { recordServerPublication } from '@/lib/server-publications-store';

interface SendRequestBody {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  message?: string;
  html?: string;
  text?: string;
  templateKey?: string;
  templateAlias?: string;
  mergeInfo?: Record<string, any>;
  useBrandedTemplate?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  clientReference?: string;
  recipientName?: string;
  recipientRole?: string;
  organization?: string;
  sectorName?: string;
  unsubscribeUrl?: string;
}

async function recordSentPublication(
  subject?: string,
  finalHtml?: string,
  recipientCount?: number,
  sectorName?: string
): Promise<{ publicationUrl?: string; publicationSlug?: string }> {
  if (!finalHtml || !finalHtml.trim()) return {};
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return {};

    const effectiveSlug = slugify(subject || 'sanitation-newsletter');
    const detectedCover =
      extractFirstImage(finalHtml) ||
      'https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media';

    const pubId = `pub_${Date.now()}`;
    const pubRecord: Partial<Publication> = {
      id: pubId,
      slug: effectiveSlug,
      title: subject || 'Nganila Co LTD Official Newsletter',
      subject: subject || 'Nganila Official Newsletter',
      excerpt: extractExcerptFromHtml(finalHtml),
      content: finalHtml,
      category: sectorName || 'Company Announcements',
      author: 'Nganila Communications',
      publishedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recipientCount: recipientCount || 1,
      status: 'published',
      isCustom: true,
      coverImage: detectedCover,
      thumbnailImg: detectedCover,
      viewsCount: 0,
    };

    // Save to authoritative server store
    recordServerPublication(pubRecord);

    if (firestore) {
      try {
        await setDoc(doc(firestore, 'publications', pubId), pubRecord, { merge: true });
        // Also sync canonical pub_custom_sanex_newsletter so live and localhost share it
        await setDoc(
          doc(firestore, 'publications', 'pub_custom_sanex_newsletter'),
          {
            ...pubRecord,
            id: 'pub_custom_sanex_newsletter',
            slug: 'sustainable-liquid-waste-management-clean-water-rwanda',
          },
          { merge: true }
        );
      } catch {
        // Handled gracefully
      }
    }

    return {
      publicationUrl: `/publications/${effectiveSlug}`,
      publicationSlug: effectiveSlug,
    };
  } catch (err) {
    console.warn('[api/email/send] Skipping auto-publication recording:', err);
    return {};
  }

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
    templateKey,
    templateAlias,
    mergeInfo,
    useBrandedTemplate = true,
    ctaText,
    ctaUrl,
    clientReference,
  } = body;

  const isTemplateDispatch = Boolean(templateKey || templateAlias);

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

  // Validate subject (required unless template key is supplied)
  if (!isTemplateDispatch && (!subject || typeof subject !== 'string' || !subject.trim())) {
    return NextResponse.json(
      { success: false, error: 'Subject line is required.' },
      { status: 400 }
    );
  }

  // Resolve HTML and Text contents
  let finalHtml = rawHtml;
  let finalText = rawText;

  if (!finalHtml && message && message.trim()) {
    if (useBrandedTemplate) {
      finalHtml = renderCustomBroadcastHtml({
        title: (subject || '').trim(),
        message: message.trim(),
        ctaText: ctaText?.trim() || undefined,
        ctaUrl: ctaUrl?.trim() || undefined,
        recipientName: body.recipientName?.trim() || undefined,
        recipientEmail: cleanedRecipients[0],
        recipientRole: body.recipientRole?.trim() || undefined,
        organization: body.organization?.trim() || undefined,
        sectorName: body.sectorName?.trim() || undefined,
        unsubscribeUrl: body.unsubscribeUrl?.trim() || undefined,
      });
      finalText = renderCustomBroadcastText({
        title: (subject || '').trim(),
        message: message.trim(),
        ctaText: ctaText?.trim() || undefined,
        ctaUrl: ctaUrl?.trim() || undefined,
        recipientName: body.recipientName?.trim() || undefined,
        recipientEmail: cleanedRecipients[0],
        recipientRole: body.recipientRole?.trim() || undefined,
        organization: body.organization?.trim() || undefined,
        sectorName: body.sectorName?.trim() || undefined,
        unsubscribeUrl: body.unsubscribeUrl?.trim() || undefined,
      });
    } else {
      finalHtml = `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">${message
        .trim()
        .replace(/\n/g, '<br/>')}</div>`;
      finalText = message.trim();
    }
  }

  if (!isTemplateDispatch && !finalHtml && !finalText) {
    return NextResponse.json(
      { success: false, error: 'Email content ("message", "html", "text", or "templateKey") is required.' },
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

  // 5. Convert inline base64 images to CID attachments
  const inlineImages: { name: string; mime_type: string; content: string; cid: string }[] = [];
  if (finalHtml && finalHtml.includes('data:image/')) {
    let imgIdx = 0;
    finalHtml = finalHtml.replace(
      /src=["']data:(image\/[a-zA-Z0-9+.-]+);base64,([^"']+)["']/g,
      (_match, mimeType, base64Data) => {
        imgIdx++;
        const ext = mimeType.split('/')[1] || 'jpeg';
        const cid = `img_${imgIdx}`;
        inlineImages.push({
          name: `image_${imgIdx}.${ext}`,
          mime_type: mimeType,
          content: base64Data.trim(),
          cid,
        });
        return `src="cid:${cid}"`;
      }
    );
  }

  // Helper to replace personalization variables ({{email}}, {{name}})
  const substitutePersonalization = (
    content: string,
    recipientEmail: string,
    recipientName?: string
  ): string => {
    const rawName = (recipientName || '').trim();
    const effectiveName = rawName && rawName !== '{{name}}' && rawName !== '{{email}}'
      ? rawName
      : recipientEmail;

    return content
      .replace(/\{\{\s*email\s*\}\}/gi, recipientEmail)
      .replace(/\{\{\s*recipient_?email\s*\}\}/gi, recipientEmail)
      .replace(/\{\{\s*name\s*\}\}/gi, effectiveName)
      .replace(/\{\{\s*recipient_?name\s*\}\}/gi, effectiveName);
  };

  const hasPersonalizationTokens = (content?: string): boolean => {
    if (!content) return false;
    return /\{\{\s*(email|recipient_?email|name|recipient_?name)\s*\}\}/i.test(content);
  };

  const needsPersonalization =
    hasPersonalizationTokens(finalHtml) || hasPersonalizationTokens(finalText);

  // If there are multiple recipients and personalization tags are present,
  // dispatch personalized emails to each recipient individually so each receives
  // their specific email in the security disclaimer and privacy footer.
  if (cleanedRecipients.length > 1 && needsPersonalization) {
    const requestIds: string[] = [];
    const errors: string[] = [];
    let successCount = 0;
    const CONCURRENCY = 5;

    for (let i = 0; i < cleanedRecipients.length; i += CONCURRENCY) {
      const chunk = cleanedRecipients.slice(i, i + CONCURRENCY);
      const chunkPromises = chunk.map(async (recipientEmail, subIdx) => {
        const itemIdx = i + subIdx;
        const personalizedHtml = finalHtml
          ? substitutePersonalization(finalHtml, recipientEmail, body.recipientName)
          : undefined;
        const personalizedText = finalText
          ? substitutePersonalization(finalText, recipientEmail, body.recipientName)
          : undefined;

        return sendZohoEmail({
          to: recipientEmail,
          // Attach CC and BCC only to the first dispatched email to avoid multiplying copies
          cc: itemIdx === 0 && ccParsed.valid.length > 0 ? ccParsed.valid : undefined,
          bcc: itemIdx === 0 && bccParsed.valid.length > 0 ? bccParsed.valid : undefined,
          subject: subject?.trim(),
          html: personalizedHtml,
          text: personalizedText,
          templateKey: templateKey?.trim(),
          templateAlias: templateAlias?.trim(),
          mergeInfo,
          inlineImages: inlineImages.length > 0 ? inlineImages : undefined,
          clientReference: `${clientReference || `broadcast-${Date.now()}`}-${itemIdx + 1}`,
          fromEmail: config.fromEmail,
          fromName: config.fromName,
        });
      });

      const chunkResults = await Promise.all(chunkPromises);
      for (const res of chunkResults) {
        if (res.success) {
          successCount++;
          if (res.requestId) requestIds.push(res.requestId);
        } else {
          errors.push(res.message || res.error || 'Failed');
        }
      }
    }

    if (successCount > 0) {
      const pubMeta = await recordSentPublication(subject, finalHtml, successCount, body.sectorName);
      return NextResponse.json({
        success: true,
        status: 'accepted',
        message: `Personalized email dispatched to ${successCount} of ${cleanedRecipients.length} recipients.`,
        requestId: requestIds.join(', '),
        requestIds,
        recipientCount: successCount,
        batchCount: Math.ceil(cleanedRecipients.length / CONCURRENCY),
        clientReference,
        publicationUrl: pubMeta.publicationUrl,
        publicationSlug: pubMeta.publicationSlug,
        warnings: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        error: 'Failed to dispatch personalized emails through Zoho CPaaS.',
        message: errors.join('; '),
      },
      { status: 502 }
    );
  }

  // Single recipient: substitute personalization tokens before sending
  if (cleanedRecipients.length === 1 && needsPersonalization) {
    const singleEmail = cleanedRecipients[0];
    if (finalHtml) {
      finalHtml = substitutePersonalization(finalHtml, singleEmail, body.recipientName);
    }
    if (finalText) {
      finalText = substitutePersonalization(finalText, singleEmail, body.recipientName);
    }
  }

  const result = await sendZohoEmailBatch({
    to: cleanedRecipients,
    cc: ccParsed.valid.length > 0 ? ccParsed.valid : undefined,
    bcc: bccParsed.valid.length > 0 ? bccParsed.valid : undefined,
    subject: subject?.trim(),
    html: finalHtml,
    text: finalText,
    templateKey: templateKey?.trim(),
    templateAlias: templateAlias?.trim(),
    mergeInfo,
    inlineImages: inlineImages.length > 0 ? inlineImages : undefined,
    clientReference: clientReference || `broadcast-${Date.now()}`,
    fromEmail: config.fromEmail, // Locked to verified sender identity info@sanex.rw
    fromName: config.fromName,
  });

  if (result.success) {
    const pubMeta = await recordSentPublication(subject, finalHtml, cleanedRecipients.length, body.sectorName);
    return NextResponse.json({
      success: true,
      status: 'accepted',
      message: result.message || 'Email accepted by Zoho CPaaS for delivery queue.',
      requestId: result.requestId,
      requestIds: result.requestIds || (result.requestId ? [result.requestId] : []),
      recipientCount: cleanedRecipients.length,
      batchCount: result.batchCount || 1,
      clientReference: result.clientReference,
      publicationUrl: pubMeta.publicationUrl,
      publicationSlug: pubMeta.publicationSlug,
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
