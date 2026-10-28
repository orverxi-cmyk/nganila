
"use client";

import React from "react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Activity, Loader2 } from "lucide-react";

export function VideoHighlight() {
  const db = useFirestore();
  const videoRef = React.useMemo(() => (db ? doc(db, "settings", "video") : null), [db]);
  const { data: videoData, loading } = useDoc(videoRef);

  const content = {
    title: videoData?.title || "Nganila Co LTD in Action",
    description: videoData?.description || "Watch our specialized fleet of 5 vacuum tankers and localized wastewater systems delivering professional sanitation services in Kigali and across Rwanda.",
    videoUrl: videoData?.videoUrl || ""
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : url;
  };

  if (!content.videoUrl) return null;

  const isYouTube = content.videoUrl.includes("youtube.com") || content.videoUrl.includes("youtu.be");
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(content.videoUrl) : content.videoUrl;

  return (
    <section id="highlights" className="py-[20px] bg-transparent scroll-mt-24">
      <span id="operational-highlights" className="scroll-mt-24 absolute -top-24 pointer-events-none" />
      <div className="container mx-auto px-4 md:px-16">
        <div className="flex flex-col items-center text-center mb-5 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">
            <Activity className="h-2.5 w-2.5" /> Operational Highlights
          </div>
          <h2 className="text-base font-bold font-headline">{content.title}</h2>
          <p className="text-[14px] font-normal text-muted-foreground max-w-2xl">{content.description}</p>
        </div>

        <div className="max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-white bg-black relative">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video 
              src={content.videoUrl} 
              controls 
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}
