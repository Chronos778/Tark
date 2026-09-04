import { motion } from "framer-motion";

const VideoSection = () => {
  return (
    <section
      id="demo-video"
      className="py-20 px-4 bg-[#080808]"
    >
      <div className="max-w-5xl mx-auto text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4 text-[#f8f8f8]"
        >
          Watch Demo
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-lg mb-8 text-[#f8f8f8]/70"
        >
          See LegalAi in action and discover how easy it is to analyze legal changes
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden shadow-lg mx-auto max-w-4xl border bg-[#181818] border-[#f8f8f8]/20"
      >
        <div className="aspect-video w-full bg-[#080808] flex items-center justify-center">
          {/* Placeholder for demo video */}
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🎥</div>
            <p className="text-[#f8f8f8]/70">Demo Video Coming Soon</p>
            <p className="text-sm text-[#f8f8f8]/50 mt-2">Legal AI in action</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default VideoSection;
