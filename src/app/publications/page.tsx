import type { Metadata } from "next";
import PublicationsClient from "./PublicationsClient";

export const metadata: Metadata = {
  title: "Official Publications & Newsletters | SANEX Rwanda",
  description:
    "Explore official broadcasts, industry newsletters, and technical liquid waste management updates from SANEX Company Ltd in Rwanda.",
  alternates: {
    canonical: "https://sanex.rw/publications",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sanex.rw/publications",
    title: "Official Publications & Newsletters | SANEX Rwanda",
    description:
      "Explore official broadcasts, industry newsletters, and technical liquid waste management updates from SANEX Company Ltd in Rwanda.",
    siteName: "SANEX Rwanda",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media&token=e7f97250-ccbd-4a24-a9fa-793f86798a7d",
        width: 1200,
        height: 630,
        alt: "SANEX Company Ltd Newsletter & Publications",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Publications & Newsletters | SANEX Rwanda",
    description:
      "Explore official broadcasts, industry newsletters, and technical liquid waste management updates from SANEX Company Ltd in Rwanda.",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media&token=e7f97250-ccbd-4a24-a9fa-793f86798a7d",
    ],
    creator: "@SanexRwanda",
    site: "@SanexRwanda",
  },
};

export default function PublicationsPage() {
  return <PublicationsClient />;
}
