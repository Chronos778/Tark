import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ContextStrip from "@/components/landing/ContextStrip";
import CompareExplorer from "@/components/landing/CompareExplorer";
import Capabilities from "@/components/landing/Capabilities";
import BilingualBand from "@/components/landing/BilingualBand";
import Method from "@/components/landing/Method";
import FaqSection from "@/components/landing/FaqSection";
import { FinalCta, Footer } from "@/components/landing/FinalCta";

const Index = () => {
  return (
    <div className="min-h-screen bg-ink font-sans text-bone antialiased selection:bg-saffron/30">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-saffron px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <Hero />
        <ContextStrip />
        <CompareExplorer />
        <Capabilities />
        <BilingualBand />
        <Method />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
