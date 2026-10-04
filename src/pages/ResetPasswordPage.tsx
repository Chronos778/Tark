import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";

/** Landing page for the link in the reset email. Supabase signs the user in with a recovery session. */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/chat"), 2000);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  };

  const shell = (children: React.ReactNode) => (
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
        <div className="bg-ink-2 rounded-2xl p-8 border border-bone/10">{children}</div>
      </motion.div>
    </div>
  );

  if (loading) {
    return shell(<p role="status" className="text-center text-sm text-bone/70">Checking your reset link…</p>);
  }

  if (!session) {
    return shell(
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Link expired</h2>
        <p className="text-sm leading-relaxed text-bone/70 mb-6">
          This reset link is invalid or has already been used. Request a new one and try again.
        </p>
        <Link to="/forgot-password" className="text-saffron font-medium hover:underline">
          Request a new link
        </Link>
      </div>,
    );
  }

  if (done) {
    return shell(
      <div role="status" className="text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Password updated</h2>
        <p className="text-sm text-bone/70">Taking you to the assistant…</p>
      </div>,
    );
  }

  return shell(
    <>
      <h2 className="text-2xl font-bold text-white mb-2">Choose a new password</h2>
      <p className="text-bone/60 text-sm mb-6">Use at least 6 characters.</p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-bone/80 mb-2">
            <Lock className="inline w-4 h-4 mr-2" />
            New password
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-ink border-bone/20 text-white focus:border-saffron"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-bone/80 mb-2">
            <Lock className="inline w-4 h-4 mr-2" />
            Confirm password
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-ink border-bone/20 text-white focus:border-saffron"
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-saffron hover:bg-saffron/85 text-ink font-semibold py-6 rounded-lg transition-colors"
        >
          {submitting ? "Updating…" : "Update password"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
    </>,
  );
};

export default ResetPasswordPage;
