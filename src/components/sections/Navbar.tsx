"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Droplets, Menu, X, Calendar, Globe, Phone, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { UserNav } from "./UserNav";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  isAdmin?: boolean;
}

export function Navbar({ isAdmin }: NavbarProps = {}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const isAdminPage = isAdmin !== undefined ? isAdmin : (pathname ? pathname.startsWith("/admin") : false);
  const { user } = useUser();
  const db = useFirestore();

  // Scroll-aware shrink effect
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const generalRef = React.useMemo(() => (db ? doc(db, "settings", "general") : null), [db]);
  const { data: generalData } = useDoc(generalRef);

  const defaultNavLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Articles", href: "/articles" },
    { name: "Publications", href: "/publications" },
    { name: "Gallery", href: "/gallery" },
    { name: "Contact", href: "/contact" },
  ];

  const navLinks = Array.isArray(generalData?.navLinks) ? generalData.navLinks : defaultNavLinks;

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

  const locationText = generalData?.address || generalData?.location || "Kicukiro, Kigali, Rwanda";

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Utility Bar for Public Website */}
      {!isAdminPage && (
        <div className="bg-[#636679] text-white/95 text-[12px] border-b border-[#545667] transition-all duration-300">
          <div className="container mx-auto px-4 md:px-16 py-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-white/90">
                <MapPin className="h-3.5 w-3.5 text-[#d9eaa4] shrink-0" />
                <span>{locationText}</span>
              </span>
              <span className="hidden sm:inline-block text-white/40">•</span>
              <span className="inline-flex items-center gap-1.5 text-[#d9eaa4] font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-[#d9eaa4] shrink-0" />
                <span>Verified ASSERWA Member</span>
              </span>
              <span className="hidden md:inline-block text-white/40">•</span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-white/80">
                <Truck className="h-3.5 w-3.5 text-[#d9eaa4] shrink-0" />
                <span>Fleet of 5 Vacuum Tankers</span>
              </span>
            </div>

            {phones.length > 0 && (
              <div className="flex items-center gap-4">
                <a 
                  href={`tel:${phones[0].replace(/[^0-9+]/g, '')}`} 
                  className="inline-flex items-center gap-1.5 text-[#d9eaa4] hover:text-white transition-colors font-semibold"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{phones[0]}</span>
                </a>
                {phones[1] && (
                  <>
                    <span className="text-white/40 hidden sm:inline">|</span>
                    <a 
                      href={`tel:${phones[1].replace(/[^0-9+]/g, '')}`} 
                      className="hidden sm:inline-flex items-center gap-1.5 text-white/90 hover:text-[#d9eaa4] transition-colors"
                    >
                      <span>{phones[1]}</span>
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "w-full bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-slate-100",
          scrolled
            ? "shadow-[0_8px_30px_rgba(99,102,121,0.12)] py-2.5"
            : "shadow-[0_2px_15px_rgba(0,0,0,0.03)] py-4"
        )}
      >
        <div className={isAdminPage ? "w-full px-4 lg:px-8" : "container mx-auto px-4 md:px-16"}>
          <div className="flex items-center justify-between">
            {/* Logo + Brand Name */}
            <Link href={isAdminPage ? "/admin" : "/"} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#636679] text-[#d9eaa4] shadow-md shadow-[#636679]/20 border border-[#d9eaa4]/30 shrink-0">
                <Droplets className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[17px] tracking-tight text-[#636679]">
                    NGANIRA
                  </span>
                  <span className="font-bold text-[13px] tracking-wider text-[#636679]/90 uppercase">
                    COMPANY LTD
                  </span>
                  {isAdminPage && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d9eaa4]/50 text-[#383944] border border-[#d9eaa4]">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#636679]/70 font-medium -mt-0.5">
                  Waste Management &amp; Sanitation · Kigali
                </span>
              </div>
            </Link>

            {isAdminPage ? (
              /* Admin Portal Header */
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className="bg-[#636679] hover:bg-[#545667] text-white font-bold uppercase tracking-wider text-[12px] h-10 px-4 md:px-5 gap-2 rounded-xl shadow-sm"
                >
                  <Link href="/">
                    <Globe className="h-4 w-4 text-[#d9eaa4]" />
                    <span className="hidden sm:inline">Go to </span>
                    <span>Public Portal</span>
                  </Link>
                </Button>
                <UserNav />
              </div>
            ) : (
              /* Public Website Header */
              <>
                {/* Desktop nav */}
                <div className="hidden lg:flex items-center gap-1">
                  {navLinks.map((link: any) => {
                    const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                          "relative px-3.5 py-2 text-[13px] font-semibold tracking-wide transition-all rounded-lg",
                          isActive
                            ? "text-[#383944] bg-[#d9eaa4]/40 font-bold border border-[#d9eaa4]/80 shadow-xs"
                            : "text-[#636679] hover:text-[#383944] hover:bg-[#d9eaa4]/20"
                        )}
                      >
                        {link.name}
                      </Link>
                    );
                  })}

                  <div className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-200">
                    <UserNav />
                    <Button 
                      asChild 
                      className="bg-[#d9eaa4] hover:bg-[#cbe090] text-[#26272e] font-bold uppercase tracking-wider h-10 px-5 text-[12px] gap-2 rounded-xl shadow-md shadow-[#d9eaa4]/30 border border-[#cbe090] transition-all hover:scale-105"
                    >
                      <Link href="/book">
                        <Calendar className="h-4 w-4" /> Book an Exhauster
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Mobile controls */}
                <div className="flex items-center gap-3 lg:hidden">
                  <UserNav />
                  <button
                    className="p-2 text-[#636679] rounded-lg hover:bg-[#d9eaa4]/30 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                  >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {!isAdminPage && isOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-xl animate-in slide-in-from-top duration-200">
            <div className="flex flex-col p-5 gap-1.5">
              {navLinks.map((link: any) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors",
                      isActive
                        ? "text-[#383944] bg-[#d9eaa4]/40 font-bold border border-[#d9eaa4]/80"
                        : "text-[#636679] hover:text-[#383944] hover:bg-[#d9eaa4]/20"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-3 mt-1 border-t border-slate-100">
                <Button asChild className="w-full bg-[#d9eaa4] hover:bg-[#cbe090] text-[#26272e] font-bold h-11 text-[13px] uppercase tracking-wider gap-2 rounded-xl shadow-md border border-[#cbe090]">
                  <Link href="/book" onClick={() => setIsOpen(false)}>
                    <Calendar className="h-4 w-4" /> Book an Exhauster
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
