import type { Metadata } from "next";
import ArticlesClient from "./ArticlesClient";

export const metadata: Metadata = {
  title: "Impact Stories & Case Studies | Nganila Rwanda",
  description:
    "Explore how Nganila Co LTD transforms wastewater management, septic tank emptying, and environmental safety across institutions, hotels, and homes in Rwanda.",
  alternates: {
    canonical: "https://nganila.rw/articles",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nganila.rw/articles",
    title: "Impact Stories & Case Studies | Nganila Rwanda",
    description:
      "Explore how Nganila Co LTD transforms wastewater management, septic tank emptying, and environmental safety across Rwanda.",
    siteName: "Nganila Rwanda",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
        width: 1200,
        height: 630,
        alt: "Nganila Co LTD Fleet and Operations in Rwanda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Impact Stories & Case Studies | Nganila Rwanda",
    description:
      "Explore how Nganila Co LTD transforms wastewater management, septic tank emptying, and environmental safety across Rwanda.",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
    ],
    creator: "@NganilaRwanda",
    site: "@NganilaRwanda",
  },
};

export default function ArticlesPage() {
  return <ArticlesClient />;
}
