import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import IntroSection from "@/components/sections/IntroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import ProcessSection from "@/components/sections/ProcessSection";
import ImpactSection from "@/components/sections/ImpactSection";
import WhyAISection from "@/components/sections/WhyAISection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <HeroSection />

        {/* Pulls content up so sections slide over the pinned hero */}
        <div className="relative z-10 -mt-[100vh]">
          <IntroSection />
          <ServicesSection />
          <ProcessSection />
          <ImpactSection />
          <WhyAISection />
        </div>
      </main>
    </>
  );
}
