import { Shield, BookOpen, Building2, AlertCircle } from "lucide-react";

const sources = [
  {
    icon: Building2,
    text: "Official Government Gazettes"
  },
  {
    icon: BookOpen,
    text: "Published Statutes & Acts"
  },
  {
    icon: Shield,
    text: "Public Court Judgments"
  }
];

const TrustSection = () => {
  return (
    <section id="trust" className="section-padding section-alt">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Built on Official Legal Sources
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto mb-8" />
          
          <p className="text-lg text-muted-foreground mb-10">
            Every piece of information is traced back to authoritative legal publications
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            {sources.map((source, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <source.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{source.text}</span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="legal-card bg-secondary/50 border-border/50 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Disclaimer:</strong> This tool is for informational purposes only. 
                It is not a substitute for professional legal advice. Always consult a qualified legal professional 
                for specific legal matters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
