import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesGridBento from "@/components/FeaturesGridBento";
import TimelineSection from "@/components/TimelineSection";
import FAQConsultationSection from "@/components/FAQConsultationSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#09090B] text-white selection:bg-purple-500/30">
      <Header />
      <HeroSection />
      <FeaturesGridBento />
      <TimelineSection />
      <FAQConsultationSection />
      <CTASection />
      
      
      {/* Footer */}
      <footer className="py-12 text-center text-[#f8f8f8]/50 text-sm border-t border-[#f8f8f8]/10 bg-[#09090B]">
        <p>&copy; 2025 LegalAi. Built for the Future of Indian Law.</p>
      </footer>
    </div>
  );
};

export default Index;
