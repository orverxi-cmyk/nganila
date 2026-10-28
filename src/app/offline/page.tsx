
"use client";

import React from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-5 text-center">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">You're Offline</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          It looks like you've lost your internet connection. SANEX services are still accessible once you're back online.
        </p>
        <Button onClick={handleRetry} className="bg-primary text-white hover:bg-primary/90 font-bold h-12 px-8 rounded-full gap-2">
          <RefreshCw className="h-4 w-4" /> Try Reconnecting
        </Button>
      </main>
      <Footer />
    </div>
  );
}
