import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email.trim(),
      password: formData.password,
    });
    setSubmitting(false);

    if (error) {
      setFormError(
        /confirm/i.test(error.message)
          ? "Please confirm your email first. Check your inbox for the confirmation link."
          : error.message,
      );
      return;
    }
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? "/chat");
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
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-[#F1EADB]/60 text-sm mb-6">
            Sign in to access your legal research tools
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>
            )}
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
                placeholder="Enter your password"
                className={`bg-[#0B0A09] border-[#F1EADB]/20 text-white placeholder:text-[#F1EADB]/40 focus:border-saffron ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-saffron hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-saffron hover:bg-saffron/85 text-ink font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-saffron/"
            >
              {submitting ? "Signing in…" : "Sign In"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-sm text-[#F1EADB]/60 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-saffron font-medium hover:underline">
              Create Account
            </Link>
          </p>
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

export default LoginPage;
