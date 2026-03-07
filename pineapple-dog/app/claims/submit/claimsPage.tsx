"use client"
import { useCallback, useEffect, useState } from "react"
import s from "./claimsPage.module.css"
import { ArrowLeft, BriefcaseBusiness, House, Locate, Upload, Loader2 } from 'lucide-react';
import { useDropzone } from "react-dropzone"
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext"

export default function ClaimsClientPage(
  { currentDisasters }:
    { currentDisasters: string[] }
) {
  const [step, setStep] = useState(0);
  /* 
  step 0: select disaster
  step 1: choose impact type
  step 2: upload evidence
  step 3: analyse evidence
  */
  const MAX_STEP = 4;

  const [disaster, setDisaster] = useState<null | string>(null);
  const [impact, setImpact] = useState<null | string>(null);
  const [image, setImage] = useState<null | string>(null);

  type FormData = {
    title: string;
    description: string;
    amount: number;
    disasterDate: string;
    disasterTime: string;
    disasterLocation: string;
    disasterDetails: string;
    homeAddress: string;
    businessUen: string;
    businessSector: string;
  };

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    amount: 50,
    disasterDate: new Date().toISOString().split('T')[0],
    disasterTime: "",
    disasterLocation: "",
    disasterDetails: "",
    homeAddress: "",
    businessUen: "",
    businessSector: ""
  });

  function updateForm(field: keyof FormData, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function selectDisaster(d: string) {
    setDisaster(d);
  }

  function decrementStep() {
    if (step >= 1) setStep(prev => prev - 1);
  }

  function incrementStep() {
    if (step < MAX_STEP) setStep(prev => prev + 1);
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);

  const { user } = useAuth();

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    setStep(5);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount: formData.amount,
          description: formData.description,
          reliefFund: disaster,
          wagerTitle: formData.title || "Community Relief Claim",
          claimantWallet: user.walletAddress || "test.wallet.near",
          disaster_info: {
            name: disaster,
            date: formData.disasterDate,
            time: formData.disasterTime,
            location: formData.disasterLocation,
            details: formData.disasterDetails
          },
          selected_category: impact?.toUpperCase(),
          category_details: {
            property: impact === "property" ? { home_address: formData.homeAddress, registry_match: true, satellite_damage_img: "mock_img.jpg" } : undefined,
            presence: impact === "presence" ? { gps_location_logs: [], telecom_tower_data: "matched", geotagged_media: "mock_img.jpg" } : undefined,
            livelihood: impact === "livelihood" ? { business_uen: formData.businessUen, sector: formData.businessSector, income_loss_proof: "mock_doc.pdf" } : undefined
          }
        })
      });

      const data = await res.json();
      if (data.verification) {
        setVerificationResult(data.verification.verification_results);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    // optional auto-advance if we strictly want it, but usually standard forms require clicking Next manually. 
    // Disabled auto-advance to let users review the forms before proceeding.
  }, [disaster])

  useEffect(() => {
  }, [impact])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const base64 = await fileToBase64(acceptedFiles[0])
    setImage(base64)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": []
    },
    maxFiles: 1
  })

  // Mock scoring initially
  const recordAnalysis = 0.27
  const gpsAnalysis = 0.27
  const businessAnalysis = 0.27
  const totalScore = 0.27

  return (
    <main className="min-h-screen bg-slate-900 relative font-sans text-slate-100 selection:bg-[#6366F1]/30 pb-20">
      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0" />

      {/* Nav */}
      <nav className="w-full flex justify-between items-center py-6 px-6 md:px-10 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

      </nav>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto mt-12 px-4 z-10 relative">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 w-full shadow-2xl">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-white mb-8 text-center">Submit a claim</h1>
          <div className="flex flex-col gap-6 min-h-[300px]">
            {step === 0 &&
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#6366F1] mb-2">Select active disaster ({currentDisasters.length} results)</h2>
                <div className="flex flex-col gap-3">
                  {currentDisasters.map((d) => (
                    <div
                      key={d}
                      onClick={() => setDisaster(d)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${disaster === d
                          ? "bg-[#6366F1]/20 border-[#6366F1] text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            }
            {step === 1 &&
              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-bold text-[#6366F1] mb-2">Claim &amp; Disaster Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Claim Title</label>
                    <input type="text" value={formData.title} onChange={e => updateForm("title", e.target.value)} placeholder="e.g., Flash Flood Damage" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Amount Requested ($)</label>
                    <input type="number" value={formData.amount} onChange={e => updateForm("amount", Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">General Description</label>
                  <textarea value={formData.description} onChange={e => updateForm("description", e.target.value)} rows={2} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors placeholder:text-slate-600" placeholder="A short description of what you are claiming for..."></textarea>
                </div>
                <div className="h-px w-full bg-white/5 my-2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Disaster Date</label>
                    <input type="date" value={formData.disasterDate} onChange={e => updateForm("disasterDate", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Disaster Time</label>
                    <input type="time" value={formData.disasterTime} onChange={e => updateForm("disasterTime", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Disaster Location</label>
                  <input type="text" value={formData.disasterLocation} onChange={e => updateForm("disasterLocation", e.target.value)} placeholder="City, Region, or exact coordinates" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Disaster Specifics</label>
                  <textarea value={formData.disasterDetails} onChange={e => updateForm("disasterDetails", e.target.value)} rows={2} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors placeholder:text-slate-600" placeholder="Specific details about the disaster event itself..."></textarea>
                </div>
              </div>
            }
            {step === 2 &&
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#6366F1] mb-2">Choose Impact Type</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div onClick={() => setImpact("property")} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl cursor-pointer transition-all border ${impact === "property" ? "bg-[#6366F1]/20 border-[#6366F1] text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                    <House className="w-8 h-8" />
                    <span className="font-medium">Property</span>
                  </div>
                  <div onClick={() => setImpact("presence")} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl cursor-pointer transition-all border ${impact === "presence" ? "bg-[#6366F1]/20 border-[#6366F1] text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                    <Locate className="w-8 h-8" />
                    <span className="font-medium">Presence</span>
                  </div>
                  <div onClick={() => setImpact("livelihood")} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl cursor-pointer transition-all border ${impact === "livelihood" ? "bg-[#6366F1]/20 border-[#6366F1] text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                    <BriefcaseBusiness className="w-8 h-8" />
                    <span className="font-medium">Livelihood</span>
                  </div>
                </div>
              </div>
            }
            {step === 3 &&
              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-bold text-[#6366F1] mb-2">Category Verification Details</h2>
                {impact === "property" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-400 leading-relaxed mb-2">Please provide your home address so we can cross-reference it with the disaster damage zone.</p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Home Address</label>
                      <input type="text" value={formData.homeAddress} onChange={e => updateForm("homeAddress", e.target.value)} placeholder="Full property location" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                    </div>
                  </div>
                )}
                {impact === "presence" && (
                  <div className="flex flex-col gap-4 items-center justify-center h-40 bg-black/20 border border-white/5 rounded-2xl p-6 text-center">
                    <Locate className="w-10 h-10 text-[#6366F1]/50" />
                    <div>
                      <h3 className="font-bold text-slate-200 mb-1">GPS Data Authorized</h3>
                      <p className="text-sm text-slate-400">Your secure device location logs will be attached to verify your presence at the event.</p>
                    </div>
                  </div>
                )}
                {impact === "livelihood" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-400 leading-relaxed mb-2">Please provide your business registry details so we can verify the operational disruption.</p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Business UEN (Registry ID)</label>
                      <input type="text" value={formData.businessUen} onChange={e => updateForm("businessUen", e.target.value)} placeholder="e.g. 201827464C" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">Business Sector</label>
                      <input type="text" value={formData.businessSector} onChange={e => updateForm("businessSector", e.target.value)} placeholder="e.g. F&B, Logistics, Retail" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors" />
                    </div>
                  </div>
                )}
              </div>
            }
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#6366F1] mb-2">Upload Evidence</h2>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-white/60 ml-1">UPLOAD EVIDENCE</label>
                  <div {...getRootProps()} className="relative group transition-all">
                    <input {...getInputProps()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    <div className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${!image
                        ? "border-white/20 bg-slate-800 group-hover:border-[#6366F1]/50 group-hover:bg-slate-700/50"
                        : "border-green-400 bg-green-900/20"
                      }`}>
                      <Upload className={`w-8 h-8 ${!image ? "text-white/20 group-hover:text-[#6366F1]/60" : "text-green-400/60"}`} />
                      <span className={`text-sm font-bold ${!image ? "text-white/40" : "text-green-400/60"}`}>
                        {image ? "File selected" : "Choose file or drag & drop"}
                      </span>
                    </div>
                  </div>
                </div>

                {image && (
                  <div className="mt-6 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-white/60 ml-1">PREVIEW</h3>
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                      <img src={image} alt="evidence" className="w-full h-auto max-h-[300px] object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
            {step === 5 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#6366F1] mb-6">{isSubmitting ? "Verifying Claim..." : "Verification Result"}</h2>

                {isSubmitting ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <Loader2 className="w-12 h-12 text-[#6366F1] animate-spin mb-4" />
                    <p className="text-slate-400">Gemini AI is auditing your claim manifest...</p>
                  </div>
                ) : verificationResult ? (
                  <div className="flex flex-col items-center gap-6 w-full">
                    {verificationResult.validator_data && (
                      <div className="w-full bg-slate-800/80 rounded-2xl p-6 border border-white/5 shadow-xl mb-4">
                        <h3 className={`text-center font-bold text-lg mb-6 ${verificationResult.validator_data.verification_anchor.disaster_verified ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {verificationResult.validator_data.verification_anchor.disaster_verified ? '✓ Disaster Verified' : '❌ Disaster Not Found'}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center h-8 flex items-end justify-center">IoT Sensors<br/>(Weather/Seismic)</div>
                            <div className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center bg-black/40 ${verificationResult.validator_data.verification_anchor.data_sources.iot_sensor_match === 'PASS' ? 'border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                              <span className={`text-sm font-bold ${verificationResult.validator_data.verification_anchor.data_sources.iot_sensor_match === 'PASS' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                                {verificationResult.validator_data.verification_anchor.data_sources.iot_sensor_match}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center h-8 flex items-end justify-center">News<br/>Reports</div>
                            <div className="w-16 h-16 rounded-full border-[3px] border-[#6366F1] flex items-center justify-center bg-black/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                              <span className="text-xl font-bold text-white">
                                {verificationResult.validator_data.verification_anchor.data_sources.news_reports_found}
                              </span>
                            </div>
                          </div>
                      
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center h-8 flex items-end justify-center">Oracle<br/>Consensus</div>
                            <div className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center bg-black/40 ${verificationResult.validator_data.verification_anchor.data_sources.oracle_consensus >= 50 ? 'border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                              <span className="text-sm font-bold text-white">
                                {verificationResult.validator_data.verification_anchor.data_sources.oracle_consensus}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {verificationResult.calculated_score > 0 && (
                      <div className="w-full bg-slate-800/80 rounded-2xl p-6 border border-white/5 shadow-xl mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Records<br/>Analysis</div>
                            <div className="w-16 h-16 rounded-full border flex items-center justify-center bg-black/20 border-white/10">
                              <span className="text-sm font-bold text-slate-300">0.27</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">GPS<br/>Data</div>
                            <div className="w-16 h-16 rounded-full border flex items-center justify-center bg-black/20 border-white/10">
                              <span className="text-sm font-bold text-slate-300">0.27</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Business<br/>Registry</div>
                            <div className="w-16 h-16 rounded-full border flex items-center justify-center bg-black/20 border-white/10">
                              <span className="text-sm font-bold text-slate-300">0.27</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="w-32 h-32 mt-4 rounded-full border-8 border-[#6366F1] flex flex-col items-center justify-center bg-[#6366F1]/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                      <div className="text-3xl font-bold text-white">{verificationResult.calculated_score}</div>
                      <div className="text-xs text-white/70">AI Confidence</div>
                    </div>

                    <div className="w-full grid gap-3">
                      <div className="flex justify-between p-4 bg-slate-800/50 rounded-xl">
                        <span className="text-slate-400">Triage Tier:</span>
                        <span className="font-bold text-[#10B981]">Tier {verificationResult.triage_tier}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-slate-800/50 rounded-xl">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-bold text-[#10B981]">{verificationResult.disbursement.status}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-slate-800/50 rounded-xl">
                        <span className="text-slate-400">Payout:</span>
                        <span className="font-bold text-[#10B981]">{verificationResult.disbursement.payout_percentage}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-xl p-6 mt-4">
                      <h3 className="text-xs uppercase tracking-wider text-[#6366F1] mb-3">AI Analysis Explanation</h3>
                      <div className="text-sm line-height-relaxed text-slate-300 italic">
                        {verificationResult.analysis_explanation}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full mt-6">
                      <Link href="/dashboard" className="px-8 py-3 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 text-center transition-all border border-white/10">
                        Back to Portfolio
                      </Link>
                      <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-slate-500 hover:text-white underline transition-colors">
                        {showRaw ? "Hide Raw AI Output" : "Show Raw AI Output"}
                      </button>
                    </div>

                    {showRaw && (
                      <div className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mt-2 overflow-x-auto">
                        <pre className="font-mono text-xs text-[#10B981] whitespace-pre-wrap break-all">
                          {JSON.stringify(verificationResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-10">Failed to retrieve verification result. Please check your dashboard.</p>
                )}
              </div>
            )}
          </div>
          {step < 5 && (
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
              <button disabled={step === 0} onClick={decrementStep} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all">
                Previous
              </button>

              {step < MAX_STEP ? (
                <button disabled={step === MAX_STEP || (step === 0 && !disaster) || (step === 2 && !impact)} onClick={incrementStep} className="px-8 py-2.5 rounded-xl font-bold text-sm bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 disabled:shadow-none">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting || !image} className="px-8 py-2.5 rounded-xl font-bold text-sm bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50">
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}