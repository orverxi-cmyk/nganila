"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Services } from "@/components/sections/Services";
import { RegionalPortal } from "@/components/sections/RegionalPortal";
import { Highlights } from "@/components/sections/Highlights";
import { VideoHighlight } from "@/components/sections/VideoHighlight";
import { Hero } from "@/components/sections/Hero";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

export function ServicesClient() {
  const db = useFirestore();
  const servicesRef = React.useMemo(() => (db ? doc(db, "settings", "services") : null), [db]);
  const { data: servicesData } = useDoc(servicesRef);

  const title = servicesData?.title || "Our Sanitation Solutions";
  const subtitle = servicesData?.subtitle || "";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        {(title || subtitle) && (
          <div className="bg-gradient-to-r from-[#636679] via-[#454755] to-[#26272e] py-10 border-b border-[#545667]">
            <div className="container mx-auto px-4 md:px-16 text-center">
              {title && <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{title}</h1>}
              {subtitle && (
                <p className="mt-3 text-slate-200 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <Hero />
        <Services />
        <VideoHighlight />
        
        <div className="bg-[#f6f6f8] py-14 border-t border-[#d9dadf]">
          <div className="container mx-auto px-4 md:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <RegionalPortal />
              <Highlights />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
