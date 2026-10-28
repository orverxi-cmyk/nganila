
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { ArrowRight, Calendar, Loader2, Edit3 } from "lucide-react";

export function Hero() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const heroRef = React.useMemo(() => (db ? doc(db, "settings", "hero") : null), [db]);
  const { data: heroData, loading } = useDoc(heroRef);

  const badge = heroData?.badge || "";
  const title = heroData?.title || "";
  const titleAccent = heroData?.titleAccent || "";
  const description = heroData?.description || "";
  const imageUrl = heroData?.imageUrl || "";
  const imageWidth = heroData?.imageWidth || 800;
  const imageHeight = heroData?.imageHeight || 600;
  const ctaText = heroData?.ctaText || "Book Service";
  const ctaLink = heroData?.ctaLink || "/book";

  if (!title && !description && !imageUrl) {
    if (isAdmin) {
      return (
        <section className="py-12 bg-[#26272e] text-center border-b border-[#383944]">
          <p className="text-slate-300 text-sm mb-3">Hero section has no content yet.</p>
          <Button asChild className="bg-[#d9eaa4] text-[#26272e] hover:bg-[#cbe090] font-bold text-xs">
            <Link href="/admin/content?tab=hero"><Edit3 className="mr-1.5 h-4 w-4" /> Edit Hero</Link>
          </Button>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="relative overflow-hidden py-12 bg-[#26272e] text-white group font-sans border-b border-[#383944]">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-[14px] rounded-xl shadow-lg border border-[#7d8094]">
            <Link href="/admin/content?tab=hero">
              <Edit3 className="h-4 w-4 text-[#d9eaa4]" /> Edit Hero
            </Link>
          </Button>
        </div>
      )}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-[#636679]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#d9eaa4]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-16 relative z-10">
        <div className={`grid grid-cols-1 ${imageUrl ? 'lg:grid-cols-2' : ''} gap-10 items-center`}>
          <div className="space-y-5 animate-in fade-in slide-in-from-left duration-700">
            {badge && (
              <div className="inline-flex items-center rounded-full border border-[#d9eaa4]/40 bg-[#d9eaa4]/15 px-4 py-1.5 text-xs font-semibold text-[#d9eaa4] uppercase tracking-wider backdrop-blur-sm">
                <span className="relative flex h-2 w-2 mr-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d9eaa4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d9eaa4]"></span>
                </span>
                {badge}
              </div>
            )}
            
            {title && (
              <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                {title} {titleAccent && <span className="text-[#d9eaa4]">{titleAccent}</span>}
              </h1>
            )}
            
            {description && (
              <div className="text-sm font-normal text-slate-200 max-w-[600px] leading-relaxed prose prose-invert">
                <div dangerouslySetInnerHTML={{ __html: description }} />
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="h-12 px-7 text-xs font-bold uppercase tracking-wider bg-[#d9eaa4] hover:bg-[#cbe090] text-[#26272e] rounded-xl gap-2 shadow-lg shadow-[#d9eaa4]/20 transition-all hover:scale-105 border border-[#cbe090]">
                <Link href={ctaLink}>
                  <Calendar className="h-4 w-4 text-[#26272e]" /> 
                  {ctaText}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-7 text-xs font-bold uppercase tracking-wider rounded-xl border-[#d9eaa4]/40 text-[#d9eaa4] hover:bg-[#d9eaa4]/20 hover:border-[#d9eaa4] hover:text-white transition-colors">
                <Link href="/about">
                  Learn More 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {imageUrl && (
            <div className="relative animate-in fade-in slide-in-from-right duration-1000">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-[#545667] ring-1 ring-[#d9eaa4]/20">
                <Image
                  src={imageUrl}
                  alt={title || "Sanitation facility"}
                  width={imageWidth}
                  height={imageHeight}
                  className="object-cover w-full h-auto"
                  priority
                />
              </div>
              <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-[2rem] -z-10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
