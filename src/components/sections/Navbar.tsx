
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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

  const navLinks = generalData?.navLinks?.length ? generalData.navLinks : defaultNavLinks;
  const siteName = generalData?.siteName || "SANEX Company Ltd";
  const logoUrl = generalData?.logoUrl;
  const logoWidth = generalData?.logoWidth || 160;
  const logoHeight = generalData?.logoHeight || 40;
  const logoSpacing = generalData?.logoSpacing ?? 8;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md transition-all duration-300",
        scrolled
          ? "shadow-[0_-3px_12px_rgba(141,184,51,0.35),0_4px_24px_rgba(0,0,0,0.08)]"
          : "shadow-[0_-2px_8px_rgba(141,184,51,0.2),0_2px_8px_rgba(0,0,0,0.04)]"
      )}
    >
      <div className={isAdminPage ? "w-full px-4 lg:px-8" : "container mx-auto px-4 md:px-16"}>
        <div className={cn(
          "flex items-center justify-between transition-all duration-300",
          scrolled ? "py-3" : "py-5"
        )}>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-black">
                <Droplets className="h-6 w-6" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={cn("font-bold tracking-tight text-primary transition-all duration-300", scrolled ? "text-[15px]" : "text-[16px]")}>
                {siteName.split(' ')[0]}{" "}
                <span className="text-foreground">{siteName.split(' ').slice(1).join(' ')}</span>
              </span>
              {isAdminPage && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-black border border-primary/30">
                  Admin
                </span>
              )}
            </div>
          </Link>

          {isAdminPage ? (
            /* Admin Portal Header */
            <div className="flex items-center gap-3">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider text-[12px] h-10 px-4 md:px-5 gap-2 rounded-full shadow-sm"
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
                        "relative px-3 py-2 text-[13px] font-bold uppercase tracking-widest transition-colors group",
                        isActive ? "text-primary" : "text-foreground/70 hover:text-primary"
                      )}
                    >
                      {link.name}
                      {/* Active underline indicator */}
                      <span
                        className={cn(
                          "absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full transition-all duration-200",
                          isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                        )}
                      />
                    </Link>
                  );
                })}

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
                  <UserNav />
                  <Button asChild className="bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest h-9 px-5 text-[12px] gap-2 rounded-full shadow-sm">
                    <Link href="/book"><Calendar className="h-3.5 w-3.5 text-black" /> Book a Service</Link>
                  </Button>
                </div>
              </div>

              {/* Mobile controls */}
              <div className="flex items-center gap-3 lg:hidden">
                <UserNav />
                <button
                  className="p-2 text-primary rounded-lg hover:bg-primary/10 transition-colors"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label="Toggle menu"
                >
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {!isAdminPage && isOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-md animate-in slide-in-from-top duration-200 border-t border-border/40">
          <div className="flex flex-col p-5 gap-1">
            {navLinks.map((link: any) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-colors",
                    isActive
                      ? "text-primary bg-primary/8"
                      : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-3 mt-1 border-t border-border/40">
              <Button asChild className="w-full bg-primary text-black font-bold h-11 text-[13px] uppercase tracking-widest gap-2 rounded-full">
                <Link href="/book" onClick={() => setIsOpen(false)}>
                  <Calendar className="h-4 w-4 text-black" /> Book a Service
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
