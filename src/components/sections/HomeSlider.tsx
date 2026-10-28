
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
import { Loader2, ArrowRight, Edit3 } from "lucide-react";

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
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1779714862617_SANEX_VIDEO_higlights%20-%20Copy.mp4?alt=media&token=789f5d47-98cb-4c35-a048-59bf6a4b39a5",
      width: 2000,
      height: 1080,
      link: "/services",
      buttonText: "Our Core Services"
    },
    { 
      title: "Liquid Waste Evacuation & Transport", 
      description: "<p>Professional septic tank emptying, pit latrine draining (kuvidura), and vacuum tanker transportation with rapid dispatch across Kigali.</p>", 
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media&token=d3048d2c-2d02-4fdb-8eaa-f741686a4401",
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
    <section id="slider" className="py-[20px] overflow-hidden relative group font-arial bg-transparent scroll-mt-24">
      <span id="video" className="scroll-mt-24 absolute -top-24 pointer-events-none" />
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-black text-white hover:bg-black/80 gap-2 font-bold text-[16px]">
            <Link href="/admin/content?tab=slider">
              <Edit3 className="h-4 w-4" /> Edit Slider
            </Link>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-16 pt-0 pb-0">
        <Carousel setApi={setCarouselApi} className="w-full relative overflow-visible m-0 p-0" opts={{ loop: true }}>
          <CarouselContent className="m-0">
            {items.map((slide: any, i: number) => (
              <CarouselItem key={i} className="h-full pl-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 rounded-xl overflow-hidden border bg-white shadow-lg items-stretch">
                  <div className="relative w-full aspect-video lg:col-span-3 bg-black border-b lg:border-b-0 lg:border-r border-primary/10 flex items-center justify-center overflow-hidden">
                    {slide.imageUrl && isVideo(slide.imageUrl) ? (
                      <video 
                        src={slide.imageUrl} 
                        controls 
                        playsInline 
                        preload="metadata" 
                        className="w-full h-full object-contain bg-black" 
                      />
                    ) : slide.imageUrl ? (
                      <Image 
                        src={slide.imageUrl} 
                        alt={slide.title || "Slide media"} 
                        fill 
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        className="object-cover" 
                        priority={i === 0} 
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-[16px] uppercase font-bold">
                        Media Pending
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between p-6 lg:p-8 space-y-4 lg:col-span-1 bg-primary text-black">
                    <div className="space-y-3 text-left">
                      <h2 className="text-[18px] lg:text-[20px] font-bold text-black tracking-tight leading-tight">
                        {slide.title}
                      </h2>
                      <div 
                        className="text-black text-[14px] font-normal leading-relaxed prose prose-sm max-w-none prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: slide.description }}
                      />
                    </div>
                    <div className="pt-2 flex flex-wrap gap-x-[5px] gap-y-[15px]">
                      <Button asChild className="w-full rounded-full bg-black text-primary font-bold uppercase tracking-widest hover:bg-black/90 gap-2 h-11 px-6 text-[14px] shadow-sm">
                        <Link href={slide.link || "#"}>
                          {slide.buttonText || "Learn More"} <ArrowRight className="h-4 w-4 text-primary" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 border-primary bg-background text-primary hover:bg-primary hover:text-black z-30" />
          <CarouselNext className="hidden md:flex -right-12 border-primary bg-background text-primary hover:bg-primary hover:text-black z-30" />
        </Carousel>
      </div>
    </section>
  );
}
