import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://nganira.rw'),
  title: {
    default: 'Nganira Company LTD | Waste Management & Sanitation in Kigali, Rwanda',
    template: '%s | Nganira Company LTD',
  },
  description: 'Nganira Company LTD is a professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda. Verified member of ASSERWA operating a fleet of 5 vacuum tankers.',
  keywords: [
    'Nganira Company LTD',
    'Nganira',
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
  authors: [{ name: 'Nganira Company LTD', url: 'https://nganira.rw' }],
  creator: 'Nganira Company LTD',
  publisher: 'Nganira Company LTD',
  alternates: {
    canonical: 'https://nganira.rw',
  },
  openGraph: {
    type: 'website',
    locale: 'en_RW',
    url: 'https://nganira.rw',
    siteName: 'Nganira Company LTD',
    title: 'Nganira Company LTD | Waste Management & Sanitation in Kigali, Rwanda',
    description: 'Professional liquid waste evacuation, vacuum tankers, and decentralized wastewater treatment in Kicukiro, Kigali. Verified member of ASSERWA.',
    images: [
      {
        url: 'https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media',
        width: 1200,
        height: 630,
        alt: 'Nganira Company LTD - Waste Management & Sanitation in Rwanda',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nganira Company LTD | Waste Management & Sanitation in Kigali, Rwanda',
    description: 'Professional liquid waste evacuation, vacuum tankers, and wastewater treatment in Kigali. Verified ASSERWA member.',
    creator: '@nganira_rw',
    images: [
      'https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media',
    ],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "SanitationService",
  "@id": "https://nganira.rw/#organization",
  "name": "Nganira Company LTD",
  "legalName": "Nganira Company LTD",
  "url": "https://nganira.rw",
  "logo": "https://nganira.rw/favicon.ico",
  "description": "Nganira Company LTD is a professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda. Verified member of ASSERWA.",
  "telephone": "+250788450120",
  "email": "info@nganira.rw",
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
