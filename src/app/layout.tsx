import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://sanex.rw'),
  title: {
    default: 'Sanex | Leading Liquid Waste Management in Rwanda',
    template: '%s | Sanex Rwanda',
  },
  description: 'SANEX Company Ltd provides sustainable liquid waste management, vacuum exhauster services, decentralized wastewater treatment systems (DEWATS), and professional sanitation solutions across Rwanda.',
  keywords: [
    'liquid waste management Rwanda',
    'septic tank emptying Kigali',
    'vacuum exhauster truck Rwanda',
    'decentralized wastewater treatment Kigali',
    'commercial sludge collection',
    'cesspool emptying Rwanda',
    'SANEX Company Ltd',
    'sanitation services Kigali',
  ],
  authors: [{ name: 'SANEX Company Ltd', url: 'https://sanex.rw' }],
  creator: 'SANEX Company Ltd',
  publisher: 'SANEX Company Ltd',
  alternates: {
    canonical: 'https://sanex.rw',
  },
  openGraph: {
    type: 'website',
    locale: 'en_RW',
    url: 'https://sanex.rw',
    siteName: 'SANEX Company Ltd',
    title: 'Sanex | Leading Liquid Waste Management in Rwanda',
    description: 'Professional liquid waste collection, modern vacuum exhauster trucks, and decentralized wastewater treatment solutions across Rwanda.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanex | Leading Liquid Waste Management in Rwanda',
    description: 'Professional liquid waste collection, vacuum exhauster trucks, and wastewater treatment systems across Rwanda.',
    creator: '@sanex_rw',
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
  "@id": "https://sanex.rw/#organization",
  "name": "SANEX Company Ltd",
  "legalName": "SANEX Company Ltd",
  "url": "https://sanex.rw",
  "logo": "https://sanex.rw/favicon.ico",
  "description": "SANEX Company Ltd provides sustainable liquid waste management, vacuum exhauster services, and decentralized wastewater treatment systems (DEWATS) across Rwanda.",
  "telephone": "+250788303628",
  "email": "sanexcompany@gmail.com",
  "address": {
    "@type": "PostalAddress",
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
    "https://twitter.com/sanex_rw",
    "https://linkedin.com/company/sanex-rw",
    "https://facebook.com/sanex.rw",
    "https://instagram.com/sanex_rw"
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
