import { CheckCircle2 } from "lucide-react";

const SolutionSection = () => {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
            An AI Legal Assistant Built for Indian Law
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto mb-8" />
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Our system uses <strong className="text-foreground">Retrieval-Augmented Generation (RAG)</strong> — 
            a technology that combines AI language understanding with direct retrieval from official legal 
            databases. This means every answer is grounded in actual statutes, case laws, and government 
            publications, not generated from general knowledge.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground">Contextually Accurate</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground">Verifiable Sources</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground">Always Up-to-Date</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
