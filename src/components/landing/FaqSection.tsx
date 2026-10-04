import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ContactForm from "@/components/ContactForm";
import { Container, Eyebrow, Reveal, SectionHeading } from "./primitives";

const faqs = [
  {
    q: "How accurate is it?",
    a: "Answers are written from indexed statutes and judgments, with citations so you can check each claim. It can still be wrong or out of date. Treat it as research and confirm against the official text before you rely on it.",
  },
  {
    q: "Can I compare old IPC sections with the new BNS?",
    a: "Yes. The Compare tool maps IPC sections to their BNS counterparts and classes each change as renumbered, modified, new or removed, including differences in penalty.",
  },
  {
    q: "Is Nyaya a substitute for a lawyer?",
    a: "No. It is a research aid. For advice on your own situation, or for representation, consult a qualified lawyer.",
  },
  {
    q: "Does it work in Hindi?",
    a: "Yes. You can ask in English or Devanagari Hindi, dictate by voice, and have answers read aloud. Drafts can be generated in either language.",
  },
  {
    q: "Which laws does it cover?",
    a: "All 358 sections of the BNS, the IPC provisions in the IPC-to-BNS comparison, and about 1,100 Supreme Court judgments. The Information Technology Act 2000 is covered section by section. Key sections of the Companies Act 2013, the Consumer Protection Act 2019 and the Motor Vehicles Act 1988 are included too, but coverage of those three Acts is partial. Citations link out to primary sources such as IndiaCode.",
  },
  {
    q: "What can it draft?",
    a: "Legal notices, NDAs, rent agreements, affidavits, employment agreements, POSH complaints and RTI applications. Always have a professional review a draft before you use it.",
  },
  {
    q: "Can it read scanned documents?",
    a: "Yes. The Summarize tool takes digital or scanned PDFs, falling back to OCR when a file has no text layer, and returns a structured summary of the matter and the sections it cites.",
  },
  {
    q: "What happens to my questions?",
    a: "Questions are sent to the Nyaya backend and, to write the answer, to a hosted language model (currently Groq). Avoid entering personal details you do not need to.",
  },
];

const FaqSection = () => (
  <section id="faq" className="scroll-mt-16 border-t border-bone/10 py-24 sm:py-32">
    <Container>
      <Reveal className="max-w-2xl">
        <Eyebrow index="05">Questions</Eyebrow>
        <SectionHeading className="mt-5">Asked, and answered.</SectionHeading>
      </Reveal>

      <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-7">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`q-${i}`} className="border-bone/10">
                <AccordionTrigger className="py-5 font-display text-xl font-normal leading-snug text-bone hover:text-saffron hover:no-underline sm:text-2xl">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-xl pb-6 text-base leading-relaxed text-bone-dim">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-8 text-sm text-bone-dim">
            Still unsure?{" "}
            <Link to="/chat" className="text-saffron hover:underline">
              Ask the assistant
            </Link>
            .
          </p>
        </Reveal>

        <div className="lg:col-span-5">
          <ContactForm />
        </div>
      </div>
    </Container>
  </section>
);

export default FaqSection;
