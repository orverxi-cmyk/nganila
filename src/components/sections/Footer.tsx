
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Linkedin, Twitter, Facebook, Instagram, Mail, Phone, MapPin, MessageCircle, Youtube, Calendar } from "lucide-react";
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
  const navLinks = generalData?.navLinks || [
    { name: "About Us", href: "/about" },
    { name: "Solutions", href: "/services" },
    { name: "Impact", href: "/articles" },
    { name: "Publications", href: "/publications" },
    { name: "Contact", href: "/contact" },
  ];

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
    <footer id="contact" className="bg-black text-white py-5">
      <div className="container mx-auto px-4 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 text-center md:text-left">
          <div className="space-y-4">
            <h4 className="text-[16px] font-bold uppercase tracking-wider text-primary">Links</h4>
            <ul className="space-y-2 text-[14px] font-normal">
              {navLinks.map((link: any) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[16px] font-bold uppercase tracking-wider text-primary">Services</h4>
            <ul className="space-y-2 text-[14px] font-normal text-white/70">
              <li>Liquid Waste Evacuation</li>
              <li>Wastewater Transportation</li>
              <li>Decentralized Wastewater Treatment</li>
              <li>Verified ASSERWA Member</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[16px] font-bold uppercase tracking-wider text-primary">Contact</h4>
            <ul className="space-y-2 text-[14px] font-normal text-white/70">
              <li className="flex gap-2 justify-center md:justify-start items-center">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> Kicukiro, Kigali, Rwanda
              </li>
              {phones.map((phoneItem, idx) => (
                <li key={`phone-${idx}`} className="flex gap-2 justify-center md:justify-start items-center">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <a href={`tel:${phoneItem.replace(/[^0-9+]/g, '')}`} className="hover:text-primary transition-colors">{phoneItem}</a>
                </li>
              ))}
              {emails.map((emailItem, idx) => (
                <li key={`email-${idx}`} className="flex gap-2 justify-center md:justify-start items-center">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <a href={`mailto:${emailItem}`} className="hover:text-primary transition-colors break-all">{emailItem}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[16px] font-bold uppercase tracking-wider text-primary">Newsletter</h4>
            <p className="text-[14px] text-white/70">
              Subscribe to get the latest news and updates directly to your inbox.
            </p>
            <div className="flex flex-col gap-2 items-center md:items-start">
              <a
                href="https://eepurl.com/2gm-Vewnrw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-primary text-black font-semibold px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
              >
                Subscribe to Newsletter
              </a>
              <Link
                href="/publications"
                className="text-xs text-primary/80 hover:text-primary transition-colors underline"
              >
                Browse Sent Newsletters &rarr;
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[14px] font-normal text-white/50">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© {new Date().getFullYear()}. Nganila Co LTD. All rights reserved.</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <Link href="/privacy" className="hover:text-primary transition-colors text-white/70 underline sm:no-underline">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-white/30">•</span>
            <Link href="/terms" className="hover:text-primary transition-colors text-white/70 underline sm:no-underline">
              Terms of Service
            </Link>
          </div>
          <div className="flex gap-3">
            {socials.twitter && (
              <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-all text-white" title="Twitter / X">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {socials.linkedin && (
              <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-all text-white" title="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-all text-white" title="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-all text-white" title="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {socials.whatsapp && (
              <a href={socials.whatsapp.startsWith('http') ? socials.whatsapp : `https://wa.me/${socials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-all text-white" title="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {socials.youtube && (
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-all text-white" title="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isNewsletterModalOpen} onOpenChange={setIsNewsletterModalOpen}>
        <DialogContent className="bg-zinc-950 text-white border-zinc-800 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Complete Newsletter Subscription
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Please enter your details to complete subscribing to the SANEX newsletter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubscribe} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Email Address *</label>
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">First Name</label>
                <input
                  type="text"
                  value={newsletterFirstName}
                  onChange={(e) => setNewsletterFirstName(e.target.value)}
                  placeholder="First Name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">Last Name</label>
                <input
                  type="text"
                  value={newsletterLastName}
                  onChange={(e) => setNewsletterLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Address</label>
              <input
                type="text"
                value={newsletterAddress}
                onChange={(e) => setNewsletterAddress(e.target.value)}
                placeholder="e.g. Kigali, Rwanda"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Phone Number</label>
              <input
                type="tel"
                value={newsletterPhone}
                onChange={(e) => setNewsletterPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {newsletterMessage && (
              <div className={`p-3 rounded-md text-xs border ${
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
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                className="bg-primary text-black font-semibold px-5 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
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
            aria-label="Book a Service"
            className="md:hidden pointer-events-auto flex flex-col items-center gap-2 bg-black text-primary border border-primary/50 font-bold px-2 py-3 rounded-l-md shadow-2xl hover:bg-black/90 transition-all group"
          >
            <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold tracking-widest uppercase">Book Service</span>
            <Calendar className="h-4 w-4 shrink-0 -rotate-90 transition-transform group-hover:scale-110" />
          </Link>
        )}
        <a
          href="https://eepurl.com/2gm-Vewnrw"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Subscribe to Newsletter"
          className="pointer-events-auto flex flex-col items-center gap-2 bg-primary text-black font-bold px-2 py-3.5 rounded-l-md shadow-2xl hover:bg-primary/90 transition-all group"
        >
          <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold tracking-widest uppercase">Subscribe</span>
          <Mail className="h-4 w-4 shrink-0 -rotate-90 transition-transform group-hover:scale-110" />
        </a>
      </div>
    </footer>
  );
}

