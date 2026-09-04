import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Simple demo login - just set auth flag
    const user = {
      name: "Demo User",
      email: formData.email,
      loginAt: new Date().toISOString(),
    };
    
    localStorage.setItem("legalai_user", JSON.stringify(user));
    localStorage.setItem("legalai_auth", "true");
    
    // Redirect to landing page
    navigate("/");
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img 
            src="/logo.jpg" 
            alt="LegalAi Logo" 
            className="h-12 w-12 rounded-lg object-cover border border-[#f8f8f8]/20 shadow-lg"
          />
          <h1 className="text-3xl font-bold text-white">LegalAi</h1>
        </div>

        {/* Form Container */}
        <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl p-8 border border-[#f8f8f8]/10">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-[#f8f8f8]/60 text-sm mb-6">
            Sign in to access your legal research tools
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="your.email@example.com"
                className={`bg-[#09090B] border-[#f8f8f8]/20 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Enter your password"
                className={`bg-[#09090B] border-[#f8f8f8]/20 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a href="#" className="text-sm text-purple-400 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
            >
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-3 bg-[#09090B]/50 rounded-lg border border-purple-500/20">
            <p className="text-xs text-[#f8f8f8]/60 text-center">
              <span className="text-purple-400">Demo:</span> Use any email and password to sign in
            </p>
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm text-[#f8f8f8]/60 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-purple-400 font-medium hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[#f8f8f8]/50 hover:text-[#f8f8f8]/80 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
