import { Container, Eyebrow, Reveal, SectionHeading } from "./primitives";

const BilingualBand = () => (
  <section aria-labelledby="bilingual-title" className="border-y border-bone/10 bg-ink-2 py-24 sm:py-28">
    <Container className="grid items-center gap-12 lg:grid-cols-12">
      <Reveal className="lg:col-span-6">
        <Eyebrow index="03">Language</Eyebrow>
        <SectionHeading className="mt-5">
          <span id="bilingual-title">Ask in the language you think in.</span>
        </SectionHeading>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-bone-dim">
          Questions, answers and drafts work in English and in Devanagari Hindi. The law is cited by section number
          either way, so nothing is lost between the two.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="lg:col-span-6">
        <div className="space-y-4">
          <div className="ml-auto max-w-md rounded-2xl rounded-br-sm border border-bone/15 bg-ink px-5 py-4">
            <p className="font-tag text-[10px] uppercase tracking-[0.16em] text-bone-dim">हिन्दी</p>
            <p lang="hi" className="mt-2 font-deva text-xl leading-relaxed text-bone">
              हत्या की सज़ा क्या है?
            </p>
            <p lang="hi" className="mt-3 font-deva text-[15px] leading-relaxed text-bone-dim">
              भारतीय न्याय संहिता की धारा 103 के अनुसार, हत्या के लिए मृत्युदंड या आजीवन कारावास की सज़ा है, और जुर्माना भी लगाया जा सकता है।
            </p>
          </div>
          <div className="max-w-md rounded-2xl rounded-bl-sm border border-bone/15 bg-ink px-5 py-4">
            <p className="font-tag text-[10px] uppercase tracking-[0.16em] text-bone-dim">English</p>
            <p className="mt-2 font-display text-xl leading-relaxed text-bone">What is the punishment for murder?</p>
            <p className="mt-3 text-[15px] leading-relaxed text-bone-dim">
              Under BNS section 103: death or imprisonment for life, and fine.
            </p>
          </div>
        </div>
      </Reveal>
    </Container>
  </section>
);

export default BilingualBand;
