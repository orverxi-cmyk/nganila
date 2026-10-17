"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a page view for an article or publication.
 * Uses sessionStorage to prevent duplicate counts during the same browsing session.
 */
export function trackPageView(
  type: "article" | "publication",
  id?: string | null,
  slug?: string | null
): void {
  if (typeof window === "undefined") return;
  const targetKey = (slug || id || "").trim();
  if (!targetKey) return;

  const storageKey = `sanex_viewed_${type}_${targetKey}`;
  if (sessionStorage.getItem(storageKey)) {
    return; // Already counted this session
  }

  sessionStorage.setItem(storageKey, "1");

  fetch("/api/views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id: id || undefined, slug: slug || undefined }),
  }).catch(() => {
    // Graceful silent error
  });
}

/**
 * React hook to automatically track a view when a page mounts.
 */
export function useTrackView(
  type: "article" | "publication",
  id?: string | null,
  slug?: string | null
): void {
  useEffect(() => {
    if (!id && !slug) return;
    trackPageView(type, id, slug);
  }, [type, id, slug]);
}

/**
 * React hook to read the global setting for whether view counts should be displayed on the public front end.
 */
export function getArticleViewsCount(
  article: any,
  articleViewsMap?: Record<string, number>
): number {
  if (!article) return 0;
  const direct = article.viewsCount ?? article.views;
  if (typeof direct === "number" && direct > 0) return direct;
  if (!articleViewsMap) return direct ?? 0;
  const fromId = article.id ? articleViewsMap[article.id] : undefined;
  if (typeof fromId === "number") return fromId;
  const fromSlug = article.slug ? articleViewsMap[article.slug] : undefined;
  if (typeof fromSlug === "number") return fromSlug;
  return 0;
}

/**
 * React hook to read the global setting for whether view counts should be displayed on the public front end.
 */
export function useViewsDisplay(): {
  showViewsOnFrontend: boolean;
  isLoading: boolean;
  articleViews: Record<string, number>;
  toggleViewsDisplay: (enabled: boolean) => Promise<boolean>;
} {
  const [showViews, setShowViews] = useState<boolean>(true);
  const [articleViews, setArticleViews] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/views")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.showViewsOnFrontend === "boolean") {
          setShowViews(data.showViewsOnFrontend);
        }
        if (data && data.articleViews && typeof data.articleViews === "object") {
          setArticleViews(data.articleViews);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const toggleViewsDisplay = async (enabled: boolean): Promise<boolean> => {
    setShowViews(enabled);
    try {
      const res = await fetch("/api/views", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showViewsOnFrontend: enabled }),
      });
      const data = await res.json();
      if (data && typeof data.showViewsOnFrontend === "boolean") {
        setShowViews(data.showViewsOnFrontend);
        return data.showViewsOnFrontend;
      }
      return enabled;
    } catch {
      return enabled;
    }
  };

  return {
    showViewsOnFrontend: showViews,
    isLoading,
    articleViews,
    toggleViewsDisplay,
  };
}
