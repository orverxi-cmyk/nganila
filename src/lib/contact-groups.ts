import { Firestore, doc, writeBatch } from "firebase/firestore";

export interface ContactGroup {
  id: string;
  name: string;
  label?: string; // backwards compatibility alias
  description?: string;
  isDefault?: boolean;
  createdAt?: number;
}

export const DEFAULT_CONTACT_GROUPS: ContactGroup[] = [
  {
    id: "hotel",
    name: "Hotels & Hospitality",
    description: "Hotel directors, lodge managers, resort hospitality teams",
    isDefault: true,
  },
  {
    id: "health",
    name: "Health Facilities",
    description: "Hospital administrators, medical clinic directors",
    isDefault: true,
  },
  {
    id: "campus",
    name: "Campuses & Universities",
    description: "University rectors, campus estates & facilities",
    isDefault: true,
  },
  {
    id: "schools",
    name: "Schools & Academies",
    description: "Headmasters, school bursars, education centers",
    isDefault: true,
  },
  {
    id: "general",
    name: "General Institutions",
    description: "Corporate offices, commercial estates, institutions",
    isDefault: true,
  },
  {
    id: "other",
    name: "Other Partners",
    description: "General business contacts and partners",
    isDefault: true,
  },
];

/**
 * Normalizes text to a clean URL/ID friendly slug
 */
export function slugifyGroupName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `group_${Date.now()}`;
}

/**
 * Generates an idempotent, unique group ID preventing naming collisions
 */
export function generateUniqueGroupId(name: string, existingGroups: ContactGroup[]): string {
  const base = slugifyGroupName(name);
  let id = base;
  let counter = 1;
  const existingIds = new Set(existingGroups.map((g) => g.id.toLowerCase()));
  while (existingIds.has(id.toLowerCase())) {
    id = `${base}_${counter++}`;
  }
  return id;
}

/**
 * Splits an array into chunks of maximum size (capped safely for Firestore batch operations)
 */
export function chunkArray<T>(items: T[], size = 400): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Bulk purges contacts in Firestore in safe batches of 400 (well under Firestore's 500 limit)
 */
export async function purgeContactsBatch(
  db: Firestore,
  contactIds: string[],
  onProgress?: (purgedCount: number, total: number) => void
): Promise<number> {
  if (!contactIds || contactIds.length === 0) return 0;

  const chunks = chunkArray(contactIds, 400);
  let totalPurged = 0;

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, "client_contacts", id));
    }
    await batch.commit();
    totalPurged += chunk.length;
    if (onProgress) {
      onProgress(totalPurged, contactIds.length);
    }
  }

  return totalPurged;
}

/**
 * Reassigns contacts to another group in safe batches of 400
 */
export async function reassignContactsBatch(
  db: Firestore,
  contactIds: string[],
  targetGroupId: string,
  onProgress?: (reassignedCount: number, total: number) => void
): Promise<number> {
  if (!contactIds || contactIds.length === 0) return 0;

  const chunks = chunkArray(contactIds, 400);
  let totalReassigned = 0;
  const now = Date.now();

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.update(doc(db, "client_contacts", id), {
        sector: targetGroupId,
        updatedAt: now,
      });
    }
    await batch.commit();
    totalReassigned += chunk.length;
    if (onProgress) {
      onProgress(totalReassigned, contactIds.length);
    }
  }

  return totalReassigned;
}
