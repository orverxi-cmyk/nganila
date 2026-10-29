import fs from "fs";
import path from "path";
import {
  compileBlocksToHtml,
  INITIAL_SANEX_BLOCKS,
  type EmailBlock,
} from "@/lib/email-template-compiler";
import {
  type Publication,
  extractExcerptFromHtml,
  extractFirstImage,
  getCustomDesignedNewsletters,
  isCustomEmailPublication,
  isLikelyBrandLogo,
} from "@/lib/publications";
import { slugify } from "@/lib/slug";
import { initializeFirebase } from "@/firebase/init";
import { doc, setDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";

export interface StoredEmailTemplate {
  name: string;
  subject?: string;
  message: string;
  mode: "html" | "text";
  blocks: EmailBlock[];
  updatedAt: number;
  updatedBy: string;
  coverImage?: string;
}

export interface PublicationsStoreData {
  template: StoredEmailTemplate;
  publications: Publication[];
  deletedPublicationIds?: string[];
  lastSavedAt: number;
  settings?: {
    showViewsOnFrontend?: boolean;
  };
  articleViews?: Record<string, number>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "publications-store.json");

let memoryCache: PublicationsStoreData | null = null;
let lastDiskMtime: number = 0;

function getDefaultStoreData(): PublicationsStoreData {
  const initialHtml = compileBlocksToHtml(INITIAL_SANEX_BLOCKS);
  const now = Date.now();
  const defaultPubs = getCustomDesignedNewsletters();

  return {
    template: {
      name: "SANEX Company Ltd: Sustainable Liquid Waste Management & Clean Water Delivery",
      subject: "WHO ARE WE? Modern Liquid Waste & Wastewater Solutions in Rwanda",
      message: initialHtml,
      mode: "html",
      blocks: INITIAL_SANEX_BLOCKS,
      updatedAt: now,
      updatedBy: "admin@sanex.rw",
    },
    publications: defaultPubs,
    lastSavedAt: now,
  };
}

/**
 * Loads the publications and email template store from disk or memory.

 * Checks file modification time to guarantee fresh synchronization across worker threads.
 */
export function getPublicationsStore(): PublicationsStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const stat = fs.statSync(STORE_FILE);
      if (memoryCache && stat.mtimeMs <= lastDiskMtime) {
        return memoryCache;
      }
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.template && Array.isArray(parsed.publications)) {
        memoryCache = parsed;
        lastDiskMtime = stat.mtimeMs;
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn("[server-publications-store] Read disk store warning:", err?.message);
  }

  if (memoryCache) return memoryCache;

  const defaultData = getDefaultStoreData();
  memoryCache = defaultData;
  return defaultData;
}

/**
 * Persists the store to disk atomically.
 */
export function persistPublicationsStore(data: PublicationsStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    const stat = fs.statSync(STORE_FILE);
    lastDiskMtime = stat.mtimeMs;
    memoryCache = data;
  } catch (err: any) {
    console.warn("[server-publications-store] Write disk store warning:", err?.message);
    memoryCache = data;
  }
}


/**
 * Gets the active custom email template.
 */
export function getActiveServerEmailTemplate(): StoredEmailTemplate {
  const store = getPublicationsStore();
  return store.template;
}

/**
 * Saves the custom email template and automatically updates the corresponding publication.
 * The custom email is the authoritative source for the website publication.
 */
