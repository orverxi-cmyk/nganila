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
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-[#636679] via-[#454755] to-[#26272e] py-10 border-b border-[#545667]">
          <div className="container mx-auto px-4 md:px-16 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#d9eaa4]/20 border border-[#d9eaa4]/40 rounded-full text-xs font-semibold text-[#d9eaa4] mb-3">
              <span className="h-2 w-2 rounded-full bg-[#d9eaa4] animate-pulse" />
              <span>Fleet of 5 Vacuum Tankers · Verified ASSERWA Member</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Our Sanitation Solutions</h1>
            <p className="mt-3 text-slate-200 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Professional, eco-friendly, and compliant liquid waste evacuation, decentralized wastewater treatment, and vacuum tanker transportation across Rwanda.
            </p>
          </div>
        </div>
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
