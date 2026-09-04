import { motion } from "framer-motion";
import { BookOpen, Scale, Zap, ShieldCheck, FileText, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Instant Comparison",
    description: "Compare IPC and BNS sections side-by-side with diff highlighting.",
    icon: <ArrowRightLeft className="w-6 h-6" />,
    className: "md:col-span-2",
  },
  {
    title: "AI Analysis",
    description: "Get neutral, objective analysis of legal changes.",
    icon: <Sparkles className="w-6 h-6" />,
    className: "md:col-span-1",
  },
  {
    title: "Summarizer",
    description: "Condense long legal documents into actionable insights.",
    icon: <FileText className="w-6 h-6" />,
    className: "md:col-span-1",
  },
  {
    title: "Chat Assistant",
    description: "Ask questions in natural language about any Indian law.",
    icon: <MessageSquare className="w-6 h-6" />,
    className: "md:col-span-2",
  },
];

import { ArrowRightLeft, Sparkles, MessageSquare } from "lucide-react";

const FeaturesSection = () => {
    return (
        <section className="py-32 px-4 bg-black relative overflow-hidden">
             {/* Background Gradients */}
            {/* Background Gradients - Removed as per user request */}
            {/* <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" /> */}

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                        Everything needed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Legal Excellence</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Transition seamlessly from IPC to BNS with AI-powered insights, real-time comparisons, and instant summarization.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.05] transition-all duration-300",
                                "hover:border-purple-500/20"
                            )}
                        >
                            <div className="flex items-start gap-6">
                                <div className="shrink-0 p-3 rounded-2xl bg-white/5 text-purple-400 group-hover:text-white group-hover:bg-purple-600 transition-all duration-300">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">{feature.title}</h3>
                                    <p className="text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
