import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

const SignupPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) return;

    setSubmitting(true);
    const email = formData.email.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: formData.password,
      options: {
        data: { name: formData.name.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    // Supabase returns an obfuscated user with no identities when the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      setFormError("An account with this email already exists. Try signing in.");
      return;
    }
    setSentTo(email);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-lg border border-saffron/50 bg-saffron/10 font-display text-3xl leading-none text-saffron">§</span>
          <h1 className="text-4xl font-medium text-bone">Nyaya</h1>
        </div>

        {/* Form Container */}
        <div className="bg-ink-2 rounded-2xl p-8 border border-[#F1EADB]/10">
          {sentTo ? (
            <div role="status" className="py-4 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-sm leading-relaxed text-[#F1EADB]/70">
                We sent a confirmation link to <span className="text-bone">{sentTo}</span>. Open it to activate your
                account, then{" "}
                <Link to="/login" className="text-saffron font-medium hover:underline">sign in</Link>.
              </p>
            </div>
          ) : (
          <>
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-[#F1EADB]/60 text-sm mb-6">
            Free to use. We will email you a confirmation link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>
            )}
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-[#F1EADB]/80 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Full Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your full name"
                className={`bg-[#0B0A09] border-[#F1EADB]/20 text-white placeholder:text-[#F1EADB]/40 focus:border-saffron ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#F1EADB]/80 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="your.email@example.com"
                className={`bg-[#0B0A09] border-[#F1EADB]/20 text-white placeholder:text-[#F1EADB]/40 focus:border-saffron ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#F1EADB]/80 mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="At least 6 characters"
                className={`bg-[#0B0A09] border-[#F1EADB]/20 text-white placeholder:text-[#F1EADB]/40 focus:border-saffron ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#F1EADB]/80 mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Confirm Password
              </label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Re-enter your password"
                className={`bg-[#0B0A09] border-[#F1EADB]/20 text-white placeholder:text-[#F1EADB]/40 focus:border-saffron ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-saffron hover:bg-saffron/85 text-ink font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-saffron/"
            >
              {submitting ? "Creating account…" : "Create Account"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-[#F1EADB]/60 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-saffron font-medium hover:underline">
              Sign In
            </Link>
          </p>
          </>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[#F1EADB]/50 hover:text-[#F1EADB]/80 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
