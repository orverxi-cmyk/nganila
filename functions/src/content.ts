
import { onCall, HttpsError, CallableRequest, onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

const db = admin.firestore();

/**
 * CORS helper for v2 onRequest functions.
 */
function setCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin;
  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

const MASTER_ADMIN_EMAILS = [
  'tharushyamagara@gmail.com',
  'sanexcompany@gmail.com',
  'orverxi@gmail.com',
];

/**
 * Helper to verify admin privileges.
 * Master root administrators are automatically authorized and self-bootstrapped.
 */
async function assertAdmin(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }
  const userId = request.auth.uid;
  const email = (request.auth.token.email || '').toLowerCase().trim();
  const isMaster = Boolean(email && MASTER_ADMIN_EMAILS.includes(email));

  if (isMaster) {
    try {
      await db.collection('users').doc(userId).set({
        email,
        role: 'admin',
        updatedAt: Date.now()
      }, { merge: true });
      if (!request.auth.token.admin) {
        await admin.auth().setCustomUserClaims(userId, { admin: true });
      }
    } catch (e) {
      console.warn('Auto-bootstrap admin error:', e);
    }
    return userId;
  }

  const userDoc = await db.collection('users').doc(userId).get();
  const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
  const hasAdminClaim = request.auth.token.admin === true;
  
  if (!isAdmin && !hasAdminClaim) {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }
  return userId;
}

export const adminSeedInitialData = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);

  const batch = db.batch();

  batch.set(db.collection('settings').doc('general'), {
    siteName: "Nganira Company LTD",
    logoUrl: "/logo.png",
    logoWidth: 160,
    logoHeight: 40,
    logoSpacing: 8,
    phone: "+250 788 840 000",
    phones: ["+250 788 840 000", "+250 788 668 855"],
    email: "info@nganira.rw",
    emails: ["info@nganira.rw"],
    socials: {
      twitter: "https://asserwa.rw",
      linkedin: "https://asserwa.rw"
    },
    navLinks: [
      { name: "Home", href: "/" },
      { name: "About", href: "/about" },
      { name: "Services", href: "/services" },
      { name: "Articles", href: "/articles" },
      { name: "Gallery", href: "/gallery" },
      { name: "Contact", href: "/contact" },
    ]
  });

  const articleRef = db.collection('articles').doc('kigali-waste-management-2024');
  batch.set(articleRef, {
    title: "Our Services",
    excerpt: "At Nganira Company LTD, we pride ourselves on offering a comprehensive suite of liquid waste management services tailored to meet the diverse needs of our clients.",
    content: "Detailed story about our services and wastewater management across Rwanda...",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779810108618_ifoto15.jpg?alt=media",
    imageWidth: 1200,
    imageHeight: 600,
    category: "Impact",
    author: "Nganira Editorial",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  batch.set(db.collection('settings').doc('slider'), {
    items: [
      { 
        title: "Liquid Waste Collection", 
        description: "<p>Modern vacuum trucks serving schools, hospitals, and hotels across Rwanda.</p>", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
        width: 1200,
        height: 600,
        link: "/services",
        buttonText: "Our Solutions"
      }
    ]
  });

  batch.set(db.collection('settings').doc('hero'), {
    badge: "Leading Sanitation Partner in Rwanda",
    title: "Transforming",
    titleAccent: "Waste Into Opportunity",
    description: "Leading Liquid Waste Management Solutions in Rwanda.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779799776154_B25A3083.jpg?alt=media",
    imageWidth: 1200,
    imageHeight: 800,
    ctaText: "Book a Service",
    ctaLink: "/book"
  });

  await batch.commit();
  return { success: true };
});

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const adminAddArticle = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { title, content, excerpt, imageUrl, imageAlt, imageWidth, imageHeight, category, author, slug } = request.data;
  if (!title || !content) throw new HttpsError('invalid-argument', 'Title and content are required.');
  
  const finalSlug = slug ? slugify(slug) : slugify(title);

  const newItem = {
    title,
    slug: finalSlug,
    content,
    excerpt: excerpt || '',
    imageUrl: imageUrl || '',
    imageAlt: imageAlt || '',
    imageWidth: Number(imageWidth) || 1200,
    imageHeight: Number(imageHeight) || 600,
    category: category || 'Impact',
    author: author || 'Admin',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const ref = await db.collection('articles').add(newItem);
  return { id: ref.id, ...newItem };
});

export const adminDeleteArticle = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { id } = request.data;
  if (!id) throw new HttpsError('invalid-argument', 'Missing id.');
  await db.collection('articles').doc(id).delete();
  return { success: true };
});

