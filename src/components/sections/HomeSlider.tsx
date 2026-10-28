
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Edit3, Phone, ShieldCheck, Truck, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeSlider() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const sliderRef = React.useMemo(() => (db ? doc(db, "settings", "slider") : null), [db]);
  const { data: sliderData, loading } = useDoc(sliderRef);

  const defaultItems = [
    { 
      title: "Nganila Co LTD", 
      description: "<p>Professional waste management and sanitation company in Kicukiro, Kigali, Rwanda. Verified member of ASSERWA operating a fleet of 5 vacuum tankers.</p>", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779714862617_SANEX_VIDEO_higlights%20-%20Copy.mp4?alt=media",
      width: 2000,
      height: 1080,
      link: "/services",
      buttonText: "Our Core Services"
    },
    { 
      title: "Liquid Waste Evacuation & Transport", 
      description: "<p>Professional septic tank emptying, pit latrine draining (kuvidura), and vacuum tanker transportation with rapid dispatch across Kigali.</p>", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
      width: 1200,
      height: 600,
      link: "/book",
      buttonText: "Book an Exhauster Truck"
    }
  ];

  const items = sliderData?.items || defaultItems;

  const isVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || (url.includes('firebasestorage') && url.toLowerCase().includes('.mp4'));
  };

  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!carouselApi) return;
    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Smoothly scroll and advance slider to the video slide when arriving via #slider or #video
  React.useEffect(() => {
    if (!carouselApi || !items || items.length === 0) return;

    const handleAnchorNavigation = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isVideoTarget =
        hash === "#slider" ||
        hash === "#video" ||
        hash === "#homeslider" ||
        search.includes("video") ||
        search.includes("slider");

      if (isVideoTarget) {
        const videoIndex = items.findIndex((slide: any) => isVideo(slide.imageUrl));
        if (videoIndex !== -1) {
          carouselApi.scrollTo(videoIndex);
        }

        setTimeout(() => {
          const section = document.getElementById("slider");
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 120);
      }
    };

    handleAnchorNavigation();
    window.addEventListener("hashchange", handleAnchorNavigation);
    return () => window.removeEventListener("hashchange", handleAnchorNavigation);
  }, [carouselApi, items]);

  return (
    <section id="slider" className="py-6 lg:py-10 overflow-hidden relative group bg-gradient-to-b from-sky-50/60 via-slate-50/40 to-white scroll-mt-24">
      <span id="video" className="scroll-mt-24 absolute -top-24 pointer-events-none" />
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-slate-900 text-white hover:bg-slate-800 gap-2 font-bold text-[15px] rounded-full shadow-xl">
            <Link href="/admin/content?tab=slider">
              <Edit3 className="h-4 w-4" /> Edit Showcase
            </Link>
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-16">
        {/* Reimagined Media-First Split Showcase */}
        <Carousel setApi={setCarouselApi} className="w-full relative overflow-visible" opts={{ loop: true }}>
          <CarouselContent className="m-0">
            {items.map((slide: any, i: number) => (
              <CarouselItem key={i} className="h-full pl-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-2xl shadow-sky-950/10 items-stretch">
                  
                  {/* Media Stage (7 Cols) */}
                  <div className="relative w-full min-h-[300px] sm:min-h-[420px] md:min-h-[500px] lg:h-[580px] lg:col-span-7 bg-slate-950 flex items-center justify-center overflow-hidden group/media">
                    {slide.imageUrl && isVideo(slide.imageUrl) ? (
                      <video 
                        src={slide.imageUrl} 
                        controls 
                        playsInline 
                        preload="metadata" 
                        className="w-full h-full object-cover sm:object-contain bg-black" 
                      />
                    ) : slide.imageUrl ? (
                      <Image 
                        src={slide.imageUrl} 
                        alt={slide.title || "Slide media"} 
                        fill 
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        className="object-cover transform transition-transform duration-700 group-hover/media:scale-105" 
                        priority={i === 0} 
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400 text-[16px] uppercase font-bold">
                        Media Pending
                      </div>
                    )}

                    {/* Gradient Overlay for Cinematic Depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />

                    {/* Floating Operational Badges */}
                    <div className="absolute top-5 left-5 flex flex-wrap gap-2 pointer-events-none z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900/90 text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-lg">
                        <Truck className="h-3.5 w-3.5 text-sky-400" />
                        Fleet of 5 Vacuum Tankers
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900/90 text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-lg">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Verified ASSERWA Member
                      </span>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 hidden sm:flex items-center justify-between text-white/80 text-[12px] pointer-events-none z-10">
                      <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        📍 Kicukiro, Kigali · Rapid Dispatch
                      </span>
                      <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        Residential &amp; Commercial Sanitation
                      </span>
                    </div>
                  </div>

                  {/* Detail Panel (5 Cols) - Deep Navy with Cyan / Azure highlights */}
                  <div className="flex flex-col justify-between p-7 sm:p-9 lg:p-11 lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white relative">
                    {/* Subtle ambient glow in panel */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="space-y-5 relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Professional Sanitation Partner</span>
                      </div>

                      <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-extrabold text-white tracking-tight leading-tight">
                        {slide.title}
                      </h2>

                      <div 
                        className="text-slate-300 text-[14px] sm:text-[15px] font-normal leading-relaxed prose prose-invert prose-sm max-w-none prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: slide.description }}
                      />

                      {/* Quick Highlight Featurettes */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Service Coverage</span>
                          <span className="text-[13px] text-white font-bold">Kigali &amp; Nationwide</span>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Response Time</span>
                          <span className="text-[13px] text-sky-400 font-bold">Rapid Mobilization</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-6 relative z-10 flex flex-col sm:flex-row gap-3">
                      <Button asChild className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-bold uppercase tracking-wider h-12 px-6 text-[13px] shadow-lg shadow-sky-600/30 gap-2">
                        <Link href={slide.link || "/book"}>
                          <Calendar className="h-4 w-4" />
                          <span>{slide.buttonText || "Book an Exhauster"}</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>

                      <Button asChild variant="outline" className="rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sky-300 font-bold h-12 px-5 text-[13px] gap-2">
                        <a href="tel:+250788450120">
                          <Phone className="h-4 w-4 text-sky-400" />
                          <span>Call Dispatch</span>
                        </a>
                      </Button>
                    </div>

                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Controls */}
          <CarouselPrevious className="hidden md:flex -left-5 lg:-left-6 border-slate-200 bg-white/95 text-slate-800 hover:bg-sky-600 hover:text-white shadow-xl shadow-slate-900/10 z-30 h-12 w-12 rounded-full transition-all" />
          <CarouselNext className="hidden md:flex -right-5 lg:-right-6 border-slate-200 bg-white/95 text-slate-800 hover:bg-sky-600 hover:text-white shadow-xl shadow-slate-900/10 z-30 h-12 w-12 rounded-full transition-all" />

          {/* Slide Dots Indicator */}
          {count > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              {Array.from({ length: count }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => carouselApi?.scrollTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    current === idx 
                      ? "w-8 bg-sky-600" 
                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  )}
                />
              ))}
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}
