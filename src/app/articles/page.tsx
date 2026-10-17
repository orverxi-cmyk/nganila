
"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { Loader2, FileText, ArrowRight, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getArticleUrl } from "@/lib/slug";
import { useViewsDisplay, getArticleViewsCount } from "@/hooks/use-view-tracker";

export default function ArticlesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { showViewsOnFrontend, articleViews } = useViewsDisplay();

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const isAuthorizedAdmin =
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com" ||
    (user as any)?.role === "admin" ||
    userProfile?.role === "admin";

  const articlesQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "articles"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: articles, loading } = useCollection(articlesQuery);
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const showLoading = loading && !timedOut && (!articles || articles.length === 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-5 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-5 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-headline">Impact & Case Studies</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-base">
              Read about how SANEX is transforming waste management and protecting the environment across Rwanda.
            </p>
          </div>

          {showLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {articles.map((article: any) => {
                const articleUrl = getArticleUrl(article);
                return (
                  <div key={article.id} className="group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all flex flex-col">
                    <Link href={articleUrl} className="block relative h-48 w-full bg-muted overflow-hidden">
                      {article.imageUrl ? (
                        <Image 
                          src={article.imageUrl} 
                          alt={article.title} 
                          fill 
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </Link>
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {article.category || 'Impact'}
                        </span>
                        {(showViewsOnFrontend || isAuthorizedAdmin) && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                            <Eye className="h-3 w-3 text-emerald-600" />
                            <span>{getArticleViewsCount(article, articleViews)}</span>
                            {!showViewsOnFrontend && isAuthorizedAdmin && (
                              <span className="text-[8px] text-amber-600 font-bold">(Admin)</span>
                            )}
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Link href={articleUrl}>
                        <h2 className="text-lg font-bold font-headline mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                      </Link>
                      <p className="text-xs text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                      <div className="mt-auto">
                        <Button asChild variant="ghost" className="p-0 h-auto hover:bg-transparent text-primary gap-2 font-bold text-xs uppercase tracking-widest">
                          <Link href={articleUrl}>Read Full Story <ArrowRight className="h-3 w-3" /></Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-xl font-bold">No Articles Found</h3>
              <p className="text-muted-foreground">Detailed impact stories will appear here soon.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
