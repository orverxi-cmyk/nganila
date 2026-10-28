"use client";

import React from "react";
import Link from "next/link";
import { Edit3, CheckCircle2, Droplets, Heart, Users, Truck, ShieldCheck, MapPin } from "lucide-react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export function ImpactDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const impactRef = React.useMemo(() => (db ? doc(db, "settings", "impact") : null), [db]);
  const { data: impactData } = useDoc(impactRef);

  const defaultImpacts = [
    { 
      title: "Environmental Preservation", 
      points: [
        "<p>We have successfully treated and managed thousands of cubic meters of liquid waste, preventing harmful pollutants from contaminating natural ecosystems.</p>",
        "<p>Our decentralized wastewater treatment systems (DWTS) have contributed to cleaner water sources, promoting biodiversity and reducing environmental degradation.</p>"
      ]
    },
    { 
      title: "Public Health Improvement", 
      points: [
        "<p>By reducing the risks associated with poor liquid waste management, we have helped to mitigate waterborne diseases, improving the overall health and well-being of the communities we serve.</p>",
        "<p>Our awareness campaigns on waste management have empowered local populations to adopt safer practices, fostering healthier living.</p>"
      ]
    },
    { 
      title: "Job Creation & Community", 
      points: [
        "<p>Nganira Company LTD directly creates employment for professional drivers, sanitation operators, and technical staff in Kigali.</p>",
        "<p>We work closely with local authorities and communities to raise sanitation awareness and prevent unhygienic waste dumping.</p>"
      ]
    }
  ];

  const content = {
    title: impactData?.title || "Our Environmental & Community Impact",
    subtitle: impactData?.subtitle || "Operating from Kicukiro, Kigali, Nganira Company LTD provides responsible sanitation solutions that protect water sources and keep Rwandan communities clean.",
    items: (impactData?.items && impactData.items.length > 0 && impactData.items[0]?.points?.length > 1) 
      ? impactData.items 
      : defaultImpacts
  };

  return (
    <section className="py-14 lg:py-20 bg-gradient-to-b from-white via-[#f6f6f8] to-white relative group overflow-hidden border-t border-[#d9dadf]">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-[14px] rounded-xl shadow-lg">
            <Link href="/admin/content?tab=impact">
              <Edit3 className="h-4 w-4 text-[#d9eaa4]" /> Edit Impact
            </Link>
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-16 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#d9eaa4]/40 text-[#383944] border border-[#d9eaa4]">
            <Droplets className="h-3.5 w-3.5 text-[#636679]" />
            <span>Sustainable Environmental Stewardship</span>
          </div>
          <h2 className="text-[28px] sm:text-[34px] lg:text-[38px] font-extrabold text-[#26272e] tracking-tight leading-tight">
            {content.title}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#636679] leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-[#d9dadf] shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#d9eaa4]/30 border border-[#d9eaa4] flex items-center justify-center text-[#636679] shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-[#26272e]">5 Tankers</div>
              <div className="text-[12px] text-[#636679] font-medium">Dedicated Active Fleet</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#d9dadf] shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#d9eaa4]/30 border border-[#d9eaa4] flex items-center justify-center text-[#636679] shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-[#26272e]">100% Certified</div>
              <div className="text-[12px] text-[#636679] font-medium">Verified ASSERWA Member</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#d9dadf] shadow-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#d9eaa4]/30 border border-[#d9eaa4] flex items-center justify-center text-[#636679] shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-[#26272e]">Kicukiro, Kigali</div>
              <div className="text-[12px] text-[#636679] font-medium">Centralized Strategic Hub</div>
            </div>
          </div>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.items.map((impact: any, i: number) => (
            <div 
              key={i} 
              className="p-8 rounded-3xl bg-white text-slate-800 border border-[#d9dadf] hover:border-[#636679]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-md flex flex-col space-y-4 relative group/card"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[18px] font-bold text-[#26272e] tracking-tight leading-tight">
                  {impact.title}
                </h4>
                <div className="h-8 w-8 rounded-lg bg-[#d9eaa4]/30 flex items-center justify-center text-[#636679] shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              
              <div className="space-y-3">
                {impact.points?.map((point: string, pi: number) => (
                  <div 
                    key={pi} 
                    className="text-[14px] text-[#636679] leading-relaxed font-normal" 
                    dangerouslySetInnerHTML={{ __html: point.startsWith('<p>') ? point : `<p>${point}</p>` }} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
