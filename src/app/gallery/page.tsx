
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import Image from "next/image";
import { Loader2, Camera, ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const isVideo = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || (url.includes('firebasestorage') && url.toLowerCase().includes('.mp4'));
};

export default function GalleryPage() {
  const db = useFirestore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const galleryQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "gallery"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: photos, loading } = useCollection(galleryQuery);
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const showLoading = !mounted || (loading && !timedOut && (!photos || photos.length === 0));

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photos && selectedIndex !== null) {
      setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
    }
  }, [photos, selectedIndex]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photos && selectedIndex !== null) {
      setSelectedIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
    }
  }, [photos, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handlePrevious, handleNext]);

  return (
    <div className="min-h-screen flex flex-col font-arial">
      <Navbar />
      <main className="flex-grow py-5 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-5 space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <h1 className="text-[16px] font-bold text-black uppercase tracking-widest">Service Gallery</h1>
            <p className="text-[14px] font-normal text-muted-foreground max-w-2xl mx-auto">
              Visual journey through our nationwide liquid waste management operations.
            </p>
          </div>

          {showLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : photos && photos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {photos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="group relative rounded-xl overflow-hidden bg-muted shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer aspect-video"
                    onClick={() => setSelectedIndex(index)}
                  >
                    {photo.imageUrl ? (
                      isVideo(photo.imageUrl) ? (
                        <>
                          <video
                            src={photo.imageUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="none"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center text-white shadow-md">
                              <Play className="h-5 w-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <Image
                          src={photo.imageUrl}
                          alt={photo.description || "Gallery photo"}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white font-bold text-[14px] line-clamp-2">
                        {photo.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
                <DialogContent className="max-w-[95vw] h-[90vh] p-0 border-none bg-black/95 flex flex-col overflow-hidden">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Photo Gallery Viewer</DialogTitle>
                    <DialogDescription>Viewing item {selectedIndex !== null ? selectedIndex + 1 : ''} of {photos.length}</DialogDescription>
                  </DialogHeader>
                  {selectedIndex !== null && photos[selectedIndex] && (
                    <div className="relative flex-grow flex flex-col">
                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                        onClick={() => setSelectedIndex(null)}
                      >
                        <X className="h-6 w-6" />
                      </Button>

                      {/* Main Image Container */}
                      <div className="relative flex-grow w-full flex items-center justify-center p-4 md:p-12">
                        {/* Navigation Controls */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 z-50 text-white hover:bg-white/20 bg-black/20 rounded-full h-12 w-12 hidden md:flex"
                          onClick={handlePrevious}
                        >
                          <ChevronLeft className="h-8 w-8" />
                        </Button>

                        <div className="relative w-full h-full flex items-center justify-center">
                          {isVideo(photos[selectedIndex].imageUrl) ? (
                            <video
                              src={photos[selectedIndex].imageUrl}
                              controls
                              autoPlay
                              playsInline
                              preload="metadata"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Image
                              src={photos[selectedIndex].imageUrl}
                              alt={photos[selectedIndex].description}
                              fill
                              sizes="95vw"
                              className="object-contain"
                              priority
                            />
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 z-50 text-white hover:bg-white/20 bg-black/20 rounded-full h-12 w-12 hidden md:flex"
                          onClick={handleNext}
                        >
                          <ChevronRight className="h-8 w-8" />
                        </Button>
                      </div>

                      {/* Footer Info */}
                      <div className="bg-black/60 backdrop-blur-md p-6 border-t border-white/10">
                        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                          <p className="text-white text-[14px] font-bold text-center md:text-left">
                            {photos[selectedIndex].description}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">
                              {selectedIndex + 1} / {photos.length}
                            </span>
                            <div className="flex gap-2 md:hidden">
                                <Button size="sm" variant="outline" className="border-white/20 text-white h-8 w-8 p-0" onClick={handlePrevious}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-white/20 text-white h-8 w-8 p-0" onClick={handleNext}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="text-center py-20 opacity-50 bg-muted/20 rounded-2xl border-2 border-dashed">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-[14px] font-bold">No photos in the gallery yet.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
