
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
    title: videoData?.title || "",
    description: videoData?.description || "",
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
    <section id="highlights" className="py-12 lg:py-16 bg-white scroll-mt-24">
      <span id="operational-highlights" className="scroll-mt-24 absolute -top-24 pointer-events-none" />
      <div className="container mx-auto px-4 md:px-16">
        <div className="flex flex-col items-center text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d9eaa4]/40 text-[#383944] text-[11px] font-bold uppercase tracking-wider border border-[#d9eaa4]">
            <Activity className="h-3 w-3 text-[#636679]" /> Operational Footage
          </div>
          <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#26272e] tracking-tight">{content.title}</h2>
          <p className="text-[15px] text-[#636679] max-w-2xl leading-relaxed">{content.description}</p>
        </div>

        <div className="max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-[#636679]/10 border border-[#545667] bg-[#26272e] relative">
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
