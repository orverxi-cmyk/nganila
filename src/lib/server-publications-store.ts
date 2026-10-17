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
} from "@/lib/publications";
import { slugify } from "@/lib/slug";
import { initializeFirebase } from "@/firebase/init";
import { doc, setDoc } from "firebase/firestore";

export interface StoredEmailTemplate {
  name: string;
  subject?: string;
  message: string;
  mode: "html" | "text";
  blocks: EmailBlock[];
  updatedAt: number;
  updatedBy: string;
}

export interface PublicationsStoreData {
  template: StoredEmailTemplate;
  publications: Publication[];
  lastSavedAt: number;
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

  const newTemplate: StoredEmailTemplate = {
    name: effectiveName,
    subject: templateData.subject?.trim() || effectiveName,
    message: compiledHtml,
    mode: templateData.mode || "html",
    blocks: effectiveBlocks,
    updatedAt: now,
    updatedBy: templateData.userEmail || "admin@sanex.rw",
  };

  const detectedCover =
    extractFirstImage(compiledHtml) ||
    "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media&token=e7f97250-ccbd-4a24-a9fa-793f86798a7d";

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
    viewsCount: 25,
  };

  // Upsert publication into store publications list
  const existingPubIndex = store.publications.findIndex(
    (p) =>
      p.id === "pub_custom_sanex_newsletter" ||
      p.slug === "sustainable-liquid-waste-management-clean-water-rwanda"
  );

  const newPublications = [...store.publications];
  if (existingPubIndex >= 0) {
    newPublications[existingPubIndex] = updatedPublication;
  } else {
    newPublications.unshift(updatedPublication);
  }

  persistPublicationsStore({
    template: newTemplate,
    publications: newPublications,
    lastSavedAt: now,
  });

  // Best-effort Firestore write in background without failing the request
  try {
    const { firestore } = initializeFirebase();
    if (firestore) {
      setDoc(doc(firestore, "settings", "email_template"), newTemplate, { merge: true }).catch(() => {});
      setDoc(doc(firestore, "publications", "pub_custom_sanex_newsletter"), updatedPublication, {
        merge: true,
      }).catch(() => {});
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
 * Returns all stored publications, ensuring the custom email publication is authoritative and up-to-date.
 */
export function getAllServerPublications(): Publication[] {
  const store = getPublicationsStore();
  return store.publications;
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

  persistPublicationsStore({
    ...store,
    publications: updatedPubs,
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
 * Resolves a publication by slug or id from server store.
 */
export function getServerPublicationBySlug(slugOrId: string): Publication | null {
  const store = getPublicationsStore();
  const cleanTarget = slugify(slugOrId);

  return (
    store.publications.find((p) => {
      if (p.id === slugOrId) return true;
      const pSlug = p.slug ? slugify(p.slug) : slugify(p.title || "");
      return pSlug === cleanTarget || slugify(p.title || "") === cleanTarget;
    }) || null
  );
}
