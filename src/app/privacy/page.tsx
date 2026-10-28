"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Phone, Mail, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 py-10 border-b border-sky-900/30">
        <div className="container mx-auto px-4 md:px-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/80 border border-sky-500/30 rounded-full text-xs font-semibold text-sky-400 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Verified ASSERWA Member · Client Data Protection</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Privacy & Data Usage Policy
          </h1>
          <p className="mt-2 text-sky-100/80 max-w-2xl mx-auto text-sm leading-relaxed">
            How Nganila Co LTD protects and responsibly handles your shared contact and service information.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="border border-slate-200/80 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl font-bold text-slate-900">
                    Use of Shared Contact Information
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Last updated: {new Date().getFullYear()} • Nganila Co LTD (Kicukiro, Kigali, Rwanda)
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
              {/* Paragraph 1 */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-sky-600" /> Purpose of Data Collection
                </h2>
                <p className="text-slate-600">
                  At Nganila Co LTD, we value your privacy and are committed to transparency in how your personal data is handled. When you submit a service request through our website or booking portal, we collect contact information including your full name, phone number, email address, physical location, and service requirements. This shared contact information is collected for the sole purpose of contacting you—the service requester—to confirm appointment details, schedule liquid waste evacuation or decentralized sanitation services, communicate operational status updates, and dispatch our vacuum tanker fleet directly to your site.
                </p>
              </div>

              {/* Paragraph 2 */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-600" /> Strict Confidentiality & No Third-Party Sharing
                </h2>
                <p className="text-slate-600">
                  We treat your information with the highest standard of care and confidentiality. Your shared contact details will never be sold, rented, leased, or disclosed to third-party advertisers or external organizations for promotional purposes. The data remains strictly internal to Nganila Co LTD and is utilized exclusively as necessary to fulfill your requested sanitation operations, coordinate logistical routing, ensure service excellence, and provide direct client support.
                </p>
              </div>

              {/* Key Commitments Box */}
              <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900">Our Privacy Commitments</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-900">Service Requester Contact:</strong> Contact numbers and emails are used solely to confirm and manage your service request.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-900">Safe Location Routing:</strong> Location coordinates or maps links are accessed only by dispatch drivers to locate your premises.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-900">Zero Commercial Marketing:</strong> We never sell or share client contact directories with third parties.</span>
                  </div>
                </div>
              </div>

              {/* Contact and Next Steps */}
              <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 text-center sm:text-left">
                  Have questions about our privacy practices?{" "}
                  <Link href="/contact" className="font-bold text-sky-600 underline hover:text-sky-700 transition-colors">
                    Contact our support team
                  </Link>.
                </div>
                <Button asChild className="h-10 px-5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-xl shadow-md shadow-sky-500/20 shrink-0">
                  <Link href="/book">
                    Book an Exhauster <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
