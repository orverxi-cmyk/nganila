import { NextResponse } from "next/server";
import { initializeFirebase } from "@/firebase/init";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  verifyAdminAuthorization,
  checkRateLimit,
  getClientIp,
} from "@/lib/api-auth";
import {
  Publication,
  getPublicationSlug,
  getPublicationUrl,
  extractExcerptFromHtml,
  extractFirstImage,
  isCustomEmailPublication,
  getCustomDesignedNewsletters,
} from "@/lib/publications";
import { compileBlocksToHtml, INITIAL_SANEX_BLOCKS } from "@/lib/email-template-compiler";
import { slugify } from "@/lib/slug";
import { getAllServerPublications, updateServerPublication } from "@/lib/server-publications-store";

// Authoritative publications API endpoint for SANEX
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status") || "published";
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);

    const { firestore } = initializeFirebase();
    const publicationsRef = firestore ? collection(firestore, "publications") : null;
    // 1. Authoritative server publications store (always preserves custom email designs)
    const serverPubs = getAllServerPublications();

    let snapshotDocs: any[] = [];
    try {
      if (firestore && publicationsRef) {
        const q = query(publicationsRef, orderBy("publishedAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        snapshotDocs = snapshot.docs;
      }
    } catch {
      // Gracefully fall back to serverPubs without logging alarms
    }


    const firestorePubs: Publication[] = snapshotDocs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Publication;
    });

    // Merge: serverPubs take precedence for active custom templates, append additional Firestore publications
    const mergedMap = new Map<string, Publication>();
    serverPubs.forEach((p) => {
      if (p.id) mergedMap.set(p.id, p);
    });
    firestorePubs.forEach((p) => {
      if (p.id && !mergedMap.has(p.id)) {
        mergedMap.set(p.id, p);
      }
    });

    let publications = Array.from(mergedMap.values());

    // Exclusively include custom emails (properly designed newsletters), exclude all generated seed templates
    publications = publications.filter((p) => isCustomEmailPublication(p));


    // In-memory filters for flexibility (supports partial search & category)
    if (status && status !== "all") {
      publications = publications.filter((p) => (p.status || "published") === status);
    }

    if (category && category !== "all") {
      publications = publications.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      publications = publications.filter(
        (p) =>
          p.title?.toLowerCase().includes(search) ||
          p.excerpt?.toLowerCase().includes(search) ||
          p.category?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      publications,
      total: publications.length,
    });
  } catch (error: any) {
    console.warn("[api/publications GET] Warning:", error.message);
    return NextResponse.json({
      success: true,
      publications: [],
      total: 0,
      warning: "Waiting for custom email sync.",
    });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limiting (max 30 requests per minute)
  const rateLimit = checkRateLimit(`pub-write:${ip}`, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  // Verify Admin authorization
  const auth = await verifyAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Administrative privileges required." },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      id: providedId,
      title,
      subject,
      content,
      plainText,
      category = "Company Announcements",
      sector,
      author = "SANEX Communications",
      slug: customSlug,
      excerpt: customExcerpt,
      coverImage: customCoverImage,
      tags = [],
      linkedNewsletters = [],
      recipientCount = 0,
      campaignId,
      status = "published",
    } = body;

    const effectiveTitle = (title || subject || "").trim();
    if (!effectiveTitle) {
      return NextResponse.json(
        { success: false, error: "Publication title or email subject is required." },
        { status: 400 }
      );
    }

    if (!content && !plainText) {
      return NextResponse.json(
        { success: false, error: "Publication content (HTML or text) is required." },
        { status: 400 }
      );
    }

    const { firestore } = initializeFirebase();

    // Generate unique ID if not provided
    const pubId = providedId || `pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Generate clean SEO slug
    let finalSlug = slugify(customSlug || effectiveTitle);
    if (!finalSlug) {
      finalSlug = `publication-${Date.now()}`;
    }

    // Auto-extract excerpt and image if not provided
    const excerpt = customExcerpt?.trim() || extractExcerptFromHtml(content || plainText || "");
    const coverImage = customCoverImage || extractFirstImage(content || "");

    const now = Date.now();
    const docRef = doc(firestore, "publications", pubId);
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const publicationData: Publication = {
      id: pubId,
      slug: finalSlug,
      title: effectiveTitle,
      subject: subject || effectiveTitle,
      excerpt,
      content: content || `<p>${plainText}</p>`,
      plainText: plainText || excerpt,
      category,
      sector: sector || category,
      author,
      publishedAt: existingData?.publishedAt || now,
      createdAt: existingData?.createdAt || now,
      updatedAt: now,
      recipientCount: recipientCount || existingData?.recipientCount || 0,
      status: status || "published",
      coverImage: coverImage || undefined,
      tags: Array.isArray(tags) ? tags : [],
      linkedNewsletters: Array.isArray(linkedNewsletters) ? linkedNewsletters : [],
      viewsCount: existingData?.viewsCount || 0,
      campaignId: campaignId || existingData?.campaignId || undefined,
      metaDescription: excerpt,
    };

    // Authoritatively persist in server store (.data/publications-store.json)
    const savedPub = updateServerPublication(pubId, publicationData);

    try {
      if (firestore) {
        await setDoc(docRef, publicationData, { merge: true });
      }
    } catch (fsErr: any) {
      console.warn("[api/publications POST] Firestore write warning:", fsErr?.message);
    }

    const host = request.headers.get("host") || "sanex.rw";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const publicationUrl = getPublicationUrl(savedPub, origin);

    return NextResponse.json({
      success: true,
      publication: savedPub,
      publicationUrl,
      slug: finalSlug,
    });
  } catch (error: any) {
    console.error("[api/publications POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save publication" },
      { status: 500 }
    );
  }
}
