import type { Metadata } from "next";
import PublicationsClient from "./PublicationsClient";

export const metadata: Metadata = {
  title: "Official Publications & Newsletters | Nganira Rwanda",
  description:
    "Explore official broadcasts, industry newsletters, and technical liquid waste management updates from Nganira Company LTD in Rwanda.",
  alternates: {
    canonical: "https://nganira.rw/publications",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nganira.rw/publications",
    title: "Official Publications & Newsletters | Nganira Rwanda",
    description:
      "Explore official broadcasts, industry newsletters, and technical liquid waste management updates from Nganira Company LTD in Rwanda.",
    siteName: "Nganira Rwanda",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media",
        width: 1200,
        height: 630,
        alt: "Nganira Company LTD Newsletter & Publications",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Publications & Newsletters | Nganira Rwanda",
    description:
      "Explore official broadcasts, industry newsletters, and technical liquid waste management updates from Nganira Company LTD in Rwanda.",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media",
    ],
    creator: "@NganiraRwanda",
    site: "@NganiraRwanda",
  },
};

export default function PublicationsPage() {
  return <PublicationsClient />;
}
