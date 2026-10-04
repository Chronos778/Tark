import { Container, Eyebrow, Reveal, SectionHeading } from "./primitives";

const principles = [
  {
    no: "I",
    title: "Retrieval first",
    body: "Nyaya searches the indexed statutes and judgments, then writes the answer from what it found, rather than from memory.",
  },
  {
    no: "II",
    title: "Citations you can open",
    body: "Each statute it relies on is linked to a primary source such as IndiaCode, so you can read the actual provision.",
  },
  {
    no: "III",
    title: "Both sides on the table",
    body: "Balanced-arguments mode sets out the case for and the case against, which is how a contention is actually tested.",
  },
  {
    no: "IV",
    title: "Research, not advice",
    body: "Every answer carries a disclaimer. Nyaya is an aid for finding and understanding the law, not a substitute for a lawyer.",
  },
];

const Method = () => (
  <section id="method" className="scroll-mt-16 py-24 sm:py-32">
    <Container>
      <Reveal className="max-w-3xl">
        <Eyebrow index="04">Method</Eyebrow>
        <SectionHeading className="mt-5">Built to be checked, not simply trusted.</SectionHeading>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-bone-dim">
          A language model can sound certain and still be wrong. Nyaya is designed around that fact.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
        {principles.map((p, i) => (
          <Reveal key={p.no} delay={i * 0.07} className="bg-ink">
            <div className="h-full p-6 sm:p-7">
              <p className="font-display text-3xl italic text-saffron">{p.no}</p>
              <h3 className="mt-6 font-display text-2xl leading-snug text-bone">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  </section>
);

export default Method;
