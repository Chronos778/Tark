import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";

type Fields = { name: string; email: string; message: string };

const empty: Fields = { name: "", email: "", message: "" };

const ContactForm = () => {
  const [fields, setFields] = useState<Fields>(empty);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | "consent", string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!fields.name.trim()) next.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(fields.email.trim())) next.email = "Please enter a valid email address";
    const len = fields.message.trim().length;
    if (len < 10) next.message = "Please write at least 10 characters";
    else if (len > 2000) next.message = "Please keep it under 2000 characters";
    if (!consent) next.consent = "Please tick the box so we can store your message";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(getApiUrl("/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          message: fields.message.trim(),
          consent,
          website,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const detail = typeof data.detail === "string" ? data.detail : "";
        setSubmitError(detail || "We could not send your message. Please try again in a moment.");
        return;
      }
      setSent(true);
      setFields(empty);
      setConsent(false);
    } catch {
      setSubmitError("We could not reach the server. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const field =
    "bg-ink border-bone/20 text-white placeholder:text-bone/40 focus:border-saffron focus-visible:ring-0";

  if (sent) {
    return (
      <div role="status" className="rounded-2xl border border-saffron/25 bg-saffron/10 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-12 text-green-400" aria-hidden="true" />
        <h3 className="mb-2 text-2xl font-bold text-white">Message sent</h3>
        <p className="text-bone/70">Thank you. We read every message and will reply to the email you gave.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-saffron underline-offset-2 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-bone/10 bg-ink-2 p-6 transition-colors hover:border-saffron/40 sm:p-8">
      <h3 className="mb-2 text-2xl font-bold text-white">Contact us</h3>
      <p className="mb-6 text-sm text-bone/60">
        Questions, feedback or a demo request? Send a note and we will reply by email.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && (
          <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {submitError}
          </p>
        )}

        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-bone/80">
            Name
          </label>
          <Input
            id="contact-name"
            autoComplete="name"
            value={fields.name}
            onChange={set("name")}
            maxLength={120}
            className={`${field} ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-bone/80">
            Email
          </label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={set("email")}
            placeholder="you@example.com"
            maxLength={254}
            className={`${field} ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-bone/80">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={4}
            value={fields.message}
            onChange={set("message")}
            maxLength={2000}
            className={`w-full resize-none rounded-md border bg-ink px-3 py-2 text-white placeholder:text-bone/40 focus:border-saffron focus:outline-none ${
              errors.message ? "border-red-500" : "border-bone/20"
            }`}
          />
          <p className="mt-1 text-xs text-bone/50">
            Please do not include confidential details of a legal matter. Nyaya cannot give legal advice.
          </p>
          {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
        </div>

        {/* Honeypot: invisible to people, tempting to bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-bone/70">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }));
              }}
              className="mt-1 size-4 shrink-0 accent-[#EBA83B]"
            />
            <span>I agree that Nyaya may store my name, email and message so it can reply to me.</span>
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-400">{errors.consent}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-saffron py-6 font-semibold text-ink transition-colors hover:bg-saffron/85"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send message"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
