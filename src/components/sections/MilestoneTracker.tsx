"use client";

import React from "react";
import { 
  Shield, 
  TrendingUp, 
  Edit3, 
  MapPin 
} from "lucide-react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function MilestoneTracker() {
  const db = useFirestore();
  const { user } = useUser();
  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === "admin";

  const milestonesRef = React.useMemo(() => (db ? doc(db, "settings", "milestones") : null), [db]);
  const { data: milestonesData } = useDoc(milestonesRef);

  const defaultTitle = "Who We Are";
  const defaultDescription = `
    <p><strong>Nganira Company LTD</strong> is a professional waste management and sanitation company operating in Kicukiro, Kigali, Rwanda.</p>
    <p>We specialize in decentralized wastewater treatment, professional septic tank emptying, pit latrine draining (kuvidura), and wastewater transportation. Operating modern vacuum tankers, we transport liquid waste safely to treatment facilities, promoting public health and environmental sustainability.</p>
  `;
  const defaultVision = "To be Rwanda's leading provider of sustainable liquid waste management, fostering cleaner communities across Kigali.";
  const defaultMission = "To deliver dependable, hygienic, and compliant septic evacuation (kuvidura) and decentralized treatment operations.";

  const title = milestonesData?.title || defaultTitle;
  const description = milestonesData?.description || defaultDescription;
  const vision = milestonesData?.vision || defaultVision;
  const mission = milestonesData?.mission || defaultMission;

  return (
    <section className="py-12 lg:py-16 bg-white relative group border-b border-[#d9dadf]">
      {isAdmin && (
        <div className="absolute inset-0 z-20 bg-[#636679]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button asChild className="pointer-events-auto bg-[#636679] text-white hover:bg-[#545667] gap-2 font-bold text-[14px] rounded-xl shadow-lg">
            <Link href="/admin/content?tab=milestones">
              <Edit3 className="h-4 w-4 text-[#006400]" /> Edit Who We Are
            </Link>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Who We Are Header & Story */}
          <div className="space-y-4">
            <h2 className="text-[28px] sm:text-[34px] font-extrabold text-[#26272e] tracking-tight leading-tight">
              {title}
            </h2>

            <div 
              className="text-[15px] sm:text-[16px] text-[#636679] leading-relaxed space-y-4 prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {/* Vision and Mission Cards */}
          {(vision || mission) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
              {vision && (
                <div className="p-6 rounded-2xl bg-[#f6f6f8] border border-[#d9dadf] border-l-4 border-l-[#636679] shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#636679]/10 flex items-center justify-center text-[#636679]">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="text-[17px] font-bold text-[#26272e]">Our Vision</h3>
                  </div>
                  <p className="text-[14px] text-[#636679] leading-relaxed">{vision}</p>
                </div>
              )}

              {mission && (
                <div className="p-6 rounded-2xl bg-[#f6f6f8] border border-[#d9dadf] border-l-4 border-l-[#006400] shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#006400]/10 flex items-center justify-center text-[#006400]">
                      <Shield className="h-4 w-4 text-[#006400]" />
                    </div>
                    <h3 className="text-[17px] font-bold text-[#26272e]">Our Mission</h3>
                  </div>
                  <p className="text-[14px] text-[#636679] leading-relaxed">{mission}</p>
                </div>
              )}
            </div>
          )}

          {/* Summary Badges Bar */}
          <div className="pt-6 mt-6 border-t border-[#d9dadf] text-[13px] text-[#636679] flex flex-wrap items-center justify-between gap-3 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#636679]" /> Kicukiro, Kigali, Rwanda
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