export function saveActiveServerEmailTemplate(templateData: {
  name?: string;
  subject?: string;
  message?: string;
  mode?: "html" | "text";
  blocks?: EmailBlock[];
  userEmail?: string;
  coverImage?: string;
}): {
  template: StoredEmailTemplate;
  publication: Publication;
} {
  const store = getPublicationsStore();
  const now = Date.now();

  const effectiveBlocks =
    Array.isArray(templateData.blocks) && templateData.blocks.length > 0
      ? templateData.blocks
      : store.template.blocks && store.template.blocks.length > 0
      ? store.template.blocks
      : INITIAL_SANEX_BLOCKS;

  const compiledHtml =
    templateData.mode === "html" && templateData.message && templateData.message.includes("<table")
      ? templateData.message
      : compileBlocksToHtml(effectiveBlocks);

  const effectiveName =
    templateData.name?.trim() ||
    templateData.subject?.trim() ||
    store.template.name ||
    "SANEX Company Ltd: Sustainable Liquid Waste Management & Clean Water Delivery";

  const activeNewsletterIdx = store.publications.findIndex(
    (p) =>
      p.id === "pub_custom_sanex_newsletter" ||
      p.slug === "sustainable-liquid-waste-management-clean-water-rwanda"
  );
  const existingPub = activeNewsletterIdx >= 0 ? store.publications[activeNewsletterIdx] : undefined;

  const chosenCover = templateData.coverImage && !isLikelyBrandLogo(templateData.coverImage)
    ? templateData.coverImage.trim()
    : undefined;

  const existingValidCover =
    existingPub?.coverImage && !isLikelyBrandLogo(existingPub.coverImage)
      ? existingPub.coverImage
      : undefined;

  const storeTemplateCover =
    store.template.coverImage && !isLikelyBrandLogo(store.template.coverImage)
      ? store.template.coverImage
      : undefined;

  const detectedCover =
    chosenCover ||
    existingValidCover ||
    storeTemplateCover ||
    extractFirstImage(compiledHtml) ||
    "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media";

  const newTemplate: StoredEmailTemplate = {
    name: effectiveName,
    subject: templateData.subject?.trim() || effectiveName,
    message: compiledHtml,
    mode: templateData.mode || "html",
    blocks: effectiveBlocks,
    updatedAt: now,
    updatedBy: templateData.userEmail || "admin@sanex.rw",
    coverImage: detectedCover,
  };

  const updatedPublication: Publication = {
    id: "pub_custom_sanex_newsletter",
    slug: "sustainable-liquid-waste-management-clean-water-rwanda",
    title: effectiveName,
    subject: newTemplate.subject || effectiveName,
    excerpt:
      extractExcerptFromHtml(compiledHtml) ||
      "Sanex Company LTD is a Rwandan company specializing in liquid waste management, emptying services, and clean water delivery.",
    content: compiledHtml,
    category: "Company Announcements",
    sector: "Company Announcements",
    author: "SANEX Communications",
    publishedAt: now,
    createdAt: store.template.updatedAt || now,
    updatedAt: now,
    recipientCount: 85,
    status: "published",
    isCustom: true,
    coverImage: detectedCover,
    thumbnailImg: detectedCover,
    linkedNewsletters: [],
    viewsCount: existingPub?.viewsCount ?? 25,
  };

  persistPublicationsStore({
    ...store,
    template: newTemplate,
    lastSavedAt: now,
  });

  // Best-effort Firestore write in background without failing the request
  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      setDoc(doc(firestore, "settings", "email_template"), newTemplate, { merge: true }).catch(() => {});
    }
  } catch {
    // Gracefully ignore Firestore connectivity delays
  }

  return {
    template: newTemplate,
    publication: updatedPublication,
  };
}

/**
 * Returns the list of explicitly deleted publication IDs so deleted items
 * are never resurrected from secondary stores or caches.
 */
export function getDeletedPublicationIds(): string[] {
  const store = getPublicationsStore();
  return Array.isArray(store.deletedPublicationIds) ? store.deletedPublicationIds : [];
}

/**
 * Returns all stored publications, excluding any explicitly deleted IDs.
 */
export function getAllServerPublications(): Publication[] {
  const store = getPublicationsStore();
  const deletedSet = new Set(store.deletedPublicationIds || []);
  return store.publications.filter((p) => p && p.id && !deletedSet.has(p.id));
}

/**
 * Permanently deletes one or more publications from the server store (.data/publications-store.json)
 * and records their IDs in deletedPublicationIds.
 */
