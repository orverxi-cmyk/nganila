import { NextResponse } from "next/server";
import { initializeFirebase } from "@/firebase/init";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  verifyAdminAuthorization,
} from "@/lib/api-auth";
import {
  Publication,
  getPublicationUrl,
  extractExcerptFromHtml,
} from "@/lib/publications";
import { slugify } from "@/lib/slug";
import { updateServerPublication } from "@/lib/server-publications-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID or slug is required" }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Try querying by direct document ID
    const docRef = doc(firestore, "publications", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return NextResponse.json({
        success: true,
        publication: { id: docSnap.id, ...docSnap.data() } as Publication,
      });
    }

    // 2. Try querying by `slug` field
    const slugQuery = query(
      collection(firestore, "publications"),
      where("slug", "==", slugify(id)),
      limit(1)
    );
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      const match = slugSnap.docs[0];
      return NextResponse.json({
        success: true,
        publication: { id: match.id, ...match.data() } as Publication,
      });
    }

    return NextResponse.json(
      { success: false, error: "Publication not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[api/publications/[id] GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve publication" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Administrative privileges required." },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const { id } = await params;
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, "publications", id);

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "Publication deleted successfully",
    });
  } catch (error: any) {
    console.error("[api/publications/[id] DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete publication" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Administrative privileges required." },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, "publications", id);

    const updatePayload: Record<string, any> = {
      ...body,
      updatedAt: Date.now(),
    };

    if (body.title && !body.slug) {
      updatePayload.slug = slugify(body.title);
    } else if (body.slug) {
      updatePayload.slug = slugify(body.slug);
    }

    if (body.content && !body.excerpt) {
      updatePayload.excerpt = extractExcerptFromHtml(body.content);
    }

    // Authoritatively persist to server store (.data/publications-store.json)
    const savedPub = updateServerPublication(id, updatePayload);

    try {
      if (firestore) {
        await updateDoc(docRef, updatePayload);
      }
    } catch (fsErr: any) {
      console.warn("[api/publications/[id] PUT] Firestore update warning:", fsErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Publication updated successfully",
      publication: savedPub,
      slug: updatePayload.slug || savedPub.slug,
    });
  } catch (error: any) {
    console.error("[api/publications/[id] PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update publication" },
      { status: 500 }
    );
  }
}
