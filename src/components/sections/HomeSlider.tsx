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
import { Edit3 } from "lucide-react";

export function HomeSlider() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const sliderRef = React.useMemo(() => (db ? doc(db, "settings", "slider") : null), [db]);
  const { data: sliderData } = useDoc(sliderRef);

  const [serverItems, setServerItems] = React.useState<any[] | null>(null);

  // Load server-persisted settings immediately on mount
  React.useEffect(() => {
    let active = true;
    fetch("/api/settings?section=slider")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.success && Array.isArray(data?.data?.items)) {
          setServerItems(data.data.items);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Sync whenever fresh Firestore data arrives
  React.useEffect(() => {
    if (sliderData?.items && Array.isArray(sliderData.items)) {
      setServerItems(sliderData.items);
    }
  }, [sliderData]);

  // Purely dynamic: strictly only the saved items
  const items = Array.isArray(sliderData?.items) 
    ? sliderData.items 
    : (serverItems || []);

  const isVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || (url.includes('firebasestorage') && url.toLowerCase().includes('.mp4'));
  };

  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();

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

  if (items.length === 0) {
    if (isAdmin) {
      return (
        <section id="slider" className="w-full py-16 bg-[#006400] flex flex-col items-center justify-center text-center px-4">
          <p className="text-slate-100 text-sm mb-3">Homepage Slider is empty. Add your slides in Content Management.</p>
          <Button asChild className="bg-white text-[#006400] hover:bg-slate-100 font-bold text-xs">
            <Link href="/admin/content?tab=slider"><Edit3 className="mr-1.5 h-4 w-4" /> Add Slides</Link>
          </Button>
        </section>
      );
    }
    return null;
  }

  return (
    <section id="slider" className="w-full overflow-hidden relative group bg-[#006400] scroll-mt-24">
      <span id="video" className="scroll-mt-24 absolute -top-24 pointer-events-none" />
      
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button asChild className="pointer-events-auto bg-[#005000] text-white hover:bg-[#004000] gap-2 font-bold text-xs rounded-xl shadow-xl border border-white/20 backdrop-blur-md">
            <Link href="/admin/content?tab=slider">
              <Edit3 className="h-4 w-4 text-white" /> Edit Showcase
            </Link>
          </Button>
        </div>
      )}

      {/* Full Width Slider Carousel */}
      <Carousel setApi={setCarouselApi} className="w-full relative overflow-hidden" opts={{ loop: true }}>
        <CarouselContent className="m-0">
          {items.map((slide: any, i: number) => (
            <CarouselItem key={i} className="h-full pl-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 w-full bg-[#006400] items-stretch">
                
                {/* Media Stage (7 Cols / 8 Cols on XL) */}
                <div className="relative w-full min-h-[320px] sm:min-h-[420px] md:min-h-[500px] lg:h-[580px] xl:h-[620px] lg:col-span-7 xl:col-span-8 bg-[#004d00] flex items-center justify-center overflow-hidden">
                  {slide.imageUrl && isVideo(slide.imageUrl) ? (
                    <video 
                      src={slide.imageUrl} 
                      controls 
                      playsInline 
                      preload="metadata" 
                      className="w-full h-full object-cover bg-black" 
                    />
                  ) : slide.imageUrl ? (
                    <Image 
                      src={slide.imageUrl} 
                      alt={slide.title || "Slide media"} 
                      fill 
                      sizes="(max-width: 1024px) 100vw, 70vw"
                      className="object-cover" 
                      priority={i === 0} 
                    />
                  ) : (
                    <div className="h-full w-full bg-[#004d00] flex items-center justify-center text-white/80 text-sm uppercase font-bold">
                      Media Pending
                    </div>
                  )}
                </div>

                {/* Text Part (5 Cols / 4 Cols on XL) - Contains ONLY Title and Description */}
                <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14 xl:p-16 lg:col-span-5 xl:col-span-4 bg-gradient-to-br from-[#006400] via-[#005500] to-[#004600] text-white relative border-t lg:border-t-0 lg:border-l border-[#005000]">
                  {/* Subtle ambient background glow */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="space-y-4 relative z-10 max-w-xl">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {slide.title}
                    </h2>

                    <div 
                      className="text-white/95 text-sm sm:text-base font-normal leading-relaxed prose prose-invert prose-p:leading-relaxed [&_*]:!text-white [&_*]:!bg-transparent"
                      dangerouslySetInnerHTML={{ __html: slide.description }}
                    />
                  </div>
                </div>

              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Controls */}
        <CarouselPrevious className="hidden md:flex left-4 lg:left-6 border-white/25 bg-black/40 text-white hover:bg-white hover:text-[#006400] hover:border-white shadow-2xl backdrop-blur-md z-30 h-12 w-12 rounded-full transition-all" />
        <CarouselNext className="hidden md:flex right-4 lg:right-6 border-white/25 bg-black/40 text-white hover:bg-white hover:text-[#006400] hover:border-white shadow-2xl backdrop-blur-md z-30 h-12 w-12 rounded-full transition-all" />
      </Carousel>
    </section>
  );
}