export function deleteServerPublication(
  idOrSlug: string | string[]
): { deletedIds: string[]; remainingCount: number } {
  const targets = (Array.isArray(idOrSlug) ? idOrSlug : [idOrSlug])
    .map((t) => decodeURIComponent(String(t || "")).trim())
    .filter(Boolean);

  const store = getPublicationsStore();
  if (targets.length === 0) {
    return {
      deletedIds: [],
      remainingCount: store.publications.length,
    };
  }

  const targetSet = new Set(targets);
  const targetSlugs = new Set(targets.map((t) => slugify(t)).filter(Boolean));
  const matchedIds = new Set<string>(targets);

  const nextPublications = store.publications.filter((p) => {
    if (!p) return false;
    const pSlug = p.slug ? slugify(p.slug) : slugify(p.title || "");
    const isMatch =
      (p.id && targetSet.has(p.id)) ||
      (p.slug && targetSet.has(p.slug)) ||
      (pSlug && targetSlugs.has(pSlug));

    if (isMatch) {
      if (p.id) matchedIds.add(p.id);
      return false;
    }
    return true;
  });

  const existingDeleted = Array.isArray(store.deletedPublicationIds)
    ? store.deletedPublicationIds
    : [];
  const nextDeletedIds = Array.from(new Set([...existingDeleted, ...Array.from(matchedIds)]));
  const now = Date.now();

  persistPublicationsStore({
    ...store,
    publications: nextPublications,
    deletedPublicationIds: nextDeletedIds,
    lastSavedAt: now,
  });

  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      matchedIds.forEach((id) => {
        deleteDoc(doc(firestore, "publications", id)).catch(() => {});
      });
    }
  } catch {
    // Graceful fallback when server Firebase SDK lacks admin auth context
  }

  return {
    deletedIds: Array.from(matchedIds),
    remainingCount: nextPublications.length,
  };
}

/**
 * Saves a publication (e.g. when an email is sent to recipients and archived).
 */
export function recordServerPublication(pub: Partial<Publication>): Publication {
  const store = getPublicationsStore();
  const now = Date.now();
  const pubId = pub.id || `pub_${now}_${Math.random().toString(36).substring(2, 6)}`;
  const slug = pub.slug ? slugify(pub.slug) : slugify(pub.title || `publication-${now}`);

  const completePub: Publication = {
    id: pubId,
    slug,
    title: pub.title || "SANEX Official Publication",
    subject: pub.subject || pub.title || "SANEX Official Publication",
    excerpt: pub.excerpt || (pub.content ? extractExcerptFromHtml(pub.content) : "SANEX publication"),
    content: pub.content || "",
    plainText: pub.plainText || "",
    category: pub.category || "Company Announcements",
    sector: pub.sector || pub.category || "Company Announcements",
    author: pub.author || "SANEX Communications",
    publishedAt: pub.publishedAt || now,
    createdAt: pub.createdAt || now,
    updatedAt: now,
    recipientCount: pub.recipientCount ?? 0,
    status: "published",
    isCustom: true,
    coverImage: pub.coverImage || (pub.content ? extractFirstImage(pub.content) : undefined),
    thumbnailImg: pub.thumbnailImg || pub.coverImage,
    linkedNewsletters: (pub.linkedNewsletters as any) || [],
    viewsCount: pub.viewsCount ?? 0,
  };

  const existingIdx = store.publications.findIndex((p) => p.id === pubId || p.slug === slug);
  const updatedPubs = [...store.publications];
  if (existingIdx >= 0) {
    updatedPubs[existingIdx] = completePub;
  } else {
    updatedPubs.unshift(completePub);
  }

  const nextDeletedIds = (store.deletedPublicationIds || []).filter(
    (id) => id !== pubId && id !== completePub.id
  );

  persistPublicationsStore({
    ...store,
    publications: updatedPubs,
    deletedPublicationIds: nextDeletedIds,
    lastSavedAt: now,
  });

  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      setDoc(doc(firestore, "publications", pubId), completePub, { merge: true }).catch(() => {});
    }
  } catch {
    // Graceful
  }

  return completePub;
}

/**
 * Updates a publication directly in the authoritative server store (.data/publications-store.json)
 * and keeps the email template cover image aligned if this is the active custom newsletter.
 */
