
"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

export default function ContactPage() {
  const db = useFirestore();
  const { data: generalData } = useDoc(
    React.useMemo(() => (db ? doc(db, "settings", "general") : null), [db])
  );

  const phones: string[] = React.useMemo(() => {
    if (Array.isArray(generalData?.phones) && generalData.phones.length > 0) {
      const valid = generalData.phones.filter((p: any) => typeof p === "string" && p.trim() !== "");
      if (valid.length > 0) return valid;
    }
    return [generalData?.phone || "+250 788 450 120", "+250 788 668 855"];
  }, [generalData]);

  const emails: string[] = React.useMemo(() => {
    if (Array.isArray(generalData?.emails) && generalData.emails.length > 0) {
      const valid = generalData.emails.filter((e: any) => typeof e === "string" && e.trim() !== "");
      if (valid.length > 0) return valid;
    }
    return [generalData?.email || "info@nganila.com"];
  }, [generalData]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-sky-100 border border-sky-200 rounded-full text-xs font-semibold text-sky-800 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified ASSERWA Member · Fleet of 5 Vacuum Tankers</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Contact Nganila Co LTD</h1>
              <p className="text-slate-600 text-sm max-w-xl mx-auto">We're here to solve your liquid waste evacuation, septic tank emptying, and wastewater treatment challenges.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-slate-200/80 shadow-md rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-sky-600 to-sky-700 text-white p-6">
                  <CardTitle className="text-lg font-bold">Contact & Dispatch Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {phones.length > 1 ? "Dispatch Hotline Numbers" : "Phone"}
                      </div>
                      <div className="space-y-1">
                        {phones.map((p, idx) => (
                          <div key={idx}>
                            <a href={`tel:${p.replace(/[^0-9+]/g, '')}`} className="text-base font-bold text-slate-900 hover:text-sky-600 transition-colors block">
                              {p}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {emails.length > 1 ? "Email Addresses" : "Email"}
                      </div>
                      <div className="space-y-1">
                        {emails.map((e, idx) => (
                          <div key={idx}>
                            <a href={`mailto:${e}`} className="text-base font-bold text-slate-900 hover:text-sky-600 transition-colors block break-all">
                              {e}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Office Location</div>
                      <p className="text-base font-bold text-slate-900">Kicukiro, Kigali, Rwanda</p>
                      <p className="text-xs text-sky-700 font-medium mt-0.5">Verified Member of ASSERWA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col justify-center">
                <Card className="border border-sky-200 bg-gradient-to-br from-sky-50/70 to-cyan-50/70 rounded-2xl shadow-md">
                  <CardContent className="p-8 text-center space-y-5">
                    <div className="h-14 w-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-600/20">
                      <Calendar className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">Need an Exhauster Truck?</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Are you looking to book an exhauster truck for a residential property, or do you need a commercial liquid waste management plan? Let us know so we can guide you on the next steps.
                    </p>
                    <div className="pt-2">
                      <Button asChild className="h-11 px-8 text-xs bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-105">
                        <Link href="/book">Schedule an Exhauster <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
