
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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

  const navLinks = generalData?.navLinks?.length ? generalData.navLinks : defaultNavLinks;
  const siteName = generalData?.siteName || "Nganila Co LTD";
  const logoUrl = generalData?.logoUrl;
  const logoWidth = generalData?.logoWidth || 160;
  const logoHeight = generalData?.logoHeight || 40;
  const logoSpacing = generalData?.logoSpacing ?? 8;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Utility Bar for Public Website */}
      {!isAdminPage && (
        <div className="bg-slate-900 text-slate-300 text-[12px] border-b border-slate-800 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-16 py-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Kicukiro, Kigali, Rwanda</span>
              </span>
              <span className="hidden sm:inline-block text-slate-700">•</span>
              <span className="inline-flex items-center gap-1.5 text-sky-300 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Verified ASSERWA Member</span>
              </span>
              <span className="hidden md:inline-block text-slate-700">•</span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400">
                <Truck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Fleet of 5 Vacuum Tankers</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a 
                href="tel:+250788450120" 
                className="inline-flex items-center gap-1.5 text-sky-400 hover:text-white transition-colors font-semibold"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>+250 788 450 120</span>
              </a>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <a 
                href="tel:+250788668855" 
                className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <span>+250 788 668 855</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "w-full bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-slate-100",
          scrolled
            ? "shadow-[0_8px_30px_rgba(2,132,199,0.08)] py-2.5"
            : "shadow-[0_2px_15px_rgba(0,0,0,0.03)] py-4"
        )}
      >
        <div className={isAdminPage ? "w-full px-4 lg:px-8" : "container mx-auto px-4 md:px-16"}>
          <div className="flex items-center justify-between">
            {/* Logo + Brand Name */}
            <Link href={isAdminPage ? "/admin" : "/"} className="flex items-center" style={{ gap: `${logoSpacing}px` }}>
              {logoUrl ? (
                <div
                  className={cn("relative overflow-hidden shrink-0 transition-all duration-300", scrolled ? "opacity-90" : "opacity-100")}
                  style={{ width: logoWidth, height: scrolled ? logoHeight * 0.85 : logoHeight }}
                >
                  <Image src={logoUrl} alt={siteName} width={logoWidth} height={logoHeight} className="object-contain w-full h-full" />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 text-white shadow-md shadow-sky-600/25">
                  <Droplets className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[17px] tracking-tight text-sky-600">
                    NGANILA
                  </span>
                  <span className="font-bold text-[14px] tracking-wider text-slate-800 uppercase">
                    CO LTD
                  </span>
                  {isAdminPage && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium -mt-0.5">
                  Waste Management &amp; Sanitation · Kigali
                </span>
              </div>
            </Link>

            {isAdminPage ? (
              /* Admin Portal Header */
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase tracking-wider text-[12px] h-10 px-4 md:px-5 gap-2 rounded-full shadow-sm"
                >
                  <Link href="/">
                    <Globe className="h-4 w-4" />
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
                            ? "text-sky-600 bg-sky-50 font-bold"
                            : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"
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
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase tracking-wider h-10 px-5 text-[12px] gap-2 rounded-full shadow-md shadow-sky-600/20"
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
                    className="p-2 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
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
                        ? "text-sky-600 bg-sky-50 font-bold"
                        : "text-slate-700 hover:text-sky-600 hover:bg-slate-50"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-3 mt-1 border-t border-slate-100">
                <Button asChild className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 text-[13px] uppercase tracking-wider gap-2 rounded-xl shadow-md shadow-sky-600/20">
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
