"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Droplets, Menu, X, Calendar, Globe } from "lucide-react";
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

  const navLinks = (Array.isArray(generalData?.navLinks) && generalData.navLinks.length > 0)
    ? generalData.navLinks
    : defaultNavLinks;

  const companyName = generalData?.companyName || generalData?.siteName || "NGANIRA COMPANY LTD";
  const tagline = generalData?.tagline || "Waste Water Management";
  const logoUrl = generalData?.logoUrl;

  const nameParts = React.useMemo(() => {
    const trimmed = (companyName || "").trim();
    const firstSpace = trimmed.indexOf(" ");
    if (firstSpace !== -1) {
      return {
        main: trimmed.substring(0, firstSpace),
        suffix: trimmed.substring(firstSpace + 1)
      };
    }
    return { main: trimmed, suffix: "" };
  }, [companyName]);

  return (
    <header className="sticky top-0 z-50 w-full">
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
              {logoUrl ? (
                <div className="relative flex h-11 items-center justify-center rounded-xl overflow-hidden shrink-0">
                  <img
                    src={logoUrl}
                    alt={companyName}
                    className="h-11 w-auto max-w-[150px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 shrink-0">
                  <Droplets className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[17px] tracking-tight text-[var(--brand-secondary,#636679)]">
                    {nameParts.main}
                  </span>
                  {nameParts.suffix && (
                    <span className="font-bold text-[13px] tracking-wider text-[var(--brand-secondary,#636679)]/90 uppercase">
                      {nameParts.suffix}
                    </span>
                  )}
                  {isAdminPage && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--brand-secondary,#636679)]/70 font-medium -mt-0.5">
                  {tagline}
                </span>
              </div>
            </Link>

            {isAdminPage ? (
              /* Admin Portal Header */
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className="bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider text-[12px] h-10 px-4 md:px-5 gap-2 rounded-xl shadow-sm"
                >
                  <Link href="/">
                    <Globe className="h-4 w-4 text-white" />
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
                            ? "text-white bg-primary font-bold shadow-xs"
                            : "text-[var(--brand-secondary,#636679)] hover:text-primary hover:bg-primary/10"
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
                      className="bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider h-10 px-5 text-[12px] gap-2 rounded-xl shadow-md shadow-primary/25 border border-primary transition-all hover:scale-105"
                    >
                      <Link href="/book">
                        <Calendar className="h-4 w-4 text-white" /> Book a Service
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Mobile controls */}
                <div className="flex items-center gap-3 lg:hidden">
                  <UserNav />
                  <button
                    className="p-2 text-[var(--brand-secondary,#636679)] rounded-lg hover:bg-primary/10 transition-colors"
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
                        ? "text-white bg-primary font-bold shadow-xs"
                        : "text-[var(--brand-secondary,#636679)] hover:text-primary hover:bg-primary/10"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-3 mt-1 border-t border-slate-100">
                <Button asChild className="w-full bg-primary hover:opacity-90 text-white font-bold h-11 text-[13px] uppercase tracking-wider gap-2 rounded-xl shadow-md border border-primary">
                  <Link href="/book" onClick={() => setIsOpen(false)}>
                    <Calendar className="h-4 w-4 text-white" /> Book a Service
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