export const adminUpdateArticle = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { id, ...data } = request.data;
  if (!id) throw new HttpsError('invalid-argument', 'Missing id.');
  
  const rawSlug = data.slug || data.title;
  const updateData = {
    ...data,
    ...(rawSlug ? { slug: slugify(rawSlug) } : {}),
    imageWidth: Number(data.imageWidth) || 1200,
    imageHeight: Number(data.imageHeight) || 600,
    updatedAt: Date.now(),
  };
  await db.collection('articles').doc(id).update(updateData);
  return { id, ...updateData };
});

/**
 * Gallery Management via Callable Functions
 */
export const adminAddGalleryItem = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { imageUrl, description, width, height } = request.data;
  if (!imageUrl || !description) throw new HttpsError('invalid-argument', 'Image URL and description are required.');
  
  const newItem = {
    imageUrl,
    description: description.trim(),
    width: Number(width) || 800,
    height: Number(height) || 600,
    createdAt: Date.now(),
  };
  const ref = await db.collection('gallery').add(newItem);
  return { id: ref.id, ...newItem };
});

export const adminUpdateGalleryItem = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { id, imageUrl, description, width, height } = request.data;
  if (!id) throw new HttpsError('invalid-argument', 'Missing id.');
  
  const updateData = {
    imageUrl,
    description: description?.trim(),
    width: Number(width) || 800,
    height: Number(height) || 600,
    updatedAt: Date.now()
  };
  await db.collection('gallery').doc(id).update(updateData);
  return { id, ...updateData };
});

export const adminDeleteGalleryItem = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { id } = request.data;
  if (!id) throw new HttpsError('invalid-argument', 'Missing id.');
  await db.collection('gallery').doc(id).delete();
  return { success: true };
});

export const adminUpdateSiteSection = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { sectionId, content } = request.data;
  if (!sectionId || !content) throw new HttpsError('invalid-argument', 'Missing sectionId or content.');
  
  await db.collection('settings').doc(sectionId).set(content, { merge: true });
  return { success: true };
});

