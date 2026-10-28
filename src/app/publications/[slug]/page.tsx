import type { Metadata } from "next";
import { getServerPublicationBySlug } from "@/lib/server-publications-store";
import PublicationDetailClient from "./PublicationDetailClient";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

const DEFAULT_FALLBACK_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media";

function toAbsoluteUrl(url?: string): string {
  if (!url) return DEFAULT_FALLBACK_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `https://nganila.rw${url}`;
  return `https://nganila.rw/${url}`;
}

/**
 * Server Component with generateMetadata for social media preview cards.
 * Delivers server-rendered Open Graph and Twitter Card tags to WhatsApp,
 * Twitter/X, LinkedIn, Facebook, and Telegram crawlers.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const rawSlug = resolved?.slug || "";
  const pub = await getServerPublicationBySlug(rawSlug);

  const title = pub?.title
    ? `${pub.title} | Nganila Publications`
    : "Official Newsletter & Broadcast | Nganila Rwanda";

  const description =
    pub?.excerpt?.trim() ||
    "Official publication and newsletter from Nganila Co LTD, leading modern liquid waste management in Rwanda.";

  const canonicalUrl = `https://nganila.rw/publications/${rawSlug}`;
  const imageUrl = toAbsoluteUrl(pub?.coverImage || pub?.thumbnailImg);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      locale: "en_US",
      url: canonicalUrl,
      title,
      description,
      siteName: "SANEX Rwanda",
      publishedTime: pub?.publishedAt ? new Date(pub.publishedAt).toISOString() : undefined,
      modifiedTime: pub?.updatedAt ? new Date(pub.updatedAt).toISOString() : undefined,
      authors: pub?.author ? [pub.author] : ["SANEX Communications"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: pub?.title || "SANEX Official Newsletter",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@SanexRwanda",
      site: "@SanexRwanda",
    },
  };
}

export default async function PublicationPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const rawSlug = resolved?.slug || "";
  const pub = await getServerPublicationBySlug(rawSlug);

  return <PublicationDetailClient initialSlug={rawSlug} initialPublication={pub} />;
}
