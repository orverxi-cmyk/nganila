import type { Metadata } from "next";
import ArticlesClient from "./ArticlesClient";

export const metadata: Metadata = {
  title: "Impact Stories & Case Studies | SANEX Rwanda",
  description:
    "Explore how SANEX Company Ltd transforms wastewater management, septic tank emptying, and environmental safety across institutions, hotels, and homes in Rwanda.",
  alternates: {
    canonical: "https://sanex.rw/articles",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sanex.rw/articles",
    title: "Impact Stories & Case Studies | SANEX Rwanda",
    description:
      "Explore how SANEX Company Ltd transforms wastewater management, septic tank emptying, and environmental safety across Rwanda.",
    siteName: "SANEX Rwanda",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media&token=d3048d2c-2d02-4fdb-8eaa-f741686a4401",
        width: 1200,
        height: 630,
        alt: "SANEX Company Ltd Fleet and Operations in Rwanda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Impact Stories & Case Studies | SANEX Rwanda",
    description:
      "Explore how SANEX Company Ltd transforms wastewater management, septic tank emptying, and environmental safety across Rwanda.",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media&token=d3048d2c-2d02-4fdb-8eaa-f741686a4401",
    ],
    creator: "@SanexRwanda",
    site: "@SanexRwanda",
  },
};

export default function ArticlesPage() {
  return <ArticlesClient />;
}
