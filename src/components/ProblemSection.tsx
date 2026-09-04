import { FileSearch, FileQuestion, Clock } from "lucide-react";

const problems = [
  {
    icon: FileSearch,
    title: "Scattered Statutes & Amendments",
    description: "Legal information is spread across multiple sources, making it difficult to find authoritative references quickly."
  },
  {
    icon: FileQuestion,
    title: "Difficult Legal Language",
    description: "Complex legal terminology and archaic phrasing create barriers to understanding even basic legal concepts."
  },
  {
    icon: Clock,
    title: "Time-Consuming Research",
    description: "Finding relevant case laws and their interpretations requires hours of manual searching through databases."
  }
];

const ProblemSection = () => {
  return (
    <section className="section-padding section-alt">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Legal Information Is Complex & Fragmented
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="legal-card text-center">
              <div className="feature-icon mx-auto mb-5">
                <problem.icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">
                {problem.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
