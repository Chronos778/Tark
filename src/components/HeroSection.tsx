import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ContainerScroll } from "./ui/container-scroll-animation";

const HeroSection = () => {
  return (
    <div className="relative flex flex-col items-center justify-start overflow-visible bg-[#09090B] pt-24 md:pt-32 pb-0">
      {/* Background Gradients - Removed as per user request */}
      
      {/* 3D Lady Justice Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 mix-blend-lighten">
              <img 
                  src="/lady_justice_3d.png" 
                  alt="Lady Justice 3D Render" 
                  className="w-full h-full object-contain object-center scale-125 mask-image-gradient" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#09090B] via-transparent to-transparent" />
          </div>
      </div>

      {/* Content Container */}
      <div className="container relative z-10 px-4 md:px-6 text-center max-w-5xl mx-auto pt-12">
        


        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-white mb-6"
        >
          Legal Clarity in <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            Seconds
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          The most advanced AI assistant for Indian Law. Compare statutes, analyze case laws, and get criminal justice insights instantly.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/chat">
            <Button size="lg" className="h-12 px-8 text-base rounded-full bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              Describe a Crime
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/compare">
             <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm">
                Compare BNS vs IPC
             </Button>
          </Link>
        </motion.div>

        {/* Floating Stats / Trust Indicators (Optional) */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1, duration: 1 }}
           className="mt-16 flex items-center justify-center gap-8 text-gray-500 text-sm mb-8"
        >
           <span>Verified Criminal Datasets</span>
           <span className="w-1 h-1 bg-gray-700 rounded-full" />
           <span>Updated for 2025</span>
        </motion.div>

      </div>

      {/* Scroll Animation Container for Demo Screenshot */}
      <div className="w-full -mt-20 md:-mt-32">
        <ContainerScroll
          titleComponent={<></>}
        >
          <img 
            src="/demo-screenshot.png" 
            alt="LegalAi Demo Interface"
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
          />
        </ContainerScroll>
      </div>
    </div>
  );
};

export default HeroSection;
