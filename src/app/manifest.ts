
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nganira Company LTD',
    short_name: 'Nganira',
    description: 'Professional Waste Management & Sanitation Company in Kicukiro, Kigali, Rwanda — Verified Member of ASSERWA',
    start_url: '/',
    display: 'standalone',
    background_color: '#636679',
    theme_color: '#d9eaa4',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
