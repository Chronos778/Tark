import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Container, Eyebrow, Reveal, SectionHeading } from "./primitives";

const tools = [
  {
    no: "01",
    name: "Assistant",
    to: "/chat",
    blurb:
      "Ask a question in plain English or Hindi. Get a neutral analysis, the arguments for and against, and citations to the statute or judgment behind each point.",
    tags: ["Neutral analysis", "For & against", "Case law"],
  },
  {
    no: "02",
    name: "Compare",
    to: "/compare",
    blurb:
      "Move between the IPC and the BNS in either direction. Every provision is classed as renumbered, modified, new or removed, with the penalty differences laid out.",
    tags: ["IPC ↔ BNS", "Penalty changes"],
  },
  {
    no: "03",
    name: "Draft",
    to: "/draft",
    blurb:
      "Seven templates in formal English or Devanagari Hindi: legal notice, NDA, rent agreement, affidavit, employment agreement, POSH complaint and RTI application.",
    tags: ["7 templates", "English", "हिन्दी"],
  },
  {
    no: "04",
    name: "Summarize",
    to: "/summarize",
    blurb:
      "Upload an FIR, petition or court order, digital or scanned. Get an executive summary, the sections it refers to, and what it means in practice.",
    tags: ["PDF", "Scanned (OCR)", "Referenced sections"],
  },
];

const Capabilities = () => (
  <section id="capabilities" className="scroll-mt-16 border-t border-bone/10 py-24 sm:py-32">
    <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <Reveal className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <Eyebrow index="02">Tools</Eyebrow>
          <SectionHeading className="mt-5">Four tools, one source of truth.</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-bone-dim">
            They all read from the same indexed statutes and judgments, so a section means the same thing wherever
            you meet it. Voice input and read-aloud are built in for answers.
          </p>
        </div>
      </Reveal>

      <ol className="lg:col-span-8">
        {tools.map((t, i) => (
          <li key={t.no} className="border-t border-bone/10 last:border-b">
            <Reveal delay={i * 0.05}>
              <Link
                to={t.to}
                className="group grid gap-x-6 gap-y-3 py-8 sm:grid-cols-[3rem_1fr_auto] sm:py-10"
              >
                <span className="font-tag text-sm text-bone-dim">{t.no}</span>
                <div>
                  <h3 className="font-display text-3xl tracking-tight text-bone transition-colors group-hover:text-saffron sm:text-4xl">
                    {t.name}
                  </h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-bone-dim">{t.blurb}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {t.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-bone/15 px-3 py-1 text-xs text-bone-dim"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-6 text-bone-dim transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-saffron max-sm:hidden"
                />
              </Link>
            </Reveal>
          </li>
        ))}
      </ol>
    </Container>
  </section>
);

export default Capabilities;
