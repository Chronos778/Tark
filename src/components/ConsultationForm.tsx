import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CheckCircle2, Phone, Mail, User, FileText, Lock, Scale } from "lucide-react";

const ConsultationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    category: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.category) newErrors.category = "Please select a category";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Store in localStorage
    const submissions = JSON.parse(localStorage.getItem("consultationRequests") || "[]");
    submissions.push({
      ...formData,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("consultationRequests", JSON.stringify(submissions));

    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: "", phone: "", email: "", category: "", description: "" });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-8 border border-purple-500/20 text-center"
      >
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Request Submitted!</h3>
        <p className="text-[#f8f8f8]/70">
          Our legal experts will contact you within 24 hours.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl p-8 border border-[#f8f8f8]/10 hover:border-purple-500/30 transition-all"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Get Free Legal Consultation</h3>
        <p className="text-[#f8f8f8]/60 text-sm">
          Connect with verified lawyers for personalized advice
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            Full Name *
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

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
            <Phone className="inline w-4 h-4 mr-2" />
            Phone / WhatsApp *
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            className={`bg-[#09090B] border-[#f8f8f8]/20 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 ${
              errors.phone ? "border-red-500" : ""
            }`}
          />
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
            <Mail className="inline w-4 h-4 mr-2" />
            Email Address *
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

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
            <FileText className="inline w-4 h-4 mr-2" />
            Legal Issue Category *
          </label>
          <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger className={`bg-[#09090B] border-[#f8f8f8]/20 text-white ${errors.category ? "border-red-500" : ""}`}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#f8f8f8]/20">
              <SelectItem value="criminal">Criminal Law</SelectItem>
              <SelectItem value="cyber">Cyber Law</SelectItem>
              <SelectItem value="property">Property Law</SelectItem>
              <SelectItem value="family">Family Law</SelectItem>
              <SelectItem value="corporate">Corporate Law</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-[#f8f8f8]/80 mb-2">
            Brief Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Briefly describe your legal concern..."
            rows={3}
            className="w-full bg-[#09090B] border border-[#f8f8f8]/20 rounded-md px-3 py-2 text-white placeholder:text-[#f8f8f8]/40 focus:border-purple-500 focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
        >
          Request Free Consultation
        </Button>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#f8f8f8]/50 text-center flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            Your information is shared only with verified legal professionals.
          </p>
          <p className="text-xs text-[#f8f8f8]/40 text-center flex items-center justify-center gap-2">
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            LegalAi facilitates connections — Legal advice is provided by independent lawyers.
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default ConsultationForm;
