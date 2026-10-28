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
import { cn } from "@/lib/utils";

export function HomeSlider() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const sliderRef = React.useMemo(() => (db ? doc(db, "settings", "slider") : null), [db]);
  const { data: sliderData } = useDoc(sliderRef);

  const defaultItems = [
    { 
      title: "Nganira Company LTD", 
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

  // Immediate local backup to prevent reverting to defaults during localhost refresh / initial load
  const [localBackup, setLocalBackup] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("nganila_setting_slider");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
          setLocalBackup(parsed.items);
        }
      }
    } catch {}
  }, []);

  // Sync to local storage whenever fresh data arrives from Firestore
  React.useEffect(() => {
    if (sliderData?.items && Array.isArray(sliderData.items) && sliderData.items.length > 0) {
      try {
        localStorage.setItem("nganila_setting_slider", JSON.stringify({ items: sliderData.items }));
      } catch {}
    }
  }, [sliderData]);

  const items = (sliderData?.items && sliderData.items.length > 0)
    ? sliderData.items
    : (localBackup || defaultItems);

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
    <section id="slider" className="w-full overflow-hidden relative group bg-[#26272e] scroll-mt-24">
      <span id="video" className="scroll-mt-24 absolute -top-24 pointer-events-none" />
      
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-xs rounded-xl shadow-xl border border-[#7d8094] backdrop-blur-md">
            <Link href="/admin/content?tab=slider">
              <Edit3 className="h-4 w-4 text-[#d9eaa4]" /> Edit Showcase
            </Link>
          </Button>
        </div>
      )}

      {/* Full Width Slider Carousel */}
      <Carousel setApi={setCarouselApi} className="w-full relative overflow-hidden" opts={{ loop: true }}>
        <CarouselContent className="m-0">
          {items.map((slide: any, i: number) => (
            <CarouselItem key={i} className="h-full pl-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 w-full bg-[#26272e] items-stretch">
                
                {/* Media Stage (7 Cols / 8 Cols on XL) */}
                <div className="relative w-full min-h-[320px] sm:min-h-[420px] md:min-h-[500px] lg:h-[580px] xl:h-[620px] lg:col-span-7 xl:col-span-8 bg-black flex items-center justify-center overflow-hidden">
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
                    <div className="h-full w-full bg-[#383944] flex items-center justify-center text-[#bcbec8] text-sm uppercase font-bold">
                      Media Pending
                    </div>
                  )}
                </div>

                {/* Text Part (5 Cols / 4 Cols on XL) - Contains ONLY Title and Description */}
                <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14 xl:p-16 lg:col-span-5 xl:col-span-4 bg-gradient-to-br from-[#636679] via-[#454755] to-[#26272e] text-white relative border-t lg:border-t-0 lg:border-l border-[#545667]/80">
                  {/* Subtle ambient background glow */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#d9eaa4]/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="space-y-4 relative z-10 max-w-xl">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {slide.title}
                    </h2>

                    <div 
                      className="text-slate-200 text-sm sm:text-base font-normal leading-relaxed prose prose-invert prose-p:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: slide.description }}
                    />
                  </div>
                </div>

              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Controls */}
        <CarouselPrevious className="hidden md:flex left-4 lg:left-6 border-[#545667] bg-[#383944]/80 text-white hover:bg-[#d9eaa4] hover:text-[#26272e] hover:border-[#d9eaa4] shadow-2xl backdrop-blur-md z-30 h-12 w-12 rounded-full transition-all" />
        <CarouselNext className="hidden md:flex right-4 lg:right-6 border-[#545667] bg-[#383944]/80 text-white hover:bg-[#d9eaa4] hover:text-[#26272e] hover:border-[#d9eaa4] shadow-2xl backdrop-blur-md z-30 h-12 w-12 rounded-full transition-all" />

        {/* Slide Dots Indicator */}
        {count > 1 && (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-[#26272e] border-t border-[#383944]">
            {Array.from({ length: count }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => carouselApi?.scrollTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  current === idx 
                    ? "w-8 bg-[#d9eaa4]" 
                    : "w-2 bg-[#636679] hover:bg-[#9698a7]"
                )}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  );
}
