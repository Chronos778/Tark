import { Container, Eyebrow, Reveal } from "./primitives";

const facts = [
  {
    figure: "1860 → 2023",
    label: "The Indian Penal Code, in force for 160+ years, was replaced by the Bharatiya Nyaya Sanhita.",
  },
  {
    figure: "511 → 358",
    label: "Sections in the IPC and in the BNS. Many were renumbered, merged, reworded or dropped.",
  },
  {
    figure: "1 July 2024",
    label: "The BNS came into force. Cases and citations now straddle both codes.",
  },
];

const ContextStrip = () => (
  <section aria-labelledby="context-title" className="border-y border-bone/10 bg-ink-2">
    <Container className="py-14 sm:py-16">
      <Reveal>
        <div id="context-title">
          <Eyebrow>The change Nyaya was built for</Eyebrow>
        </div>
      </Reveal>
      <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-bone/10 bg-bone/10 md:grid-cols-3">
        {facts.map((f, i) => (
          <Reveal key={f.figure} delay={i * 0.08} className="bg-ink-2">
            <div className="h-full p-6 sm:p-8">
              <dt className="whitespace-nowrap font-display text-4xl tracking-tight text-bone lg:text-[2.6rem] xl:text-5xl">{f.figure}</dt>
              <dd className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">{f.label}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </Container>
  </section>
);

export default ContextStrip;
