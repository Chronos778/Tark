import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import { Container, Wordmark } from "./primitives";

const links = [
  { label: "Tools", href: "#capabilities" },
  { label: "Compare", href: "#compare" },
  { label: "Method", href: "#method" },
  { label: "FAQ", href: "#faq" },
];

const LandingNav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session } = useSession();
  const loggedIn = !!session;
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/login");
  };

  const ghost =
    "rounded-full border border-bone/20 px-4 py-2 text-sm text-bone transition-colors hover:border-bone/50 hover:bg-bone/5";
  const solid =
    "inline-flex items-center gap-2 rounded-full bg-saffron px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-saffron/85";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-bone/10 bg-ink/85 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-bone-dim transition-colors hover:text-bone">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loggedIn ? (
            <button onClick={logout} className={solid}>
              <LogOut className="size-3.5" /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" className={ghost}>
                Sign in
              </Link>
              <Link to="/chat" className={solid}>
                Open app
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-md text-bone md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      <div id="landing-mobile-menu" hidden={!open} className="border-t border-bone/10 md:hidden">
        <Container className="flex flex-col gap-1 py-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-base text-bone/90 hover:bg-bone/5"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex gap-2">
            {loggedIn ? (
              <button onClick={logout} className={cn(solid, "flex-1 justify-center py-3")}>
                <LogOut className="size-4" /> Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className={cn(ghost, "flex-1 py-3 text-center")}>
                  Sign in
                </Link>
                <Link to="/chat" onClick={() => setOpen(false)} className={cn(solid, "flex-1 justify-center py-3")}>
                  Open app
                </Link>
              </>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
};

export default LandingNav;
