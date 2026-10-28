
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

  const content = {
    badge: heroData?.badge || "Verified Member of ASSERWA",
    title: heroData?.title || "Nganila Co LTD",
    titleAccent: heroData?.titleAccent || "Waste Management & Sanitation",
    description: heroData?.description || "Professional waste management and sanitation company in Kicukiro, Kigali, Rwanda. Operating a fleet of 5 vacuum tankers for septic tank emptying, pit latrine draining (kuvidura), and decentralized wastewater treatment.",
    imageUrl: heroData?.imageUrl || "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779799776154_B25A3083.jpg?alt=media",
    imageWidth: heroData?.imageWidth || 800,
    imageHeight: heroData?.imageHeight || 600,
    ctaText: heroData?.ctaText || "Book an Exhauster Truck",
    ctaLink: heroData?.ctaLink || "/book"
  };

  return (
    <section className="relative overflow-hidden py-12 bg-slate-950 text-white group font-sans border-b border-slate-900">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-white text-slate-900 hover:bg-white/80 gap-2 font-bold text-[14px] rounded-xl">
            <Link href="/admin/content?tab=hero">
              <Edit3 className="h-4 w-4" /> Edit Hero
            </Link>
          </Button>
        </div>
      )}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-950/60 px-4 py-1.5 text-xs font-semibold text-sky-300 uppercase tracking-wider backdrop-blur-sm">
              <span className="relative flex h-2 w-2 mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {content.badge}
            </div>
            
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {content.title} <span className="text-sky-400">{content.titleAccent}</span>
            </h1>
            
            <div className="text-sm font-normal text-slate-300 max-w-[600px] leading-relaxed prose prose-invert prose-sky">
              <div dangerouslySetInnerHTML={{ __html: content.description }} />
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="h-12 px-7 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-xl gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-105">
                <Link href={content.ctaLink}>
                  <Calendar className="h-4 w-4 text-white" /> 
                  {content.ctaText}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-7 text-xs font-bold uppercase tracking-wider rounded-xl border-sky-500/40 text-sky-300 hover:bg-sky-950/60 hover:border-sky-400 hover:text-white transition-colors">
                <Link href="/about">
                  Learn More 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right duration-1000">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ring-1 ring-sky-500/20">
              {content.imageUrl ? (
                <Image
                  src={content.imageUrl}
                  alt="Sanitation facility"
                  width={content.imageWidth}
                  height={content.imageHeight}
                  className="object-cover w-full h-auto"
                  priority
                />
              ) : (
                <div className="aspect-[4/3] bg-muted/10 flex items-center justify-center text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                  Media Placeholder
                </div>
              )}
            </div>
            <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-[2rem] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
