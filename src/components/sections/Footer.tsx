"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Linkedin, Twitter, Facebook, Instagram, Mail, Phone, MapPin, MessageCircle, Youtube, Calendar, Droplets } from "lucide-react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Footer() {
  const pathname = usePathname();
  const db = useFirestore();
  const { data: generalData } = useDoc(React.useMemo(() => (db ? doc(db, "settings", "general") : null), [db]));
  const { data: servicesData } = useDoc(React.useMemo(() => (db ? doc(db, "settings", "services") : null), [db]));

  const siteName = generalData?.siteName || "Nganira Company LTD";
  const siteDescription = generalData?.description || generalData?.tagline || "";

  const phones: string[] = React.useMemo(() => {
    if (Array.isArray(generalData?.phones) && generalData.phones.length > 0) {
      const valid = generalData.phones.filter((p: any) => typeof p === "string" && p.trim() !== "");
      if (valid.length > 0) return valid;
    }
    if (typeof generalData?.phone === "string" && generalData.phone.trim()) {
      return [generalData.phone.trim()];
    }
    return [];
  }, [generalData]);

  const emails: string[] = React.useMemo(() => {
    if (Array.isArray(generalData?.emails) && generalData.emails.length > 0) {
      const valid = generalData.emails.filter((e: any) => typeof e === "string" && e.trim() !== "");
      if (valid.length > 0) return valid;
    }
    if (typeof generalData?.email === "string" && generalData.email.trim()) {
      return [generalData.email.trim()];
    }
    return [];
  }, [generalData]);

  const navLinks = Array.isArray(generalData?.navLinks) ? generalData.navLinks : [];
  const servicesList: any[] = Array.isArray(servicesData?.items) ? servicesData.items : [];

  const socials = generalData?.socials || {};

  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterFirstName, setNewsletterFirstName] = React.useState("");
  const [newsletterLastName, setNewsletterLastName] = React.useState("");
  const [newsletterAddress, setNewsletterAddress] = React.useState("");
  const [newsletterPhone, setNewsletterPhone] = React.useState("");
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = React.useState(false);
  const [newsletterStatus, setNewsletterStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = React.useState("");

  const handleOpenModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterStatus("error");
      setNewsletterMessage("Please enter a valid email address.");
      return;
    }
    setNewsletterStatus("idle");
    setNewsletterMessage("");
    setIsNewsletterModalOpen(true);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus("loading");
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          firstName: newsletterFirstName,
          lastName: newsletterLastName,
          address: newsletterAddress,
          phone: newsletterPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 200) {
        throw new Error(data.error || "Failed to subscribe");
      }
      setNewsletterStatus("success");
      setNewsletterMessage(data.message || "Subscribed successfully!");
      setTimeout(() => {
        setNewsletterEmail("");
        setNewsletterFirstName("");
        setNewsletterLastName("");
        setNewsletterAddress("");
        setNewsletterPhone("");
        setIsNewsletterModalOpen(false);
        setNewsletterStatus("idle");
        setNewsletterMessage("");
      }, 2500);
    } catch (err: any) {
      setNewsletterStatus("error");
      setNewsletterMessage(err.message || "Failed to subscribe");
    }
  };

  return (
    <footer id="contact" className="bg-[#26272e] text-slate-100 pt-14 pb-8 border-t border-[#454755] relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#636679]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#d9eaa4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-left">
          
          {/* Brand & ASSERWA Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#636679] text-[#d9eaa4] border border-[#d9eaa4]/40 flex items-center justify-center shadow-md shadow-[#636679]/30 shrink-0">
                <Droplets className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">{siteName}</span>
                <span className="text-[11px] text-[#d9eaa4] font-semibold tracking-wider uppercase block">Sanitation & Liquid Waste</span>
              </div>
            </div>

            {siteDescription && (
              <p className="text-xs text-[#bcbec8] leading-relaxed">
                {siteDescription}
              </p>
            )}

            <div className="p-3 rounded-xl bg-[#383944] border border-[#545667] text-xs space-y-1">
              <div className="flex items-center gap-2 text-[#d9eaa4] font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#d9eaa4] animate-pulse" />
                <span>Verified ASSERWA Member</span>
              </div>
              <p className="text-[11px] text-[#bcbec8]">
                Forum of Sewage Emptiers in Rwanda
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d9eaa4]">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {navLinks.map((link: any) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[#bcbec8] hover:text-[#d9eaa4] transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 rounded-full bg-[#636679] group-hover:bg-[#d9eaa4] transition-colors" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/book" className="text-[#d9eaa4] hover:text-white transition-colors flex items-center gap-2 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d9eaa4]" />
                  <span>Book an Exhauster Truck</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Services from Firestore */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d9eaa4]">Core Services</h4>
            <ul className="space-y-2.5 text-xs text-[#bcbec8]">
              {servicesList.length > 0 ? (
                servicesList.map((srv: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#d9eaa4] mt-0.5">•</span>
                    <span>{srv.title}</span>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/services" className="text-[#bcbec8] hover:text-[#d9eaa4] transition-colors">
                    Explore Our Solutions &rarr;
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Dispatch & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d9eaa4]">Dispatch & Contact</h4>
            <ul className="space-y-3 text-xs text-[#bcbec8]">
              <li className="flex gap-2.5 items-start">
                <MapPin className="h-4 w-4 text-[#d9eaa4] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Strategic Operating Hub</div>
                  <div className="text-[#bcbec8] text-[11px]">Kicukiro, Kigali, Rwanda</div>
                </div>
              </li>
              {phones.map((phoneItem, idx) => (
                <li key={`phone-${idx}`} className="flex gap-2.5 items-center">
                  <Phone className="h-4 w-4 text-[#d9eaa4] shrink-0" />
                  <a href={`tel:${phoneItem.replace(/[^0-9+]/g, '')}`} className="font-semibold text-white hover:text-[#d9eaa4] transition-colors">{phoneItem}</a>
                </li>
              ))}
              {emails.map((emailItem, idx) => (
                <li key={`email-${idx}`} className="flex gap-2.5 items-center">
                  <Mail className="h-4 w-4 text-[#d9eaa4] shrink-0" />
                  <a href={`mailto:${emailItem}`} className="text-[#bcbec8] hover:text-[#d9eaa4] transition-colors break-all">{emailItem}</a>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <a
                href="https://eepurl.com/2gm-Vewnrw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full bg-[#d9eaa4] hover:bg-[#cbe090] text-[#26272e] font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-[#d9eaa4]/20"
              >
                Subscribe to Updates
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-[#454755] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#bcbec8]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Nganira Company LTD. All rights reserved.</span>
            <span className="hidden sm:inline text-[#545667]">•</span>
            <span className="text-[#bcbec8]">Verified ASSERWA Member</span>
            <span className="hidden sm:inline text-[#545667]">•</span>
            <Link href="/privacy" className="hover:text-[#d9eaa4] transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-[#545667]">•</span>
            <Link href="/terms" className="hover:text-[#d9eaa4] transition-colors">
              Terms of Service
            </Link>
          </div>
          <div className="flex gap-2.5">
            {socials.twitter && (
              <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#383944] border border-[#545667] flex items-center justify-center hover:bg-[#d9eaa4] hover:text-[#26272e] transition-all text-slate-300" title="Twitter / X">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {socials.linkedin && (
              <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#383944] border border-[#545667] flex items-center justify-center hover:bg-[#d9eaa4] hover:text-[#26272e] transition-all text-slate-300" title="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#383944] border border-[#545667] flex items-center justify-center hover:bg-[#d9eaa4] hover:text-[#26272e] transition-all text-slate-300" title="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#383944] border border-[#545667] flex items-center justify-center hover:bg-[#d9eaa4] hover:text-[#26272e] transition-all text-slate-300" title="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {socials.whatsapp && (
              <a href={socials.whatsapp.startsWith('http') ? socials.whatsapp : `https://wa.me/${socials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#383944] border border-[#545667] flex items-center justify-center hover:bg-[#d9eaa4] hover:text-[#26272e] transition-all text-slate-300" title="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {socials.youtube && (
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-[#383944] border border-[#545667] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-slate-300" title="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isNewsletterModalOpen} onOpenChange={setIsNewsletterModalOpen}>
        <DialogContent className="bg-[#26272e] text-white border-[#545667] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#d9eaa4]" />
              Subscribe to Nganira Updates
            </DialogTitle>
            <DialogDescription className="text-[#bcbec8] text-sm">
              Please enter your details to receive updates and sanitation insights from Nganira Company LTD.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubscribe} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs text-[#bcbec8] font-medium">Email Address *</label>
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-[#383944] border border-[#545667] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9698a7] focus:outline-none focus:border-[#d9eaa4] focus:ring-1 focus:ring-[#d9eaa4]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[#bcbec8] font-medium">First Name</label>
                <input
                  type="text"
                  value={newsletterFirstName}
                  onChange={(e) => setNewsletterFirstName(e.target.value)}
                  placeholder="First Name"
                  className="w-full bg-[#383944] border border-[#545667] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9698a7] focus:outline-none focus:border-[#d9eaa4] focus:ring-1 focus:ring-[#d9eaa4]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#bcbec8] font-medium">Last Name</label>
                <input
                  type="text"
                  value={newsletterLastName}
                  onChange={(e) => setNewsletterLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full bg-[#383944] border border-[#545667] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9698a7] focus:outline-none focus:border-[#d9eaa4] focus:ring-1 focus:ring-[#d9eaa4]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#bcbec8] font-medium">Address</label>
              <input
                type="text"
                value={newsletterAddress}
                onChange={(e) => setNewsletterAddress(e.target.value)}
                placeholder="e.g. Kicukiro, Kigali"
                className="w-full bg-[#383944] border border-[#545667] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9698a7] focus:outline-none focus:border-[#d9eaa4] focus:ring-1 focus:ring-[#d9eaa4]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#bcbec8] font-medium">Phone Number</label>
              <input
                type="tel"
                value={newsletterPhone}
                onChange={(e) => setNewsletterPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-[#383944] border border-[#545667] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9698a7] focus:outline-none focus:border-[#d9eaa4] focus:ring-1 focus:ring-[#d9eaa4]"
              />
            </div>

            {newsletterMessage && (
              <div className={`p-3 rounded-lg text-xs border ${
                newsletterStatus === "success" 
                  ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50" 
                  : "bg-red-950/50 text-red-400 border-red-800/50"
              }`}>
                {newsletterMessage}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewsletterModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#bcbec8] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                className="bg-[#d9eaa4] hover:bg-[#cbe090] text-[#26272e] font-bold px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
              >
                {newsletterStatus === "loading" ? "Subscribing..." : newsletterStatus === "success" ? "Subscribed!" : "Confirm Subscription"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
        {pathname !== "/book" && (
          <Link
            href="/book"
            aria-label="Book an Exhauster"
            className="md:hidden pointer-events-auto flex flex-col items-center gap-2 bg-[#636679] text-[#d9eaa4] border border-[#d9eaa4]/40 font-bold px-2.5 py-3 rounded-l-xl shadow-2xl hover:bg-[#545667] transition-all group"
          >
            <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold tracking-widest uppercase">Book Truck</span>
            <Calendar className="h-4 w-4 shrink-0 -rotate-90 transition-transform group-hover:scale-110" />
          </Link>
        )}
        <a
          href="https://eepurl.com/2gm-Vewnrw"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Subscribe to Updates"
          className="pointer-events-auto flex flex-col items-center gap-2 bg-[#d9eaa4] text-[#26272e] font-bold px-2.5 py-3.5 rounded-l-xl shadow-2xl hover:bg-[#cbe090] transition-all group"
        >
          <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold tracking-widest uppercase">Subscribe</span>
          <Mail className="h-4 w-4 shrink-0 -rotate-90 transition-transform group-hover:scale-110" />
        </a>
      </div>
    </footer>
  );
}
