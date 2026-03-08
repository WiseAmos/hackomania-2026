"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { PoolDisplay } from "@/components/PoolDisplay";
import { ref, update } from "firebase/database";
import { db } from "../../lib/firebase";
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Mail, 
  Home as HomeIcon, 
  DollarSign, 
  Calendar, 
  Link as LinkIcon, 
  ShieldCheck, 
  ShieldAlert,
  Upload,
  CheckCircle2,
  Edit2,
  LogOut
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [idFile, setIdFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    homeAddress: user?.homeAddress || "",
    householdIncome: user?.householdIncome || "",
    interledgerLink: user?.interledgerLink || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.homeAddress) newErrors.homeAddress = "Home address is required";
    if (!formData.interledgerLink) newErrors.interledgerLink = "ILP link is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validate()) return;
    setIsSaving(true);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKYCUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setIdFile(file);
    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(async () => {
      try {
        const userRef = ref(db, `users/${user.uid}`);
        await update(userRef, {
          kycVerified: true,
          identityDocUrl: "https://example.com/id-doc-uploaded.jpg", // Mock URL
        });
      } catch (error) {
        console.error("Error updating KYC:", error);
      } finally {
        setIsUploading(false);
      }
    }, 1500);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white pb-20">
      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="w-full h-20 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-50">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Arena
        </Link>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight">User Profile</h1>
        <div className="hidden sm:block">
          <PoolDisplay />
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold border border-transparent hover:border-white/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & KYC Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1E293B]/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#FF4D4D] p-1 shadow-[0_0_32px_rgba(99,102,241,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#1E293B] flex items-center justify-center overflow-hidden">
                    {user.avatar?.startsWith('http') ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold">{user.avatar || user.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
                {user.kycVerified && (
                  <div className="absolute bottom-0 right-0 bg-[#10B981] p-1.5 rounded-full border-4 border-[#1E293B] shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1">{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</h2>
              <p className="text-white/40 font-medium mb-6">{user.handle}</p>
              
              <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold border ${user.kycVerified ? "bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                {user.kycVerified ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verified Citizen
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Identity Unverified
                  </>
                )}
              </div>
            </div>

            {/* KYC Upload Card */}
            {!user.kycVerified && (
              <div className="bg-gradient-to-br from-[#1E293B]/50 to-[#0F172A]/50 border border-white/10 rounded-[32px] p-8 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-yellow-500" />
                  Complete KYC
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Upload your <strong>{user.identification || "Identification"}</strong> to unlock full Arena capabilities.
                </p>
                
                <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-white/10 hover:border-[#6366F1]/50 hover:bg-white/5 transition-all">
                  <input
                    type="file"
                    onChange={handleKYCUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    accept="image/*,.pdf"
                  />
                  <div className="h-24 flex flex-col items-center justify-center gap-2">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
                    ) : idFile ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                        <span className="text-xs text-[#10B981] font-bold">File Ready</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-white/30 group-hover:text-[#6366F1]/60" />
                        <span className="text-xs font-bold text-white/30">Upload ID</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {user.kycVerified && (
              <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-[32px] p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto" />
                <h3 className="font-bold text-[#10B981]">Verification Complete</h3>
                <p className="text-[#10B981]/60 text-xs">Your identity document has been approved. You are now eligible for relief distributions.</p>
              </div>
            )}
          </div>

          {/* Right Column: Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#1E293B]/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 overflow-hidden relative">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <User className="w-6 h-6 text-[#6366F1]" />
                  Profile Information
                </h3>
                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isEditing ? "bg-[#10B981] text-white" : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"}`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <CheckCircle2 className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">First Name</label>
                    <div className="relative">
                      <input
                        name="firstName"
                        value={isEditing ? formData.firstName : (user.firstName || "Not provided")}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl px-5 h-14 transition-all font-medium ${errors.firstName ? "border-red-500/50" : isEditing ? "border-[#6366F1]/30 focus:border-[#6366F1] text-white" : "border-white/5 text-white/60 grayscale"}`}
                      />
                      {errors.firstName && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.firstName}</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Last Name</label>
                    <div className="relative">
                      <input
                        name="lastName"
                        value={isEditing ? formData.lastName : (user.lastName || "Not provided")}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl px-5 h-14 transition-all font-medium ${errors.lastName ? "border-red-500/50" : isEditing ? "border-[#6366F1]/30 focus:border-[#6366F1] text-white" : "border-white/5 text-white/60 grayscale"}`}
                      />
                      {errors.lastName && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.lastName}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input
                      value={user.email}
                      disabled
                      className="w-full bg-[#0F172A]/30 border border-white/5 rounded-2xl pl-12 pr-5 h-14 text-white/40 font-medium italic cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Home Address</label>
                  <div className="relative">
                    <HomeIcon className="absolute left-5 top-6 w-5 h-5 text-white/20" />
                    <textarea
                      name="homeAddress"
                      value={isEditing ? formData.homeAddress : (user.homeAddress || "Not provided")}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full bg-[#0F172A]/50 border rounded-2xl pl-12 pr-5 py-5 h-24 transition-all font-medium resize-none ${errors.homeAddress ? "border-red-500/50" : isEditing ? "border-[#6366F1]/30 focus:border-[#6366F1] text-white" : "border-white/5 text-white/60 grayscale"}`}
                    />
                    {errors.homeAddress && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.homeAddress}</p>}
                  </div>
                </div>

                {/* Important Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                   <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Household Income</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <select
                        name="householdIncome"
                        value={isEditing ? formData.householdIncome : user.householdIncome}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl pl-12 pr-5 h-14 transition-all font-medium appearance-none ${isEditing ? "border-[#6366F1]/30 focus:border-[#6366F1] text-white" : "border-white/5 text-white/60 grayscale"}`}
                      >
                        <option value="">Not selected</option>
                        <option value="< 30k">Less than $30,000</option>
                        <option value="30k-60k">$30,000 - $60,000</option>
                        <option value="60k-100k">$60,000 - $100,000</option>
                        <option value="100k+">More than $100,000</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Interledger Link (ILP)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input
                        name="interledgerLink"
                        value={isEditing ? formData.interledgerLink : (user.interledgerLink || "Not provided")}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full bg-[#0F172A]/50 border rounded-2xl pl-12 pr-5 h-14 transition-all font-medium ${errors.interledgerLink ? "border-red-500/50" : isEditing ? "border-[#6366F1]/30 focus:border-[#6366F1] text-white" : "border-white/5 text-white/60 grayscale"}`}
                      />
                      {errors.interledgerLink && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.interledgerLink}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-12 p-6 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-2xl flex items-start gap-4">
                <div className="bg-[#6366F1] p-2 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Secure Identity</h4>
                  <p className="text-white/40 text-xs leading-relaxed">Your personal data is encrypted and only used for KYC/compliance purposes in accordance with the Global Transparency Initiative.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
