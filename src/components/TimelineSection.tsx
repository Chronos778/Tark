import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { CheckCircle2, Check, ArrowRight, Zap, Target, BookOpen, Server } from "lucide-react";

export default function TimelineSection() {
  const data = [
    {
      title: "Problem",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[#f8f8f8] text-sm md:text-base font-normal mb-6 leading-relaxed">
                Legal information in India is fragmented, complex, and difficult to access—especially after recent legislative changes.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-start text-[#f8f8f8]/80">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs">✕</span>
                  <div>
                    <span className="block text-sm font-semibold text-red-400">Statutory Complexity</span>
                    <span className="text-xs text-[#f8f8f8]/60">Transition from IPC to BNS makes comparison difficult and error-prone.</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start text-[#f8f8f8]/80">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs">✕</span>
                  <div>
                    <span className="block text-sm font-semibold text-red-400">Case Law Overload</span>
                    <span className="text-xs text-[#f8f8f8]/60">Identifying relevant Supreme Court and High Court judgments is time-consuming.</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start text-[#f8f8f8]/80">
                  <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs">✕</span>
                  <div>
                    <span className="block text-sm font-semibold text-red-400">Accessibility Gap</span>
                    <span className="text-xs text-[#f8f8f8]/60">Legal language and English-only resources exclude citizens.</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start text-[#f8f8f8]/80">
                   <span className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs">✕</span>
                   <div>
                    <span className="block text-sm font-semibold text-red-400">Verification Challenge</span>
                    <span className="text-xs text-[#f8f8f8]/60">Trustworthy, citable legal sources are scattered.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
               <img
                src="/visual_problem.png"
                alt="Legal Confusion"
                className="rounded-xl object-cover h-72 w-full shadow-2xl border border-[#f8f8f8]/10"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl" />
            </div>
        </div>
      ),
    },
    {
      title: "Solution",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div>
               <p className="text-[#f8f8f8] text-sm md:text-base font-normal mb-6 leading-relaxed">
                 LegalAi is an AI-powered legal research assistant built to simplify Indian criminal law through structured retrieval, comparison, and verification.
               </p>
               <div className="flex flex-col gap-4">
                 <div className="flex gap-3 items-start text-[#f8f8f8]/90">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-purple-400">Context-Aware RAG Engine</span>
                     <span className="text-xs text-[#f8f8f8]/60">Retrieves answers strictly from IPC, BNS, and curated case law.</span>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start text-[#f8f8f8]/90">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-purple-400">IPC ↔ BNS Section Mapping</span>
                     <span className="text-xs text-[#f8f8f8]/60">Enables instant comparison of legacy IPC with new Sanhitas.</span>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start text-[#f8f8f8]/90">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-purple-400">Automated Case Law Linking</span>
                     <span className="text-xs text-[#f8f8f8]/60">Identifies relevant Supreme Court/High Court judgments.</span>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start text-[#f8f8f8]/90">
                   <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400">
                     <Check size={12} strokeWidth={3} />
                   </div>
                   <div>
                     <span className="block text-sm font-semibold text-purple-400">Verifiable Source Footnoting</span>
                     <span className="text-xs text-[#f8f8f8]/60">Every response includes clickable citations.</span>
                   </div>
                 </div>
               </div>
               <p className="mt-6 text-[10px] text-[#f8f8f8]/40 italic border-t border-[#f8f8f8]/10 pt-2">
                 Designed as an assistive legal research tool, not a replacement for professional legal advice.
               </p>
             </div>
             <div className="relative">
                <img
                  src="/visual_solution.png"
                  alt="AI Solution"
                  className="rounded-xl object-cover h-72 w-full shadow-2xl border border-[#f8f8f8]/10"
                />
                <div className="absolute inset-0 bg-black/40 rounded-xl" />
             </div>
        </div>
      ),
    },
    {
      title: "Impact",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[#f8f8f8] text-sm md:text-base font-normal mb-6 leading-relaxed">
                LegalAi v1.0 demonstrates how AI can responsibly improve legal understanding during India’s transition to new criminal laws.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-[#f8f8f8]/5 border border-[#f8f8f8]/10 hover:bg-[#f8f8f8]/10 transition-colors">
                     <Zap className="w-5 h-5 text-purple-400 mb-2" />
                     <h4 className="text-sm font-bold text-white mb-1">Faster Research</h4>
                     <p className="text-[10px] text-gray-400 leading-tight">Reduces lookup from minutes to seconds.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#f8f8f8]/5 border border-[#f8f8f8]/10 hover:bg-[#f8f8f8]/10 transition-colors">
                     <Target className="w-5 h-5 text-blue-400 mb-2" />
                     <h4 className="text-sm font-bold text-white mb-1">Improved Accuracy</h4>
                     <p className="text-[10px] text-gray-400 leading-tight">Generated only from verified statutes.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#f8f8f8]/5 border border-[#f8f8f8]/10 hover:bg-[#f8f8f8]/10 transition-colors">
                     <BookOpen className="w-5 h-5 text-indigo-400 mb-2" />
                     <h4 className="text-sm font-bold text-white mb-1">Accessible Knowledge</h4>
                     <p className="text-[10px] text-gray-400 leading-tight">Bilingual explanations for non-experts.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#f8f8f8]/5 border border-[#f8f8f8]/10 hover:bg-[#f8f8f8]/10 transition-colors">
                     <Server className="w-5 h-5 text-pink-400 mb-2" />
                     <h4 className="text-sm font-bold text-white mb-1">Scalable Infra</h4>
                     <p className="text-[10px] text-gray-400 leading-tight">Supports expansion to other acts.</p>
                  </div>
              </div>
            </div>
            <div className="relative h-full min-h-[300px] w-full rounded-xl overflow-hidden border border-[#f8f8f8]/10 group">
                <img
                  src="/visual_impact.png"
                  alt="Impact"
                  className="rounded-xl object-cover h-72 w-full shadow-2xl border border-[#f8f8f8]/10 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 rounded-xl pointer-events-none" />
            </div>
        </div>
      ),
    },
  ];
  return (
    <div className="w-full bg-[#09090B] mt-24">
      <Timeline 
        data={data} 
        title="Why LegalAi?"
        description="Bridging the gap between ancient statutes and modern technology."
      />
    </div>
  );
}
