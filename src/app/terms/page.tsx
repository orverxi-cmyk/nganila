"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, ArrowRight, Scale, Clock, MapPin } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f6f6f8]">
      <Navbar />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#636679] via-[#454755] to-[#26272e] py-10 border-b border-[#545667]">
        <div className="container mx-auto px-4 md:px-16 text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-slate-200 max-w-2xl mx-auto text-sm leading-relaxed">
            Guidelines and operational conditions governing liquid waste evacuation and wastewater management services by Nganira Company LTD.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="border border-[#d9dadf] bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-[#f6f6f8] p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#006400]/10 border border-[#006400]/30 flex items-center justify-center text-[#006400] shrink-0">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl font-bold text-[#26272e]">
                    Service Agreement & Terms
                  </CardTitle>
                  <p className="text-xs text-[#636679] mt-0.5">
                    Effective date: {new Date().getFullYear()} • Nganira Company LTD (Kicukiro, Kigali, Rwanda)
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-6 text-sm text-[#383944] leading-relaxed">
              {/* Introduction */}
              <div>
                <p className="text-[#636679]">
                  Welcome to Nganira Company LTD. These Terms of Service outline the operational agreement between you (the &quot;Service Requester&quot; or &quot;Client&quot;) and Nganira Company LTD (&quot;Nganira&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) regarding the provision of liquid waste collection, septic tank emptying, pit latrine draining (kuvidura), wastewater transportation with our modern vacuum tankers, Decentralized Wastewater Treatment Systems (DWTS) management, and environmental sanitation solutions.
                </p>
              </div>

              {/* 1. Scope of Services */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#26272e] mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#636679]" /> 1. Scope of Services
                </h2>
                <p className="text-[#636679]">
                  Nganira provides professional liquid waste evacuation, desludging, pit latrine draining (kuvidura), vacuum tanker transportation, and DWTS management across Kigali and throughout Rwanda. Every service request submitted via our digital portal or phone line constitutes a preliminary request subject to operational feasibility, physical site accessibility, and dispatch confirmation.
                </p>
              </div>

              {/* 2. Service Requests & Site Accessibility */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#26272e] mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#636679]" /> 2. Booking Accuracy & Site Access
                </h2>
                <p className="text-[#636679]">
                  When submitting a request, you agree to provide accurate contact details, service descriptions, and location pins or directions. The client is responsible for ensuring clear, safe access to the premises and septic infrastructure for Nganira vacuum tankers and technicians during scheduled appointment windows.
                </p>
              </div>

              {/* 3. Safety, Environmental Compliance & ASSERWA Standards */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#26272e] mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#636679]" /> 3. Environmental Standards & ASSERWA Compliance
                </h2>
                <p className="text-[#636679]">
                  As a verified member of ASSERWA (the Forum of Sewage Emptiers in Rwanda), all waste collected by Nganira is transported and discharged exclusively at legally authorized treatment facilities in strict compliance with Rwanda Utilities Regulatory Authority (RURA) standards and Rwanda Environment Management Authority (REMA) directives.
                </p>
              </div>

              {/* 4. Scheduling, Rescheduling & Cancellations */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#26272e] mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#636679]" /> 4. Scheduling & Cancellations
                </h2>
                <p className="text-[#636679]">
                  Appointments are confirmed by our dispatch team via phone or email based on vehicle availability and route optimization. If you need to reschedule or cancel a service request, please notify Nganira at least 12 hours prior to the scheduled service time.
                </p>
              </div>

              {/* 5. Privacy & Data Handling */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#26272e] mb-2 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#636679]" /> 5. Data Privacy
                </h2>
                <p className="text-[#636679]">
                  Your shared contact information is handled in accordance with our{" "}
                  <Link href="/privacy" className="font-bold text-[#26272e] underline hover:text-[#636679] transition-colors">
                    Privacy Policy
                  </Link>. It is used solely to contact you regarding service execution, scheduling, status notifications, and customer support.
                </p>
              </div>

              {/* Quick Summary Highlights Box */}
              <div className="bg-[#f6f6f8] border border-[#d9dadf] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#26272e]">Client Responsibilities Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#636679] shrink-0 mt-0.5" />
                    <span><strong className="text-[#26272e]">Clear Access:</strong> Ensure unobstructed vehicle access to septic tanks and wastewater facilities for vacuum tankers.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#636679] shrink-0 mt-0.5" />
                    <span><strong className="text-[#26272e]">Contact Availability:</strong> Be reachable on the phone number provided (+250 788 450 120 / +250 788 668 855) for dispatch arrival coordination.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#636679] shrink-0 mt-0.5" />
                    <span><strong className="text-[#26272e]">Prompt Notice:</strong> Advise our team in advance of any specific site hazards or road conditions.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#636679] text-center sm:text-left">
                  Have inquiries about our terms or services?{" "}
                  <Link href="/contact" className="font-bold text-[#26272e] underline hover:text-[#636679] transition-colors">
                    Contact us
                  </Link>.
                </div>
                <Button asChild className="h-10 px-5 text-xs font-bold uppercase tracking-wider bg-[#006400] hover:bg-[#005000] text-white rounded-xl shadow-md border border-[#006400] shrink-0 transition-all hover:scale-105">
                  <Link href="/book">
                    Book a Service <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
