/**
 * Utility functions for generating SEO-friendly slugs and links for articles.
 */

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Decompose accents (e.g. é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // Strip accent marks
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric chars except space and hyphen
    .replace(/[\s_]+/g, "-") // Replace whitespace and underscores with single hyphen
    .replace(/-+/g, "-") // Collapse multiple consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens from beginning and end
}

export interface ArticleLike {
  id?: string;
  slug?: string;
  title?: string;
}

/**
 * Gets the SEO-friendly slug for an article.
 * Priority: custom `slug` field -> slugified `title` -> fallback `id`.
 */
export function getArticleSlug(article: ArticleLike): string {
  if (article.slug && article.slug.trim()) {
    return slugify(article.slug);
  }
  if (article.title && article.title.trim()) {
    const slug = slugify(article.title);
    if (slug) return slug;
  }
  return article.id || "";
}

/**
 * Generates the clean, SEO-friendly relative URL for an article.
 */
export function getArticleUrl(article: ArticleLike): string {
  const slug = getArticleSlug(article);
  return slug ? `/articles/${slug}` : "/articles";
}
