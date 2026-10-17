import type { Metadata } from "next";
import { ServicesClient } from "./ServicesClient";

export const metadata: Metadata = {
  title: "Liquid Waste Management Services & Solutions | SANEX Rwanda",
  description:
    "Professional liquid waste collection, modern vacuum exhauster trucks, decentralized wastewater treatment systems (DWTS), septic tank emptying, and clean water delivery across Rwanda.",
  alternates: {
    canonical: "https://sanex.rw/services",
  },
  openGraph: {
    type: "website",
    locale: "en_RW",
    url: "https://sanex.rw/services",
    siteName: "SANEX Company Ltd",
    title: "Liquid Waste Management Services & Solutions | SANEX Rwanda",
    description:
      "Professional liquid waste collection, modern vacuum exhauster trucks, decentralized wastewater treatment systems (DWTS), and clean water delivery across Rwanda.",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media&token=d3048d2c-2d02-4fdb-8eaa-f741686a4401",
        width: 1200,
        height: 630,
        alt: "SANEX Specialized Vacuum Exhauster Trucks & Wastewater Services in Rwanda",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquid Waste Management Services & Solutions | SANEX Rwanda",
    description:
      "Professional liquid waste collection, modern vacuum exhauster trucks, and wastewater treatment solutions across Rwanda.",
    creator: "@sanex_rw",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media&token=d3048d2c-2d02-4fdb-8eaa-f741686a4401",
    ],
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