export function updateServerPublication(
  pubId: string,
  updates: Partial<Publication>
): Publication {
  const store = getPublicationsStore();
  const now = Date.now();

  const isCustomNewsletter =
    pubId === "pub_custom_sanex_newsletter" ||
    updates.slug === "sustainable-liquid-waste-management-clean-water-rwanda" ||
    updates.isCustom === true;

  const cleanCover = updates.coverImage && !isLikelyBrandLogo(updates.coverImage)
    ? updates.coverImage.trim()
    : updates.coverImage;

  if (isCustomNewsletter && cleanCover) {
    store.template.coverImage = cleanCover;
  }

  const existingIdx = store.publications.findIndex(
    (p) => p.id === pubId || (updates.slug && p.slug === updates.slug)
  );

  let resultPub: Publication;
  if (existingIdx >= 0) {
    const prev = store.publications[existingIdx];
    resultPub = {
      ...prev,
      ...updates,
      id: prev.id,
      coverImage: cleanCover || prev.coverImage,
      thumbnailImg: updates.thumbnailImg || cleanCover || prev.thumbnailImg,
      updatedAt: now,
    };
    store.publications[existingIdx] = resultPub;
  } else {
    const slug = updates.slug ? slugify(updates.slug) : slugify(updates.title || `pub-${now}`);
    resultPub = {
      id: pubId,
      slug,
      title: updates.title || "SANEX Official Publication",
      subject: updates.subject || updates.title || "SANEX Official Publication",
      excerpt: updates.excerpt || (updates.content ? extractExcerptFromHtml(updates.content) : "SANEX publication"),
      content: updates.content || "",
      category: updates.category || "Company Announcements",
      author: updates.author || "SANEX Communications",
      publishedAt: updates.publishedAt || now,
      createdAt: updates.createdAt || now,
      updatedAt: now,
      status: updates.status || "published",
      isCustom: true,
      coverImage: cleanCover,
      thumbnailImg: updates.thumbnailImg || cleanCover,
      linkedNewsletters: (updates.linkedNewsletters as any) || [],
      recipientCount: updates.recipientCount || 0,
      viewsCount: updates.viewsCount || 0,
      ...updates,
    };
    store.publications.unshift(resultPub);
  }

  const nextDeletedIds = (store.deletedPublicationIds || []).filter(
    (id) => id !== pubId && id !== resultPub.id
  );

  persistPublicationsStore({
    ...store,
    template: store.template,
    publications: store.publications,
    deletedPublicationIds: nextDeletedIds,
    lastSavedAt: now,
  });

  // Best-effort Firestore write
  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      setDoc(doc(firestore, "publications", resultPub.id), resultPub, { merge: true }).catch(() => {});
      if (isCustomNewsletter) {
        setDoc(doc(firestore, "settings", "email_template"), store.template, { merge: true }).catch(() => {});
      }
    }
  } catch {}

  return resultPub;
}


/**
 * Gets the current setting for whether views counts are displayed on public pages.
 * Defaults to true.
 */
export function getViewsDisplaySetting(): boolean {
  const store = getPublicationsStore();
  return store.settings?.showViewsOnFrontend !== false;
}

/**
 * Sets whether view counts should be visible on front-end pages.
 */
export function setViewsDisplaySetting(enabled: boolean): boolean {
  const store = getPublicationsStore();
  const nextSettings = {
    ...(store.settings || {}),
    showViewsOnFrontend: enabled,
  };

  persistPublicationsStore({
    ...store,
    settings: nextSettings,
    lastSavedAt: Date.now(),
  });

  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      setDoc(doc(firestore, "settings", "general"), { showViewsOnFrontend: enabled }, { merge: true }).catch(() => {});
    }
  } catch {}

  return enabled;
}

/**
 * Increments the view count for a publication and persists it immediately.
 */
export function incrementServerPublicationViews(pubIdOrSlug: string): number {
  const store = getPublicationsStore();
  const cleanTarget = slugify(pubIdOrSlug.trim());

  const pub = store.publications.find((p) => {
    if (p.id === pubIdOrSlug) return true;
    const pSlug = p.slug ? slugify(p.slug) : slugify(p.title || "");
    return pSlug === cleanTarget || slugify(p.title || "") === cleanTarget;
  });

  if (!pub) return 0;
  pub.viewsCount = (pub.viewsCount || 0) + 1;
  pub.updatedAt = Date.now();

  persistPublicationsStore({
    ...store,
    lastSavedAt: Date.now(),
  });

  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      updateDoc(doc(firestore, "publications", pub.id), {
        viewsCount: increment(1),
      }).catch(() => {});
    }
  } catch {}

  return pub.viewsCount;
}

