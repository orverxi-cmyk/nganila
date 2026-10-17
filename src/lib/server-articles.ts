import { initializeFirebase } from "@/firebase/init";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { slugify } from "@/lib/slug";

export interface ArticleMetadataInfo {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  author?: string;
  category?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Server-side resolver for article Open Graph and Twitter card preview metadata.
 * Executes on the server when social crawlers (Twitter, LinkedIn, Facebook, WhatsApp)
 * request the page, guaranteeing rich photo cards are previewed.
 */
export async function getArticleForMetadata(
  slugOrId: string
): Promise<ArticleMetadataInfo | null> {
  const cleanParam = decodeURIComponent(slugOrId || "").trim();
  if (!cleanParam) return null;
  const targetSlug = slugify(cleanParam);

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Dedicated slug query
    const slugQuery = query(
      collection(firestore, "articles"),
      where("slug", "==", cleanParam),
      limit(1)
    );
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      const docSnap = slugSnap.docs[0];
      return { id: docSnap.id, ...(docSnap.data() as any) };
    }

    // 2. Slugified slug query if cleanParam differed
    if (targetSlug && targetSlug !== cleanParam) {
      const normQuery = query(
        collection(firestore, "articles"),
        where("slug", "==", targetSlug),
        limit(1)
      );
      const normSnap = await getDocs(normQuery);
      if (!normSnap.empty) {
        const docSnap = normSnap.docs[0];
        return { id: docSnap.id, ...(docSnap.data() as any) };
      }
    }

    // 3. Direct document ID
    const directDocRef = doc(firestore, "articles", cleanParam);
    const directSnap = await getDoc(directDocRef);
    if (directSnap.exists()) {
      return { id: directSnap.id, ...(directSnap.data() as any) };
    }

    // 4. Fallback search across all articles
    const allSnap = await getDocs(collection(firestore, "articles"));
    const matched = allSnap.docs.find((d) => {
      const item = d.data();
      const itemSlug = item.slug ? slugify(item.slug) : slugify(item.title || "");
      return itemSlug === targetSlug || d.id === cleanParam;
    });

    if (matched) {
      return { id: matched.id, ...(matched.data() as any) };
    }
  } catch (err: any) {
    console.warn("[getArticleForMetadata] Server read warning:", err?.message);
  }

  return null;
}
