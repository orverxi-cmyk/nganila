import type { Metadata } from "next";
import { ServicesClient } from "./ServicesClient";

export const metadata: Metadata = {
  title: "Liquid Waste Management Services & Solutions | Nganila Rwanda",
  description:
    "Professional liquid waste collection, modern vacuum exhauster trucks, decentralized wastewater treatment systems (DWTS), septic tank emptying, and clean water delivery across Rwanda.",
  alternates: {
    canonical: "https://nganila.rw/services",
  },
  openGraph: {
    type: "website",
    locale: "en_RW",
    url: "https://nganila.rw/services",
    siteName: "Nganila Co LTD",
    title: "Liquid Waste Management Services & Solutions | Nganila Rwanda",
    description:
      "Professional liquid waste collection, modern vacuum exhauster trucks, decentralized wastewater treatment systems (DWTS), and sanitation delivery across Rwanda.",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
        width: 1200,
        height: 630,
        alt: "Nganila Specialized Vacuum Exhauster Trucks & Wastewater Services in Rwanda",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquid Waste Management Services & Solutions | Nganila Rwanda",
    description:
      "Professional liquid waste collection, modern vacuum exhauster trucks, and wastewater treatment solutions across Rwanda.",
    creator: "@nganila_rw",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
    ],
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
