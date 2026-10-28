import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://nganila.com'),
  title: {
    default: 'Nganila Co LTD | Waste Management & Sanitation in Kigali, Rwanda',
    template: '%s | Nganila Co LTD',
  },
  description: 'Nganila Co LTD is a professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda. Verified member of ASSERWA operating a fleet of 5 vacuum tankers.',
  keywords: [
    'Nganila Co LTD',
    'liquid waste management Rwanda',
    'septic tank emptying Kigali',
    'pit latrine draining Kigali',
    'kuvidura Rwanda',
    'vacuum tanker Kigali',
    'exhauster truck Rwanda',
    'decentralized wastewater treatment Kigali',
    'ASSERWA member',
    'sanitation services Kicukiro',
  ],
  authors: [{ name: 'Nganila Co LTD', url: 'https://nganila.com' }],
  creator: 'Nganila Co LTD',
  publisher: 'Nganila Co LTD',
  alternates: {
    canonical: 'https://nganila.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_RW',
    url: 'https://nganila.com',
    siteName: 'Nganila Co LTD',
    title: 'Nganila Co LTD | Waste Management & Sanitation in Kigali, Rwanda',
    description: 'Professional liquid waste evacuation, vacuum tankers, and decentralized wastewater treatment in Kicukiro, Kigali. Verified member of ASSERWA.',
    images: [
      {
        url: 'https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media',
        width: 1200,
        height: 630,
        alt: 'Nganila Co LTD - Waste Management & Sanitation in Rwanda',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nganila Co LTD | Waste Management & Sanitation in Kigali, Rwanda',
    description: 'Professional liquid waste evacuation, vacuum tankers, and wastewater treatment in Kigali. Verified ASSERWA member.',
    creator: '@nganila_rw',
    images: [
      'https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media',
    ],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "SanitationService",
  "@id": "https://nganila.com/#organization",
  "name": "Nganila Co LTD",
  "legalName": "Nganila Co LTD",
  "url": "https://nganila.com",
  "logo": "https://nganila.com/favicon.ico",
  "description": "Nganila Co LTD is a professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda. Verified member of ASSERWA.",
  "telephone": "+250788450120",
  "email": "info@nganila.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kicukiro",
    "addressLocality": "Kigali",
    "addressCountry": "RW"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -1.9441,
    "longitude": 30.0619
  },
  "areaServed": [
    {
      "@type": "Country",
      "name": "Rwanda"
    },
    {
      "@type": "City",
      "name": "Kigali"
    }
  ],
  "sameAs": [
    "https://asserwa.rw"
  ],
  "priceRange": "$$"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
              } else {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                  }).catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}
