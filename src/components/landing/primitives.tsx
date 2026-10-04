import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// The product name lives here so it can be changed in one place.
export const BRAND = { name: "Nyaya", native: "न्याय" } as const;

export const Container = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>
);

export const Wordmark = ({ className }: { className?: string }) => (
  <Link
    to="/"
    aria-label={`${BRAND.name} home`}
    className={cn("inline-flex items-center gap-2.5 text-bone", className)}
  >
    <span
      aria-hidden="true"
      className="grid size-8 place-items-center rounded-md border border-saffron/50 bg-saffron/10 font-display text-xl leading-none text-saffron"
    >
      §
    </span>
    <span className="font-display text-2xl font-medium tracking-tight">{BRAND.name}</span>
    <span lang="hi" className="hidden pt-0.5 font-deva text-sm text-bone-dim sm:inline">
      {BRAND.native}
    </span>
  </Link>
);

/** Fades and lifts its children in once, when scrolled into view. */
export const Reveal = ({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/** Small monospaced section label: "01  Tools" */
export const Eyebrow = ({ index, children }: { index?: string; children: ReactNode }) => (
  <p className="font-tag text-xs uppercase tracking-[0.18em] text-saffron">
    {index && <span className="mr-3 text-bone-dim">{index}</span>}
    {children}
  </p>
);

export const SectionHeading = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h2
    className={cn(
      "font-display text-4xl font-normal leading-[1.05] tracking-tight text-bone text-balance sm:text-5xl lg:text-[3.5rem]",
      className,
    )}
  >
    {children}
  </h2>
);
