"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Services } from "@/components/sections/Services";
import { RegionalPortal } from "@/components/sections/RegionalPortal";
import { Highlights } from "@/components/sections/Highlights";
import { VideoHighlight } from "@/components/sections/VideoHighlight";
import { Hero } from "@/components/sections/Hero";

export function ServicesClient() {
  return (
    <div className="min-h-screen flex flex-col font-arial">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-primary py-2.5">
          <div className="container mx-auto px-4 md:px-16 text-center">
            <h1 className="text-[16px] font-bold text-black uppercase tracking-widest">Our Solutions</h1>
            <p className="mt-1 text-black/80 max-w-2xl mx-auto font-bold text-[15px]">
              Professional, eco-friendly, and nationwide liquid waste management services.
            </p>
          </div>
        </div>
        <Hero />
        <Services />
        <VideoHighlight />
        
        <div className="bg-muted/30 py-10 border-t">
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
