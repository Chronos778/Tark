import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#f8f8f8]">
          Ready to Transform Your Legal Research?
        </h2>
        <p className="text-xl mb-10 text-[#f8f8f8]/70 max-w-2xl mx-auto">
          Join thousands of legal professionals navigating the IPC to BNS transition with confidence
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/chat">
            <Button 
              size="lg" 
              className="h-14 px-8 text-base rounded-full bg-white text-black hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            >
              Start Legal Assistant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/compare">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 text-base rounded-full border-[#f8f8f8]/20 bg-[#09090B] text-[#f8f8f8] hover:bg-[#f8f8f8]/10 hover:border-[#f8f8f8]/40"
            >
              Compare IPC vs BNS
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-[#f8f8f8]/50 text-sm">
          <span>✓ Updated for 2025</span>
          <span className="w-1 h-1 bg-[#f8f8f8]/50 rounded-full" />
          <span>✓ Verified Sources</span>
          <span className="w-1 h-1 bg-[#f8f8f8]/50 rounded-full" />
          <span>✓ Secure & Private</span>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
