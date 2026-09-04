import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

const SignupPage = () => {
  const navigate = useNavigate();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Store user in localStorage (demo purposes)
    const user = {
      name: formData.name,
      email: formData.email,
      createdAt: new Date().toISOString(),
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
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-[#f8f8f8]/60 text-sm mb-6">
            Join thousands of legal professionals
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Full Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your full name"
                className={`bg-[#09090B] border-[#f8f8f8]/20 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

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
                placeholder="At least 6 characters"
                className={`bg-[#09090B] border-[#f8f8f8]/20 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Confirm Password
              </label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Re-enter your password"
                className={`bg-[#09090B] border-[#f8f8f8]/20 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
            >
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-[#f8f8f8]/60 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-400 font-medium hover:underline">
              Sign In
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

export default SignupPage;
