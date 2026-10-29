import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { initializeFirebase } from "@/firebase/init";
import { firebaseConfig } from "@/firebase/config";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
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
  getPublicationUrl,
  extractExcerptFromHtml,
  extractFirstImage,
  mergeAndFilterPublications,
} from "@/lib/publications";
import { slugify } from "@/lib/slug";
import {
  getAllServerPublications,
  updateServerPublication,
  deleteServerPublication,
  getDeletedPublicationIds,
} from "@/lib/server-publications-store";

export const dynamic = "force-dynamic";

// Authoritative publications API endpoint
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status") || "published";
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);

    const { firestore } = initializeFirebase();
    const publicationsRef = firestore ? collection(firestore, "publications") : null;
    // 1. Authoritative server publications store & deleted IDs
    const serverPubs = getAllServerPublications();
    const deletedIdSet = new Set<string>(getDeletedPublicationIds());

    let snapshotDocs: any[] = [];
    try {
      if (firestore && publicationsRef) {
        const [snapshot, metaSnap] = await Promise.all([
          getDocs(query(publicationsRef, orderBy("publishedAt", "desc"), limit(limitCount))),
          getDoc(doc(firestore, "settings", "publications_meta")).catch(() => null),
        ]);
        snapshotDocs = snapshot.docs;
        if (metaSnap && metaSnap.exists()) {
          const cloudDeleted = (metaSnap.data() as any)?.deletedIds;
          if (Array.isArray(cloudDeleted)) {
            cloudDeleted.forEach((id: string) => {
              if (id) deletedIdSet.add(id);
            });
          }
        }
      }
    } catch {
      // Gracefully fall back to serverPubs without logging alarms
    }

    const firestorePubs: Publication[] = snapshotDocs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
      } as Publication;
    });

    const allDeletedIds = Array.from(deletedIdSet);

    let publications = mergeAndFilterPublications({
      firestorePublications: firestorePubs,
      apiPublications: serverPubs,
      deletedIds: allDeletedIds,
      includeAllStatuses: true,
    });

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

    publications = publications.slice(0, limitCount);

    return NextResponse.json(
      {
        success: true,
        publications,
        deletedIds: allDeletedIds,
        total: publications.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.warn("[api/publications GET] Warning:", error.message);
    return NextResponse.json(
      {
        success: true,
        publications: [],
        deletedIds: getDeletedPublicationIds(),
        total: 0,
        warning: "Waiting for custom email sync.",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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

    try {
      revalidatePath("/publications");
      revalidatePath("/publications/[slug]", "page");
      revalidatePath(`/publications/${finalSlug}`);
    } catch {
      // Ignore revalidate errors outside request lifecycle
    }

    const host = request.headers.get("host") || "sanex.rw";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const publicationUrl = getPublicationUrl(savedPub, origin);

    return NextResponse.json({
      success: true,
      publication: savedPub,
      deletedIds: getDeletedPublicationIds(),
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

export async function DELETE(request: Request) {
  const ip = getClientIp(request);

  // Rate limiting (max 30 delete requests per minute)
  const rateLimit = checkRateLimit(`pub-delete:${ip}`, 30, 60000);
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
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("id")?.trim();
    const querySlug = searchParams.get("slug")?.trim();
    const queryIds = searchParams
      .get("ids")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let bodyTargets: string[] = [];
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        if (body?.id) bodyTargets.push(String(body.id).trim());
        if (body?.slug) bodyTargets.push(String(body.slug).trim());
        if (Array.isArray(body?.ids)) {
          bodyTargets.push(...body.ids.map((x: any) => String(x || "").trim()).filter(Boolean));
        }
      }
    } catch {
      // Optional JSON body
    }

    const targets = Array.from(
      new Set([
        ...(queryId ? [queryId] : []),
        ...(querySlug ? [querySlug] : []),
        ...(queryIds || []),
        ...bodyTargets,
      ].filter(Boolean))
    );

    if (targets.length === 0) {
      return NextResponse.json(
        { success: false, error: "Publication id or slug is required for deletion." },
        { status: 400 }
      );
    }

    // 1. Delete from authoritative server disk store (.data/publications-store.json) & record tombstones
    const result = deleteServerPublication(targets);

    // 2. Delete from Firestore (via authenticated REST API if admin Bearer token was provided, plus SDK fallback)
    const { firestore } = initializeFirebase();
    await Promise.all(
      result.deletedIds.map(async (targetId) => {
        if (auth.idToken && firebaseConfig.projectId) {
          try {
            await fetch(
              `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/publications/${encodeURIComponent(targetId)}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${auth.idToken}`,
                },
              }
            );
          } catch {
            // Client-side deleteDoc also executes in parallel
          }
        }

        if (firestore) {
          try {
            await deleteDoc(doc(firestore, "publications", targetId));
          } catch {
            // Expected if server client SDK lacks user auth session
          }
        }
      })
    );

    // 3. Revalidate Next.js public publication routes immediately
    try {
      revalidatePath("/publications");
      revalidatePath("/publications/[slug]", "page");
    } catch {
      // Ignore revalidate errors outside request lifecycle
    }

    return NextResponse.json({
      success: true,
      deletedIds: result.deletedIds,
      allDeletedIds: getDeletedPublicationIds(),
      remainingCount: result.remainingCount,
    });
  } catch (error: any) {
    console.error("[api/publications DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete publication" },
      { status: 500 }
    );
  }
}
