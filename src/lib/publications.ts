import { slugify } from "./slug";
import { compileBlocksToHtml, INITIAL_SANEX_BLOCKS } from "./email-template-compiler";

export interface LinkedNewsletterReference {
  id: string;
  title: string;
  slug: string;
  category?: string;
  publishedAt?: number;
}

export interface Publication {
  id: string;
  slug: string;
  title: string;
  subject?: string;
  excerpt: string;
  content: string; // Compiled HTML of the custom email/newsletter
  plainText?: string;
  category: string;
  sector?: string;
  author?: string;
  publishedAt: number; // Unix timestamp in ms
  createdAt: number;
  updatedAt: number;
  recipientCount?: number;
  status: "published" | "draft" | "archived";
  coverImage?: string;
  thumbnailImg?: string;
  tags?: string[];
  linkedNewsletters?: LinkedNewsletterReference[];
  viewsCount?: number;
  campaignId?: string;
  metaDescription?: string;
  isCustom?: boolean;
}

export const PUBLICATION_CATEGORIES = [
  "Hotels & Hospitality",
  "Health Facilities",
  "Campuses & Universities",
  "Schools & Academies",
  "General Institutions",
  "Company Announcements",
  "Wastewater Insights",
  "Regulatory & Compliance",
] as const;

export type PublicationCategory = (typeof PUBLICATION_CATEGORIES)[number] | string;

/**
 * Extracts clean, human-readable text excerpt from HTML content
 */
export function extractExcerptFromHtml(html: string, maxLength: number = 180): string {
  if (!html) return "";
  // Strip CSS style tags and script tags
  const clean = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + "...";
}

/**
 * Detects whether an image URL or img tag represents a company brand logo, emblem, or icon.
 * Brand logos (like the 44x44 circular header logo) should never be used as story cover photos.
 */
export function isLikelyBrandLogo(urlOrTag: string): boolean {
  if (!urlOrTag) return false;
  const lower = urlOrTag.toLowerCase();
  return (
    lower.includes("logo") ||
    lower.includes("favicon") ||
    lower.includes("emblem") ||
    lower.includes("icon") ||
    lower.includes("avatar")
  );
}

/**
 * Extracts the first content photo from HTML, intentionally skipping header logos and icons.
 */
export function extractFirstImage(html: string): string | undefined {
  if (!html) return undefined;
  // Match standard img tags
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgTagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const src = match[1]?.trim();
    if (!src || src.startsWith("data:")) continue;
    if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("/")) continue;

    // Skip brand logos and icons so the real story photo is extracted
    if (isLikelyBrandLogo(src) || isLikelyBrandLogo(fullTag)) {
      continue;
    }

    return src;
  }

  return undefined;
}

/**
 * Extracts all unique image URLs found in HTML content, placing content photos first.
 */
export function extractAllImagesFromHtml(html: string): string[] {
  if (!html) return [];
  const contentUrls: string[] = [];
  const logoUrls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const fullTag = match[0];
    const src = match[1]?.trim();
    if (!src || (src.startsWith("data:") && src.length > 50000)) continue;
    if (contentUrls.includes(src) || logoUrls.includes(src)) continue;

    if (isLikelyBrandLogo(src) || isLikelyBrandLogo(fullTag)) {
      logoUrls.push(src);
    } else {
      contentUrls.push(src);
    }
  }

  return [...contentUrls, ...logoUrls];
}

/**
 * Generates the SEO slug for a publication.
 * Format: clean lowercase hyphenated string.
 */
export function getPublicationSlug(pub: Partial<Publication>): string {
  if (pub.slug && pub.slug.trim()) {
    return slugify(pub.slug);
  }
  if (pub.title && pub.title.trim()) {
    const slug = slugify(pub.title);
    if (slug) return slug;
  }
  if (pub.subject && pub.subject.trim()) {
    const slug = slugify(pub.subject);
    if (slug) return slug;
  }
  return pub.id ? slugify(pub.id) : `pub-${Date.now()}`;
}

/**
 * Returns the public URL for a publication.
 * Can be relative (/publications/my-slug) or absolute with origin.
 */
export function getPublicationUrl(pub: Partial<Publication>, origin?: string): string {
  const slug = getPublicationSlug(pub);
  const path = `/publications/${slug}`;
  if (origin) {
    const cleanOrigin = origin.replace(/\/+$/, "");
    return `${cleanOrigin}${path}`;
  }
  return path;
}

/**
 * Injects a responsive "View in browser / Online version" header bar into custom email HTML.
 */
