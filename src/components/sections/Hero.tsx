
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
    <section className="relative overflow-hidden py-2.5 bg-black text-white group font-arial">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-white text-black hover:bg-white/80 gap-2 font-bold text-[14px] rounded-full">
            <Link href="/admin/content?tab=hero">
              <Edit3 className="h-4 w-4" /> Edit Hero
            </Link>
          </Button>
        </div>
      )}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
          <div className="space-y-4 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[12px] font-bold text-primary uppercase tracking-widest">
              <span className="relative flex h-2 w-2 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {content.badge}
            </div>
            
            <h1 className="text-3xl lg:text-6xl font-bold font-headline tracking-tighter leading-tight text-white">
              {content.title} <span className="text-primary">{content.titleAccent}</span>
            </h1>
            
            <div className="text-[14px] font-normal text-white/70 max-w-[600px] leading-relaxed prose prose-invert prose-primary">
              <div dangerouslySetInnerHTML={{ __html: content.description }} />
            </div>
            
            <div className="flex flex-wrap gap-x-[5px] gap-y-[20px] pt-1">
              <Button asChild className="h-12 px-8 text-[12px] font-bold uppercase tracking-widest bg-primary text-black rounded-full gap-2 hover:bg-primary/90 transition-transform hover:scale-105">
                <Link href={content.ctaLink}>
                  <Calendar className="h-4 w-4 text-black" /> 
                  {content.ctaText}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 text-[12px] font-bold uppercase tracking-widest rounded-full border-primary/50 text-primary hover:bg-primary/5 hover:border-primary">
                <Link href="/about">
                  Learn More 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right duration-1000">
            <div className="relative z-10 rounded-[1.5rem] overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
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
