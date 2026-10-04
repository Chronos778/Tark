import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BRAND, Container, Reveal, Wordmark } from "./primitives";

export const FinalCta = () => (
  <section className="relative isolate overflow-hidden border-t border-bone/10 py-28 sm:py-36">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(235,168,59,0.16),transparent_70%)]"
    />
    <Container className="text-center">
      <Reveal>
        <h2 className="mx-auto max-w-3xl font-display text-5xl font-normal leading-[1.03] tracking-tight text-bone text-balance sm:text-6xl lg:text-7xl">
          Start with the question you <em className="italic text-saffron">can’t quite phrase.</em>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-bone-dim">
          Describe the situation in your own words. Nyaya will find the sections, show the reasoning and cite the
          source.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/chat"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-saffron px-8 text-[15px] font-medium text-ink transition-colors hover:bg-saffron/85"
          >
            Open the assistant
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/compare"
            className="inline-flex h-12 items-center rounded-full border border-bone/25 px-8 text-[15px] text-bone transition-colors hover:border-bone/60 hover:bg-bone/5"
          >
            Compare IPC with BNS
          </Link>
        </div>
      </Reveal>
    </Container>
  </section>
);

const footerLinks = [
  { label: "Assistant", to: "/chat" },
  { label: "Compare", to: "/compare" },
  { label: "Draft", to: "/draft" },
  { label: "Summarize", to: "/summarize" },
  { label: "Sign in", to: "/login" },
];

export const Footer = () => (
  <footer className="border-t border-bone/10 bg-ink-2">
    <Container className="grid gap-10 py-12 md:grid-cols-12">
      <div className="md:col-span-5">
        <Wordmark />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-dim">
          {BRAND.name} is an AI research aid for Indian law. It provides information, not legal advice, and can make
          mistakes. Consult a qualified lawyer for your situation.
        </p>
      </div>
      <nav aria-label="Footer" className="md:col-span-7 md:justify-self-end">
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-bone-dim">
          {footerLinks.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="transition-colors hover:text-bone">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
    <div className="border-t border-bone/10">
      <Container className="flex flex-col gap-2 py-5 text-xs text-bone-dim sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {BRAND.name}</p>
        <p>
          Statute sources:{" "}
          <a
            href="https://www.indiacode.nic.in"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-bone hover:underline"
          >
            indiacode.nic.in
          </a>
        </p>
      </Container>
    </div>
  </footer>
);
