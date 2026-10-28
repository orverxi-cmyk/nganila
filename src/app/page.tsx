import { Navbar } from "@/components/sections/Navbar";
import { HomeSlider } from "@/components/sections/HomeSlider";
import { MilestoneTracker } from "@/components/sections/MilestoneTracker";
import { Services } from "@/components/sections/Services";
import { VideoHighlight } from "@/components/sections/VideoHighlight";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <HomeSlider />
        <MilestoneTracker />
        <Services />
        <VideoHighlight />
      </main>
      <Footer />
    </div>
  );
}