export const createBooking = onRequest({ cors: true, secrets: ['ZOHO_CPAAS_SEND_MAIL_TOKEN'] }, async (req, res) => {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { customerName, email, phone, serviceType, locationUrl, description, appointmentDate, preferredTime, referralSource } = req.body;
    if (!customerName || !email || !phone || !serviceType || !locationUrl) {
      res.status(400).json({ error: 'Missing required booking fields' });
      return;
    }
    
    const booking = {
      customerName,
      email,
      phone,
      serviceType,
      locationUrl,
      description: description || '',
      appointmentDate: appointmentDate || null,
      preferredTime: preferredTime || null,
      referralSource: referralSource || null,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    const ref = await db.collection('bookings').add(booking);

    // Send confirmation receipt email from info@sanex.rw via Zoho CPaaS
    sendStatusNotificationEmail(booking, 'pending', ref.id).catch((emailErr) => {
      console.warn('[createBooking] Could not send confirmation receipt:', emailErr.message);
    });

    res.status(200).json({ id: ref.id });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function sendStatusNotificationEmail(booking: any, newStatus: string, bookingId: string) {
  if (!booking?.email || !booking.email.includes('@')) return;

  const BRAND_COLOR = "#636679";
  const BRAND_ACCENT = "#d9eaa4";
  const BRAND_NAME = "Nganira Company LTD";
  const COMPANY_PHONE = "+250 788 840 000";
  const SENDER_EMAIL = process.env.ZOHO_CPAAS_FROM_EMAIL || "info@nganira.rw";
  const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "info@nganira.rw";
  const DEFAULT_FROM = process.env.EMAIL_FROM || `"${BRAND_NAME}" <${SENDER_EMAIL}>`;

  const isPending = (newStatus || '').toLowerCase() === 'pending';
  const subject = isPending
    ? `Service Request Received: #${bookingId} - ${BRAND_NAME}`
    : `Service Request Update: ${booking.serviceType || 'Liquid Waste Management'} is now ${newStatus.toUpperCase()} - ${BRAND_NAME}`;

  const text = isPending
    ? `Hello ${booking.customerName || 'Customer'},\n\nWe have received your service request for ${booking.serviceType || 'Liquid Waste Management'} (Reference ID: #${bookingId}).\n\nOur operations desk will review your details and coordinate dispatch shortly.\n\nThank you,\n${BRAND_NAME}\nPhone: ${COMPANY_PHONE}`
    : `Hello ${booking.customerName || 'Customer'},\n\nYour service request (${booking.serviceType || 'Liquid Waste Management'}) status has been updated to: ${newStatus.toUpperCase()}.\n\nFor questions, contact Nganira at ${COMPANY_PHONE} or ${COMPANY_EMAIL}.\n\nThank you,\n${BRAND_NAME}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="background-color: ${BRAND_COLOR}; padding: 20px; border-radius: 8px; border-bottom: 4px solid ${BRAND_ACCENT};">
        <h2 style="color: #ffffff; margin: 0; text-transform: uppercase;">NGANIRA <span style="color: ${BRAND_ACCENT};">COMPANY LTD</span></h2>
        <p style="color: #e2e8f0; margin: 4px 0 0 0; font-size: 12px;">Sustainable Liquid Waste Management · Kigali, Rwanda</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #0f172a;">Hello <strong>${booking.customerName || 'Valued Customer'}</strong>,</p>
        <p style="color: #334155;">${isPending ? 'We have received your service request and our dispatch team is reviewing your schedule.' : `The status of your service request has been updated to: <span style="background-color: ${BRAND_ACCENT}; color: #26272e; font-weight: bold; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; font-size: 12px;">${newStatus}</span>`}</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Reference ID:</strong> #${bookingId}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Service:</strong> ${booking.serviceType || 'Liquid Waste Management'}</p>
          ${booking.appointmentDate ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Date:</strong> ${booking.appointmentDate}</p>` : ''}
          <p style="margin: 0; font-size: 14px;"><strong>Current Status:</strong> ${newStatus.toUpperCase()}</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Questions? Call us at ${COMPANY_PHONE} or email ${COMPANY_EMAIL}.</p>
      </div>
    </div>
  `;

  // 1. Try Zoho CPaaS API if configured (From: info@sanex.rw)
  const zohoToken = process.env.ZOHO_CPAAS_SEND_MAIL_TOKEN || process.env.ZOHO_CPAAS_API_KEY;
  if (zohoToken) {
    try {
      const zohoUrl = process.env.ZOHO_CPAAS_API_URL || 'https://cpaas.zoho.com/v1.1/email';
      const authHeader = zohoToken.trim().toLowerCase().startsWith('zoho-enczapikey ')
        ? zohoToken.trim()
        : `Zoho-enczapikey ${zohoToken.trim()}`;
      const senderEmail = process.env.ZOHO_CPAAS_FROM_EMAIL || SENDER_EMAIL;
      const senderName = process.env.ZOHO_CPAAS_FROM_NAME || BRAND_NAME;

      const zRes = await fetch(zohoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          from: { address: senderEmail, name: senderName },
          to: [{ email_address: { address: booking.email, name: booking.customerName || 'Valued Customer' } }],
          subject,
          htmlbody: html,
          textbody: text,
          client_reference: `status-${bookingId}-${newStatus}`,
        }),
      });

      if (zRes.ok) {
        console.log(`[sendStatusNotificationEmail] Email accepted by Zoho CPaaS for ${booking.email} from ${senderEmail}`);
        return;
      }
      const errText = await zRes.text();
      console.warn(`[sendStatusNotificationEmail] Zoho CPaaS returned error ${zRes.status}: ${errText}`);
    } catch (zohoErr: any) {
      console.warn(`[sendStatusNotificationEmail] Zoho CPaaS dispatch exception: ${zohoErr.message}`);
    }
  }

  // 2. Fallback to SMTP
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    try {
      const transporter = !host && user.includes('@gmail.com')
        ? nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
        : nodemailer.createTransport({ host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } });

      await transporter.sendMail({
        from: DEFAULT_FROM,
        to: booking.email,
        subject,
        html,
        text,
      });
      console.log(`[sendStatusNotificationEmail] Email sent to ${booking.email}`);
      return;
    } catch (err: any) {
      console.error(`[sendStatusNotificationEmail] SMTP error: ${err.message}`);
    }
  }

  try {
    await db.collection('mail').add({
      to: [booking.email],
      message: { subject, html, text },
    });
  } catch (mailDbErr) {
    // Ignore if mail collection not configured
  }

  console.log(`[sendStatusNotificationEmail] Notification logged for ${booking.email} (${newStatus})`);
}

export const adminUpdateBookingStatus = onCall({ cors: true, secrets: ['ZOHO_CPAAS_SEND_MAIL_TOKEN'] }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { bookingId, status } = request.data;
  if (!bookingId || !status) throw new HttpsError('invalid-argument', 'Missing bookingId or status.');
  
  const bookingRef = db.collection('bookings').doc(bookingId);
  const snap = await bookingRef.get();
  await bookingRef.update({ status, updatedAt: Date.now() });

  if (snap.exists) {
    const booking = snap.data();
    if (booking?.email) {
      try {
        await sendStatusNotificationEmail(booking, status, bookingId);
      } catch (err) {
        console.warn('Error sending status notification email:', err);
      }
    }
  }

  return { success: true };
});

export const adminGetBookings = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const snap = await db.collection('bookings').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

export const adminDeleteBooking = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { bookingId } = request.data;
  if (!bookingId) throw new HttpsError('invalid-argument', 'Missing bookingId.');
  
  await db.collection('bookings').doc(bookingId).delete();
  return { success: true };
});