export function injectWebVersionHeader(html: string, publicationUrl: string, subjectTitle?: string): string {
  if (!html) return html;

  const headerHtml = `
<!-- ONLINE PUBLICATION BAR START -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; border-bottom:1px solid #e2e8f0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td align="center" style="padding:10px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td align="left" style="font-size:11px; color:#64748b; line-height:1.4;">
            <span style="font-weight:600; color:#334155;">SANEX Official Publication</span>
            ${subjectTitle ? ` &bull; <span style="color:#64748b;">${subjectTitle}</span>` : ""}
          </td>
          <td align="right" style="font-size:11px; white-space:nowrap;">
            <a href="${publicationUrl}" target="_blank" rel="noopener noreferrer" style="color:#8DB833; font-weight:700; text-decoration:none; display:inline-flex; align-items:center;">
              View Online / Share &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- ONLINE PUBLICATION BAR END -->
`;

  // If HTML has body tag, inject right after <body ...>
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)/i, `$1\n${headerHtml}\n`);
  }

  // Otherwise prepend to html
  return `${headerHtml}\n${html}`;
}

/**
 * Helper to compute social media sharing links for any publication
 */
export function getSocialShareLinks(title: string, url: string, description?: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const textWithUrl = encodeURIComponent(`${title}\n\nRead the official publication: ${url}`);
  const encodedSummary = encodeURIComponent(description || title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${textWithUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${textWithUrl}`,
  };
}

export const SEED_CAMPAIGN_IDS = [
  "pub_hotel_sector",
  "pub_health_sector",
  "pub_campus_sector",
  "pub_school_sector",
  "pub_schools_sector",
  "pub_gov_sector",
  "pub_general_sector",
];

export const SEED_CAMPAIGN_SLUGS = [
  "hotel-sanitation-wastewater-management-solutions",
  "health-facility-wastewater-compliance-rwanda",
  "campus-university-sanitation-wastewater-rwanda",
  "school-academy-sanitation-pit-emptying-rwanda",
  "school-sanitation-wastewater-solutions-rwanda",
  "municipal-commercial-sanitation-partnerships-rwanda",
  "campus-wastewater-management-rwanda",
  "innovative-institution-wastewater-solutions",
  "wastewater-solutions-health-facilities-rwanda",
];

/**
 * Detects whether a publication is one of the generic seed template campaigns
 * that should be excluded from custom email listings.
 */
export function isGenericSectorCampaign(pub: Partial<Publication>): boolean {
  if (!pub) return false;
  if (pub.id && SEED_CAMPAIGN_IDS.includes(pub.id)) return true;
  if (pub.slug && SEED_CAMPAIGN_SLUGS.includes(pub.slug)) return true;
  const title = (pub.title || pub.subject || "").toLowerCase();
  if (
    title.includes("improve your hotel") ||
    title.includes("wastewater management solutions for campuses") ||
    title.includes("wastewater management solutions for schools") ||
    title.includes("innovative wastewater management solutions for your institution")
  ) {
    return true;
  }
  return false;
}

/**
 * Ensures only real custom emails (newsletters with proper design) are included in the list.
 */
export function isCustomEmailPublication(pub: Partial<Publication>): boolean {
  if (!pub) return false;
  if (isGenericSectorCampaign(pub)) return false;
  return true;
}


/**
 * Returns the official SANEX custom designed newsletter ready for 1-click publishing.
 * Built with full Email Studio design: brand header, hero banner, multi-column photos, CTAs, and verified footer.
 */
export function getCustomDesignedNewsletters(): Publication[] {
  const now = Date.now();
  const dayMs = 86400000;
  const newsletterHtml = compileBlocksToHtml(INITIAL_SANEX_BLOCKS);

  return [
    {
      id: "pub_custom_sanex_newsletter",
      slug: "sustainable-liquid-waste-management-clean-water-rwanda",
      title: "SANEX Company Ltd: Sustainable Liquid Waste Management & Clean Water Delivery",
      subject: "WHO ARE WE? Modern Liquid Waste & Wastewater Solutions in Rwanda",
      category: "Company Announcements",
      author: "SANEX Communications",
      publishedAt: now - dayMs * 1,
      createdAt: now - dayMs * 1,
      updatedAt: now,
      recipientCount: 85,
      status: "published",
      isCustom: true,
      coverImage:
        "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media",
      thumbnailImg:
        "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media",
      excerpt:
        "Sanex Company LTD is a Rwandan company specializing in liquid waste management, emptying services, and clean water delivery.",
      content: newsletterHtml,
      linkedNewsletters: [],
      viewsCount: 14,
    },
  ];
}


/**
 * Legacy reference for sector templates (not included in custom email listings).
 */
export function getPredefinedSectorPublications(): Publication[] {
  return [];
}
