import { motion } from "framer-motion";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Adv. Priya Sharma",
      role: "Criminal Defense Lawyer",
      content: "LegalAi has completely transformed how I research IPC vs BNS changes. The side-by-side comparison saves me hours every week.",
      avatar: "👩‍⚖️"
    },
    {
      name: "Rajesh Kumar",
      role: "Law Student, NLSIU",
      content: "As a law student, this tool is invaluable for understanding the transition to BNS. The AI explanations are clear and precise.",
      avatar: "👨‍🎓"
    },
    {
      name: "Dr. Meera Iyer",
      role: "Legal Consultant",
      content: "The document summarizer is a game-changer. I can now process lengthy judgments in minutes instead of hours.",
      avatar: "👩‍💼"
    },
    {
      name: "Advocate Arjun Patel",
      role: "High Court Lawyer",
      content: "Instant case law citations and neutral analysis make LegalAi my go-to research tool every single day.",
      avatar: "👨‍⚖️"
    }
  ];

  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4 text-center text-[#f8f8f8]"
        >
          Trusted by Legal Professionals
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-lg text-center text-[#f8f8f8]/70"
        >
          Join thousands of lawyers and students using LegalAi
        </motion.p>
      </div>

      <div className="relative">
        <div className="flex gap-6 animate-marquee">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-[350px] p-6 rounded-2xl border border-[#f8f8f8]/20 bg-[#080808] hover:border-[#f8f8f8]/40 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <h4 className="font-bold text-[#f8f8f8]">{testimonial.name}</h4>
                  <p className="text-sm text-[#f8f8f8]/60">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-[#f8f8f8]/70 leading-relaxed">{testimonial.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
