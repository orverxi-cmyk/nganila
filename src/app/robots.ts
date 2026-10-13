import { MetadataRoute } from 'next';

/**
 * Technical crawler directives for Google, Bing, and other search engines.
 * Directs crawlers to the dynamic sitemap and protects admin/api endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://sanex.rw';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/',
          '/gallery',
          '/articles',
          '/articles/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
