import * as XLSX from "xlsx";

export type ContactSector = "hotel" | "health" | "campus" | "schools" | "general" | "other" | (string & {});

export interface ParsedContact {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  sector: ContactSector;
  notes?: string;
}

export const SECTOR_CONFIG: Record<
  string,
  { label: string; sectorName: string; description: string; campaignId: string }
> = {
  hotel: {
    label: "Hotels & Hospitality",
    sectorName: "Hotels, Lodges & Resorts",
    description: "Hotel directors, lodge managers, resort hospitality teams",
    campaignId: "hotel",
  },
  health: {
    label: "Health Facilities",
    sectorName: "Hospitals & Medical Clinics",
    description: "Hospital administrators, medical clinic directors",
    campaignId: "health",
  },
  campus: {
    label: "Campuses & Universities",
    sectorName: "Universities & Colleges",
    description: "University rectors, campus estates & facilities",
    campaignId: "campus",
  },
  schools: {
    label: "Schools & Academies",
    sectorName: "Primary & Secondary Schools",
    description: "Headmasters, school bursars, education centers",
    campaignId: "schools",
  },
  general: {
    label: "General Institutions",
    sectorName: "Enterprises & Public Bodies",
    description: "Corporate offices, commercial estates, institutions",
    campaignId: "general",
  },
  other: {
    label: "Other Partners",
    sectorName: "Clients & Contacts",
    description: "General business contacts and partners",
    campaignId: "custom",
  },
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Automatically infers sector based on organization or name keywords
 */
export function inferSector(text: string, defaultSector: ContactSector = "general"): ContactSector {
  const lower = text.toLowerCase();
  if (/hotel|lodge|resort|motel|hospitality|inn|serena|marriott|radisson/.test(lower)) return "hotel";
  if (/hospital|clinic|clinique|health|medical|polyclinic|polyclinique|dispensary|hopital|h[oô]pital|sant[eé]|faisal/.test(lower)) return "health";
  if (/campus|university|universit[eé]|college|polytechnic|ur\b|alue\b/.test(lower)) return "campus";
  if (/school|academy|ecole|[eé]cole|lyc[eé]e|primary|secondary|gs\b|bursar/.test(lower)) return "schools";
  return defaultSector;
}

/**
 * Parse an uploaded file buffer (.xlsx, .xls, .csv) into clean Contact records
 */
export function parseSpreadsheetContacts(
  buffer: ArrayBuffer,
  defaultSector: ContactSector = "general"
): { contacts: ParsedContact[]; duplicatesSkipped: number } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { contacts: [], duplicatesSkipped: 0 };

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const seenEmails = new Set<string>();
  const contacts: ParsedContact[] = [];
  let duplicatesSkipped = 0;

  for (const row of rawRows) {
    // Find email column
    let email = "";
    let name = "";
    let organization = "";
    let phone = "";
    let sector = defaultSector;

    // Iterate keys in case of varied headers (e.g. Zoho Contacts exports)
    for (const [key, val] of Object.entries(row)) {
      const k = key.trim().toLowerCase();
      const v = String(val || "").trim();
      if (!v) continue;

      if (!email && (k.includes("email") || k.includes("e-mail") || k.includes("mail"))) {
        const match = v.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) email = match[0].toLowerCase();
      } else if (!name && (k === "full name" || k === "name" || k === "contact name" || k === "display name")) {
        name = v;
      } else if (!organization && (k.includes("company") || k.includes("org") || k.includes("account") || k.includes("institution"))) {
        organization = v;
      } else if (!phone && (k.includes("phone") || k.includes("mobile") || k.includes("tel"))) {
        phone = v;
      } else if (k === "first name") {
        name = name ? `${v} ${name}` : v;
      } else if (k === "last name") {
        name = name ? `${name} ${v}` : v;
      }
    }

    // Fallback: check all fields for any valid email if not found in labelled column
    if (!email) {
      for (const val of Object.values(row)) {
        const v = String(val || "").trim();
        const match = v.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) {
          email = match[0].toLowerCase();
          break;
        }
      }
    }

    if (!email || !EMAIL_REGEX.test(email)) continue;

    if (seenEmails.has(email)) {
      duplicatesSkipped++;
      continue;
    }
    seenEmails.add(email);

    // Auto-detect sector if default is general or unspecified
    if (organization || name) {
      const inferred = inferSector(`${organization} ${name}`, defaultSector);
      if (inferred !== "general") sector = inferred;
    }

    contacts.push({
      email,
      name: name || organization || email.split("@")[0],
      organization: organization || undefined,
      phone: phone || undefined,
      sector,
    });
  }

  return { contacts, duplicatesSkipped };
}

/**
 * Parse raw text containing emails (e.g. pasted from Zoho or address books)
 */
export function parseRawTextContacts(
  rawText: string,
  defaultSector: ContactSector = "general"
): { contacts: ParsedContact[]; duplicatesSkipped: number } {
  if (!rawText.trim()) return { contacts: [], duplicatesSkipped: 0 };

  const seenEmails = new Set<string>();
  const contacts: ParsedContact[] = [];
  let duplicatesSkipped = 0;

  // Split lines or commas
  const lines = rawText.split(/[\r\n,;]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for "Name <email@domain.com>" format
    const angleMatch = trimmed.match(/^([^<]*)<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>$/);
    let name = "";
    let email = "";

    if (angleMatch) {
      name = angleMatch[1].trim().replace(/['"]/g, "");
      email = angleMatch[2].trim().toLowerCase();
    } else {
      const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        email = emailMatch[0].toLowerCase();
        // If there was text before/after the email, treat as name
        const remaining = trimmed.replace(emailMatch[0], "").replace(/[-|:]/g, "").trim();
        if (remaining) name = remaining;
      }
    }

    if (!email || !EMAIL_REGEX.test(email)) continue;

    if (seenEmails.has(email)) {
      duplicatesSkipped++;
      continue;
    }
    seenEmails.add(email);

    contacts.push({
      email,
      name: name || email.split("@")[0],
      sector: inferSector(`${name} ${email}`, defaultSector),
    });
  }

  return { contacts, duplicatesSkipped };
}
