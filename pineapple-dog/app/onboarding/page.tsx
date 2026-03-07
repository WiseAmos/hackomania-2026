"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { ref, update } from "firebase/database";
import { db } from "../../lib/firebase";
import { Loader2, ArrowRight, Check, User, Home, DollarSign, Calendar, Landmark, CreditCard, Upload, LogOut } from "lucide-react";

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Your Home", icon: Home },
  { id: 3, title: "Financials", icon: DollarSign },
  { id: 4, title: "Identity", icon: CreditCard },
];

export default function OnboardingPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [idFile, setIdFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    homeAddress: "",
    householdIncome: "",
    interledgerLink: "",
    identification: "National ID",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (user?.onboardingComplete) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
      if (errors.idFile) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.idFile;
          return newErrors;
        });
      }
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.dob) newErrors.dob = "Date of birth is required";
    } else if (currentStep === 2) {
      if (!formData.homeAddress) newErrors.homeAddress = "Home address is required";
    } else if (currentStep === 3) {
      if (!formData.householdIncome) newErrors.householdIncome = "Income range is required";
      if (!formData.interledgerLink) newErrors.interledgerLink = "Interledger link is required";
    } else if (currentStep === 4) {
      if (!idFile) newErrors.idFile = "Please upload an ID document";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        ...formData,
        onboardingComplete: true,
        kycVerified: true, // Auto-verify for hackathon once file is "uploaded"
        identityDocUrl: idFile ? "https://example.com/mock-upload-id.jpg" : "", 
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Sign Out Button - Top Right */}
      <div className="absolute top-6 right-6 z-[100]">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold border border-transparent hover:border-white/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366F1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10B981]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold font-[family-name:var(--font-heading)] mb-4"
          >
            Complete Your Profile
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60"
          >
            Tell us a bit more about yourself to get started in the Arena.
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0" />
            <motion.div 
              className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#10B981] -translate-y-1/2 z-0"
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id <= currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    animate={{ 
                      backgroundColor: isActive ? "#6366F1" : "#1E293B",
                      scale: isActive ? 1.1 : 1,
                      borderColor: isActive ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.1)"
                    }}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/40"}`} />}
                  </motion.div>
                  <span className={`absolute top-14 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${isActive ? "text-white" : "text-white/40"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#1E293B]/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-white/60 ml-1">FIRST NAME</label>
                      <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl px-5 h-14 text-white placeholder-white/20 focus:outline-none transition-all font-medium ${errors.firstName ? "border-red-500/50" : "border-white/10 focus:border-[#6366F1]/50"}`}
                      />
                      {errors.firstName && <p className="text-red-500 text-xs ml-1 font-medium">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-white/60 ml-1">LAST NAME</label>
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl px-5 h-14 text-white placeholder-white/20 focus:outline-none transition-all font-medium ${errors.lastName ? "border-red-500/50" : "border-white/10 focus:border-[#6366F1]/50"}`}
                      />
                      {errors.lastName && <p className="text-red-500 text-xs ml-1 font-medium">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/60 ml-1 text-center block">DATE OF BIRTH</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl pl-12 pr-5 h-14 text-white focus:outline-none transition-all font-medium ${errors.dob ? "border-red-500/50" : "border-white/10 focus:border-[#6366F1]/50"}`}
                      />
                    </div>
                    {errors.dob && <p className="text-red-500 text-xs text-center font-medium">{errors.dob}</p>}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/60 ml-1">HOME ADDRESS</label>
                  <textarea
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    placeholder="123 Arena Street, City, Country"
                    className={`w-full bg-[#0F172A]/50 border rounded-2xl px-5 py-4 h-32 text-white placeholder-white/20 focus:outline-none transition-all font-medium resize-none ${errors.homeAddress ? "border-red-500/50" : "border-white/10 focus:border-[#6366F1]/50"}`}
                  />
                  {errors.homeAddress && <p className="text-red-500 text-xs ml-1 font-medium">{errors.homeAddress}</p>}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/60 ml-1">HOUSEHOLD INCOME (ANNUAL)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <select
                        name="householdIncome"
                        value={formData.householdIncome}
                        onChange={handleInputChange}
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl pl-12 pr-5 h-14 text-white focus:outline-none transition-all font-medium appearance-none ${errors.householdIncome ? "border-red-500/50" : "border-white/10 focus:border-[#6366F1]/50"}`}
                      >
                        <option value="">Select Range</option>
                        <option value="< 30k">Less than $30,000</option>
                        <option value="30k-60k">$30,000 - $60,000</option>
                        <option value="60k-100k">$60,000 - $100,000</option>
                        <option value="100k+">More than $100,000</option>
                      </select>
                    </div>
                    {errors.householdIncome && <p className="text-red-500 text-xs ml-1 font-medium">{errors.householdIncome}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/60 ml-1">INTERLEDGER LINK (ILP)</label>
                    <div className="relative">
                      <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input
                        name="interledgerLink"
                        value={formData.interledgerLink}
                        onChange={handleInputChange}
                        placeholder="$payment-pointer.example/user"
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl pl-12 pr-5 h-14 text-white placeholder-white/20 focus:outline-none transition-all font-medium ${errors.interledgerLink ? "border-red-500/50" : "border-white/10 focus:border-[#6366F1]/50"}`}
                      />
                    </div>
                    {errors.interledgerLink && <p className="text-red-500 text-xs ml-1 font-medium">{errors.interledgerLink}</p>}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/60 ml-1">FORM OF IDENTIFICATION</label>
                    <div className="relative">
                      <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <select
                        name="identification"
                        value={formData.identification}
                        onChange={handleInputChange}
                        className="w-full bg-[#0F172A]/50 border border-white/10 rounded-2xl pl-12 pr-5 h-14 text-white focus:outline-none transition-all font-medium appearance-none"
                      >
                        <option value="National ID">National ID Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-white/60 ml-1">UPLOAD ID DOCUMENT</label>
                    <div className={`relative group transition-all`}>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        accept="image/*,.pdf"
                      />
                      <div className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group-hover:bg-white/5 ${errors.idFile ? "border-red-500/50 bg-red-500/5" : "border-white/10 group-hover:border-[#6366F1]/50"}`}>
                        <Upload className={`w-8 h-8 ${errors.idFile ? "text-red-500/60" : "text-white/20 group-hover:text-[#6366F1]/60"}`} />
                        <span className={`text-sm font-bold ${errors.idFile ? "text-red-500/60" : "text-white/40"}`}>
                          {idFile ? idFile.name : "Choose file or drag & drop"}
                        </span>
                      </div>
                    </div>
                    {errors.idFile && <p className="text-red-500 text-xs ml-1 font-medium">{errors.idFile}</p>}
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500 text-[11px] leading-relaxed">
                    Note: Your ID will be securely processed to verify your account. Once verified, you will be able to upload relief claims.
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={prevStep}
              className={`px-8 h-14 rounded-2xl font-bold transition-all ${currentStep === 1 ? "opacity-0 pointer-events-none" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white px-8 h-14 rounded-2xl font-[family-name:var(--font-heading)] font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_24px_rgba(99,102,241,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {currentStep === steps.length ? "Complete Setup" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