/**
 * Retrieves the persisted map of article views.
 */
export function getArticleViewsMap(): Record<string, number> {
  const store = getPublicationsStore();
  return store.articleViews || {};
}

/**
 * Increments the view count for an article in both the local store and Firestore.
 */
export function incrementServerArticleViews(idOrSlug: string): number {
  if (!idOrSlug || !idOrSlug.trim()) return 0;
  const store = getPublicationsStore();
  const rawKey = idOrSlug.trim();
  const cleanSlug = slugify(rawKey);

  const articleViews = { ...(store.articleViews || {}) };
  const currentCount = articleViews[rawKey] || articleViews[cleanSlug] || 0;
  const newCount = currentCount + 1;

  articleViews[rawKey] = newCount;
  if (cleanSlug && cleanSlug !== rawKey) {
    articleViews[cleanSlug] = newCount;
  }

  persistPublicationsStore({
    ...store,
    articleViews,
    lastSavedAt: Date.now(),
  });

  return newCount;
}

/**
 * Server-side resolver to retrieve a publication for Open Graph / Twitter Card preview metadata.
 * Respects deletedPublicationIds and published status so deleted items never appear publicly.
 */
export async function getServerPublicationBySlug(
  slugOrId: string
): Promise<Publication | null> {
  const cleanTarget = decodeURIComponent(slugOrId || "").trim();
  if (!cleanTarget) return null;
  const targetSlug = slugify(cleanTarget);

  const store = getPublicationsStore();
  const deletedSet = new Set<string>(store.deletedPublicationIds || []);

  // Sync any cloud-persisted deleted IDs from Firestore settings/publications_meta
  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      const { doc: fsDoc, getDoc: fsGetDoc } = await import("firebase/firestore");
      const metaSnap = await fsGetDoc(fsDoc(firestore, "settings", "publications_meta"));
      if (metaSnap.exists()) {
        const cloudDeleted = (metaSnap.data() as any)?.deletedIds;
        if (Array.isArray(cloudDeleted)) {
          cloudDeleted.forEach((id: string) => {
            if (id) deletedSet.add(id);
          });
        }
      }
    }
  } catch {
    // Proceed with local deletedSet
  }

  const isPubliclyVisible = (pub: Publication | undefined | null): pub is Publication => {
    if (!pub || !pub.id) return false;
    if (deletedSet.has(pub.id)) return false;
    if (!isCustomEmailPublication(pub)) return false;
    if (pub.status && pub.status !== "published") return false;
    return true;
  };

  const matched = store.publications.find((p) => {
    if (!isPubliclyVisible(p)) return false;
    if (p.id === cleanTarget) return true;
    const pSlug = p.slug ? slugify(p.slug) : slugify(p.title || "");
    return pSlug === targetSlug || slugify(p.title || "") === targetSlug;
  });

  if (matched) return matched;

  // Check Firestore if not found in local store
  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      const {
        collection: fsCollection,
        query: fsQuery,
        where: fsWhere,
        getDocs: fsGetDocs,
        limit: fsLimit,
        doc: fsDoc,
        getDoc: fsGetDoc,
      } = await import("firebase/firestore");

      const q = fsQuery(
        fsCollection(firestore, "publications"),
        fsWhere("slug", "==", cleanTarget),
        fsLimit(1)
      );
      const snap = await fsGetDocs(q);
      if (!snap.empty) {
        const candidate = { ...(snap.docs[0].data() as any), id: snap.docs[0].id } as Publication;
        if (isPubliclyVisible(candidate)) return candidate;
      }

      const directDoc = await fsGetDoc(fsDoc(firestore, "publications", cleanTarget));
      if (directDoc.exists()) {
        const candidate = { ...(directDoc.data() as any), id: directDoc.id } as Publication;
        if (isPubliclyVisible(candidate)) return candidate;
      }
    }
  } catch {}

  return null;
}


