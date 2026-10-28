
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-muted/10 py-5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-5">
              <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-4">Get in Touch</h1>
              <p className="text-muted-foreground">We're here to solve your liquid waste management challenges.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-primary text-black">
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {phones.length > 1 ? "Phone Numbers" : "Phone"}
                      </div>
                      <div className="space-y-1">
                        {phones.map((p, idx) => (
                          <div key={idx}>
                            <a href={`tel:${p.replace(/[^0-9+]/g, '')}`} className="text-lg font-bold hover:text-primary transition-colors block">
                              {p}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {emails.length > 1 ? "Email Addresses" : "Email"}
                      </div>
                      <div className="space-y-1">
                        {emails.map((e, idx) => (
                          <div key={idx}>
                            <a href={`mailto:${e}`} className="text-lg font-bold hover:text-primary transition-colors block break-all">
                              {e}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Office</div>
                      <p className="text-lg font-bold">Kicukiro, Kigali, Rwanda</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Verified Member of ASSERWA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col justify-center space-y-5">
                <Card className="border-primary border-2 bg-primary/5">
                  <CardContent className="p-8 text-center space-y-5">
                    <Calendar className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="text-2xl font-bold font-headline">Need an Exhauster Truck?</h3>
                    <p className="text-muted-foreground">
                      Are you looking to book an exhauster truck for a residential property, or do you need a commercial liquid waste management plan? Let us know so we can guide you on the next steps.
                    </p>
                    <div className="flex flex-wrap gap-x-[5px] gap-y-[20px] justify-center">
                      <Button asChild className="h-12 px-8 text-lg bg-primary text-black font-bold uppercase tracking-widest rounded-full">
                        <Link href="/book">Schedule Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
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
