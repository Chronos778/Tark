import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container, Eyebrow } from "./primitives";

const ease = [0.22, 1, 0.36, 1] as const;

const Cite = ({ n }: { n: number }) => (
  <sup className="ml-0.5 rounded-sm bg-saffron/15 px-1 font-tag text-[10px] text-saffron">{n}</sup>
);

/** A worked example of an answer, so the page shows the product instead of describing it. */
const ExampleAnswer = () => {
  const reduce = useReducedMotion();
  const step = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease },
        };

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(235,168,59,0.14),transparent_70%)]"
      />
      <div className="overflow-hidden rounded-2xl border border-bone/15 bg-ink-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-bone/10 px-5 py-3">
          <div className="flex items-center gap-2 font-tag text-[11px] uppercase tracking-[0.16em] text-bone-dim">
            <span className="size-1.5 rounded-full bg-saffron" aria-hidden="true" />
            Assistant
          </div>
          <span className="rounded-full border border-bone/15 px-2.5 py-0.5 font-tag text-[10px] uppercase tracking-[0.14em] text-bone-dim">
            Example
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <motion.div {...step(0.35)} className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-bone/10 px-4 py-3 text-[15px] leading-relaxed text-bone">
            What is the punishment for murder under the BNS, and what changed from IPC 302?
          </motion.div>

          <motion.div {...step(0.75)} className="space-y-3 text-[15px] leading-relaxed text-bone/90">
            <p>
              Murder is punishable under <b className="font-semibold text-bone">BNS §103(1)</b> with death or
              imprisonment for life, and the offender is also liable to fine.
              <Cite n={1} /> That is the same core penalty as <b className="font-semibold text-bone">IPC §302</b>.
              <Cite n={2} />
            </p>
            <p>
              What is new is <b className="font-semibold text-bone">§103(2)</b>: when a group of five or more
              persons acting in concert commits murder on grounds such as race, caste or community, sex, place of
              birth, language or personal belief, each member of the group is punishable with death or
              imprisonment for life, and fine.
              <Cite n={1} />
            </p>
          </motion.div>

          <motion.ul
            {...step(1.1)}
            className="space-y-1.5 border-t border-bone/10 pt-4 font-tag text-[11px] leading-relaxed text-bone-dim"
          >
            <li>
              <span className="text-saffron">1</span> Bharatiya Nyaya Sanhita, 2023 · §103
            </li>
            <li>
              <span className="text-saffron">2</span> Indian Penal Code, 1860 · §302
            </li>
          </motion.ul>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-bone/10 bg-ink/60 px-5 py-3 sm:px-6">
          {["Neutral analysis", "Arguments for & against", "Related judgments"].map((t) => (
            <span key={t} className="rounded-full border border-bone/15 px-3 py-1 text-xs text-bone-dim">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease },
        };

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 lg:pb-28">
      {/* Backdrop: hairline grid + oversized section sign */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,#F1EADB_1px,transparent_1px),linear-gradient(to_bottom,#F1EADB_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-10 -z-10 select-none font-display text-[32rem] leading-none text-bone/[0.025] max-lg:hidden"
      >
        §
      </div>

      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <motion.div {...rise(0)}>
            <Eyebrow>Indian law · IPC → BNS · English &amp; हिन्दी</Eyebrow>
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="mt-6 font-display text-5xl font-normal leading-[1.02] tracking-tight text-bone text-balance sm:text-6xl lg:text-[4.75rem]"
          >
            Legal research that <em className="font-normal italic text-saffron">shows its work.</em>
          </motion.h1>

          <motion.p {...rise(0.16)} className="mt-7 max-w-xl text-lg leading-relaxed text-bone-dim">
            Ask in English or Hindi. Nyaya answers from the statutes themselves — the IPC, the BNS, the IT Act and
            Supreme Court judgments — and puts a citation next to every claim, so you can check it at the source.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/chat"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-saffron px-7 text-[15px] font-medium text-ink transition-colors hover:bg-saffron/85"
            >
              Ask a legal question
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/compare"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-bone/25 px-7 text-[15px] text-bone transition-colors hover:border-bone/60 hover:bg-bone/5"
            >
              Compare IPC with BNS
              <ArrowUpRight className="size-4 text-bone-dim transition-colors group-hover:text-bone" />
            </Link>
          </motion.div>

          <motion.p {...rise(0.32)} className="mt-10 max-w-md text-sm leading-relaxed text-bone-dim">
            <span lang="hi" className="font-deva text-bone">
              न्याय
            </span>{" "}
            — Hindi for <i>justice</i>. A research aid for people who need to follow the reasoning behind the law,
            not just read the verdict.
          </motion.p>
        </div>

        <div className="lg:col-span-5">
          <ExampleAnswer />
        </div>
      </Container>
    </section>
  );
};

export default Hero;
