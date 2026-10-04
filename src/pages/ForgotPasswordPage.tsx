import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = email.trim();
    if (!/\S+@\S+\.\S+/.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    // Same message whether or not the account exists, so emails cannot be probed
    setSentTo(value);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-lg border border-saffron/50 bg-saffron/10 font-display text-3xl leading-none text-saffron">§</span>
          <h1 className="text-4xl font-medium text-bone">Nyaya</h1>
        </div>

        <div className="bg-ink-2 rounded-2xl p-8 border border-bone/10">
          {sentTo ? (
            <div role="status" className="text-center py-2">
              <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-sm leading-relaxed text-bone/70">
                If an account exists for <span className="text-bone">{sentTo}</span>, we have sent a link to reset
                the password. The link opens a page where you can choose a new one.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Reset your password</h2>
              <p className="text-bone/60 text-sm mb-6">Enter your email and we will send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-bone/80 mb-2">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="bg-ink border-bone/20 text-white placeholder:text-bone/40 focus:border-saffron"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-saffron hover:bg-saffron/85 text-ink font-semibold py-6 rounded-lg transition-colors"
                >
                  {submitting ? "Sending…" : "Send reset link"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </>
          )}
          <p className="text-center text-sm text-bone/60 mt-6">
            <Link to="/login" className="text-saffron font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
