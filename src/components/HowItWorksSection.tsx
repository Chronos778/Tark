import { MessageSquare, Search, FileCheck } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: MessageSquare,
    title: "Ask a Question",
    description: "Type your legal question in English or Hindi, or upload a legal document for analysis."
  },
  {
    number: "2",
    icon: Search,
    title: "AI Retrieves Information",
    description: "Our system searches through statutes, amendments, and relevant case laws from official sources."
  },
  {
    number: "3",
    icon: FileCheck,
    title: "Get Cited Response",
    description: "Receive a clear, structured answer with verifiable citations to official legal documents."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            How It Works
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-border" />
              )}
              
              <div className="step-number mx-auto mb-6 relative z-10">
                {step.number}
              </div>
              <div className="feature-icon mx-auto mb-4">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
