import { useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import mappings from "@/data/key_bns_mappings.json";
import { Container, Eyebrow, Reveal, SectionHeading } from "./primitives";

type Mapping = {
  ipc_section: string;
  ipc_title: string;
  bns_section: string;
  bns_title: string;
  change_type: string;
  text_ipc: string;
  text_bns: string;
};

const data = mappings as Mapping[];

const tone: Record<string, string> = {
  Modified: "border-saffron/40 bg-saffron/10 text-saffron",
  Expanded: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  Replaced: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  Restructured: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  Same: "border-bone/20 bg-bone/5 text-bone-dim",
};

const tidy = (s: string) => s.replace(/\.{2,}/g, ".").trim();

const excerpt = (s: string, max = 430) => {
  const t = tidy(s);
  if (t.length <= max) return { text: t, cut: false };
  const head = t.slice(0, max);
  return { text: `${head.slice(0, head.lastIndexOf(" "))}…`, cut: true };
};

const Sheet = ({
  old,
  kicker,
  section,
  title,
  body,
}: {
  old?: boolean;
  kicker: string;
  section: string;
  title: string;
  body: { text: string; cut: boolean };
}) => (
  <article
    className={cn(
      "flex flex-col rounded-md p-6 text-[#1B1812] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]",
      old ? "bg-[#E4D9BD]" : "bg-[#F6F1E4]",
    )}
  >
    <p className="font-tag text-[10px] uppercase tracking-[0.16em] text-[#6B6250]">{kicker}</p>
    <p className="mt-3 font-display text-5xl leading-none tracking-tight">§{section}</p>
    <h3 className="mt-2 font-display text-lg font-medium leading-snug">{title}</h3>
    <hr className="my-4 border-[#1B1812]/15" />
    <p className="whitespace-pre-line font-display text-[15px] leading-relaxed text-[#2A2519]">{body.text}</p>
    {body.cut && <p className="mt-3 font-tag text-[10px] uppercase tracking-[0.14em] text-[#6B6250]">Excerpt</p>}
  </article>
);

const CompareExplorer = () => {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const current = data[active];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next = active;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (active + 1) % data.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (active - 1 + data.length) % data.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = data.length - 1;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="compare" className="scroll-mt-16 py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow index="01">Compare</Eyebrow>
          <SectionHeading className="mt-5">See what changed, section by section.</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-bone-dim">
            Pick an offence. The old IPC provision and its BNS counterpart sit side by side, tagged by how the law
            moved. This is a curated sample; the Compare tool searches the full dataset.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="grid gap-6 lg:grid-cols-12">
            <div
              role="tablist"
              aria-label="IPC to BNS examples"
              aria-orientation="vertical"
              onKeyDown={onKeyDown}
              className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
            >
              {data.map((m, i) => {
                const selected = i === active;
                return (
                  <button
                    key={`${m.ipc_section}-${m.bns_section}`}
                    ref={(el) => (tabRefs.current[i] = el)}
                    role="tab"
                    id={`cmp-tab-${i}`}
                    aria-selected={selected}
                    aria-controls="cmp-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={cn(
                      "shrink-0 rounded-lg border px-4 py-3 text-left transition-colors lg:shrink",
                      selected
                        ? "border-saffron/50 bg-saffron/10"
                        : "border-bone/10 hover:border-bone/30 hover:bg-bone/5",
                    )}
                  >
                    <span className="block whitespace-nowrap font-tag text-xs text-saffron">
                      IPC {m.ipc_section} → BNS {m.bns_section}
                    </span>
                    <span className="mt-1 hidden text-sm text-bone lg:block">{m.ipc_title}</span>
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id="cmp-panel"
              aria-labelledby={`cmp-tab-${active}`}
              className="lg:col-span-8"
            >
              <div className="rounded-2xl border border-bone/10 bg-ink-2 p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-tag text-xs uppercase tracking-[0.14em] text-bone-dim">
                    How it moved
                  </p>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 font-tag text-xs uppercase tracking-[0.12em]",
                      tone[current.change_type] ?? tone.Same,
                    )}
                  >
                    {current.change_type}
                  </span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <Sheet
                      old
                      kicker="Indian Penal Code · 1860"
                      section={current.ipc_section}
                      title={current.ipc_title}
                      body={excerpt(current.text_ipc)}
                    />
                    <Sheet
                      kicker="Bharatiya Nyaya Sanhita · 2023"
                      section={current.bns_section}
                      title={current.bns_title}
                      body={excerpt(current.text_bns)}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-md text-xs leading-relaxed text-bone-dim">
                  Statute text comes from the bundled dataset. Verify against the official gazette before relying on
                  it.
                </p>
                <Link
                  to="/compare"
                  className="group inline-flex items-center gap-2 text-sm text-saffron hover:underline"
                >
                  Open the full comparison
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
};

export default CompareExplorer;
