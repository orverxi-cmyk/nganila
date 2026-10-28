import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs } from 'firebase/firestore';
import { getArticleUrl } from '@/lib/slug';

/**
 * Generates the sitemap for Nganila Co LTD website.
 * Next.js automatically maps this to /sitemap.xml
 * Dynamically includes individual articles with their SEO friendly URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nganila.rw';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/publications`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  try {
    const { firestore } = initializeFirebase();
    const snap = await getDocs(collection(firestore, 'articles'));
    const dynamicArticles: MetadataRoute.Sitemap = snap.docs.map(doc => {
      const data = doc.data();
      const relativeUrl = getArticleUrl({
        id: doc.id,
        slug: data.slug,
        title: data.title,
      });
      return {
        url: `${baseUrl}${relativeUrl}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt) : (data.createdAt ? new Date(data.createdAt) : new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: data.imageUrl ? [data.imageUrl] : undefined,
      };
    });

    // Also include published newsletters/publications in sitemap
    let dynamicPublications: MetadataRoute.Sitemap = [];
    try {
      const pubSnap = await getDocs(collection(firestore, 'publications'));
      dynamicPublications = pubSnap.docs
        .filter(doc => (doc.data().status || 'published') === 'published')
        .map(doc => {
          const data = doc.data();
          const slug = data.slug || doc.id;
          return {
            url: `${baseUrl}/publications/${slug}`,
            lastModified: data.updatedAt ? new Date(data.updatedAt) : (data.publishedAt ? new Date(data.publishedAt) : new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.75,
            images: data.coverImage ? [data.coverImage] : undefined,
          };
        });
    } catch (pubErr) {
      console.warn('Failed to fetch publications for dynamic sitemap:', pubErr);
    }

    return [...staticRoutes, ...dynamicArticles, ...dynamicPublications];
  } catch (error) {
    console.warn('Failed to fetch articles for dynamic sitemap:', error);
    return staticRoutes;
  }
}
