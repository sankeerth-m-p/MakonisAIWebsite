import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import IntroSection from "@/components/sections/IntroSection";
import ServiceCustomAISection from "@/components/sections/ServiceCustomAISection";
import ServiceGenerativeAISection from "@/components/sections/ServiceGenerativeAISection";
import ServiceDataEngineeringSection from "@/components/sections/ServiceDataEngineeringSection";
import ServiceModelOpsSection from "@/components/sections/ServiceModelOpsSection";
import ProcessSection from "@/components/sections/ProcessSection";
import ImpactSection from "@/components/sections/ImpactSection";
import WhyAISection from "@/components/sections/WhyAISection";
export default function Home() {
  return (
    <>
      <Navbar />
      <main style={{ position: "relative" }}>
        <HeroSection />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            marginTop: "-150vh", // pulls content up to overlap the pinned hero
            backgroundColor: "var(--background)", // must have bg or hero shows through
          }}
        ><div className="h-screen"/> 
          <IntroSection />
          <ServiceCustomAISection />
          <ServiceGenerativeAISection />
          <ServiceDataEngineeringSection />
          <ServiceModelOpsSection />
          <ProcessSection />
          <ImpactSection />
          <WhyAISection />
        </div>
      </main>
    </>
  );
}