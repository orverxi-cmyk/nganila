import { NextResponse } from "next/server";
import { initializeFirebase } from "@/firebase/init";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  incrementServerPublicationViews,
  getViewsDisplaySetting,
  setViewsDisplaySetting,
  getArticleViewsMap,
  incrementServerArticleViews,
} from "@/lib/server-publications-store";
import { slugify } from "@/lib/slug";

export async function GET() {
  try {
    const showViewsOnFrontend = getViewsDisplaySetting();
    const articleViews = getArticleViewsMap();
    return NextResponse.json({
      success: true,
      showViewsOnFrontend,
      articleViews,
    });
  } catch (error: any) {
    console.error("[api/views GET] Error:", error?.message);
    return NextResponse.json({ success: true, showViewsOnFrontend: true, articleViews: {} });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, id, slug } = body as {
      type?: "article" | "publication";
      id?: string;
      slug?: string;
    };

    if (!type || (!id && !slug)) {
      return NextResponse.json(
        { success: false, error: "Target type and id or slug are required." },
        { status: 400 }
      );
    }

    if (type === "publication") {
      const targetKey = id || slug || "";
      const newViews = incrementServerPublicationViews(targetKey);
      return NextResponse.json({
        success: true,
        type: "publication",
        viewsCount: newViews,
      });
    }

    if (type === "article") {
      const targetKey = id || slug || "";
      const localCount = incrementServerArticleViews(targetKey);

      try {
        const { firestore } = initializeFirebase();
        if (firestore) {
          let articleDocRef = id ? doc(firestore, "articles", id) : null;

          if (!articleDocRef && slug) {
            const cleanSlug = slugify(slug);
            const q = query(
              collection(firestore, "articles"),
              where("slug", "==", cleanSlug),
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              articleDocRef = snap.docs[0].ref;
            } else {
              const directRef = doc(firestore, "articles", slug);
              const directSnap = await getDoc(directRef);
              if (directSnap.exists()) {
                articleDocRef = directRef;
              }
            }
          }

          if (articleDocRef) {
            await updateDoc(articleDocRef, {
              viewsCount: increment(1),
              views: increment(1),
            });
          }
        }
      } catch (err: any) {
        console.warn("[api/views POST] Firestore article view sync warning:", err?.message);
      }

      return NextResponse.json({
        success: true,
        type: "article",
        viewsCount: localCount,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown entity type." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[api/views POST] Error:", error?.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record view." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { showViewsOnFrontend } = body as { showViewsOnFrontend?: boolean };

    if (typeof showViewsOnFrontend !== "boolean") {
      return NextResponse.json(
        { success: false, error: "showViewsOnFrontend boolean required." },
        { status: 400 }
      );
    }

    const updatedValue = setViewsDisplaySetting(showViewsOnFrontend);
    return NextResponse.json({
      success: true,
      showViewsOnFrontend: updatedValue,
      message: `Front-end view counts are now ${updatedValue ? "visible" : "hidden"}.`,
    });
  } catch (error: any) {
    console.error("[api/views PUT] Error:", error?.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update views display setting." },
      { status: 500 }
    );
  }
}
