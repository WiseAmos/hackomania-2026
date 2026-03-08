"use client"
import { useEffect, useState } from "react"
import { ArrowLeft, Clock, ThumbsUp, X, MapPin, Calendar, FileText, Info, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAuth } from "../../lib/AuthContext"
import { PoolDisplay } from "@/components/PoolDisplay"
import { db } from "../../lib/firebase"
import { ref, onValue, runTransaction } from "firebase/database"
import { ClaimManifest, UnifiedResponse } from "../../lib/verification"
import { calculateVotingPower, VOTE_THRESHOLD } from "../../src/utils/voting"
import { PlatformStats, Wager } from "../../types/dashboard"
import TransactionLedger from "../../components/claims/TransactionLedger"

export default function ClaimsDashboard() {
  const { user } = useAuth()
  const [claims, setClaims] = useState<UnifiedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<UnifiedResponse | null>(null)
  const [votingState, setVotingState] = useState<{ [key: string]: boolean }>({})
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [wagers, setWagers] = useState<Wager[]>([])
  const [activeTab, setActiveTab] = useState<'claims' | 'ledger' | 'submit'>('claims')
  const [loadingDeps, setLoadingDeps] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 1. Realtime Stats & Wagers internally for Voting Power calculation
    const statsRef = ref(db, "pool/stats")
    const statsUnsub = onValue(statsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setPlatformStats(data)
        setLoadingDeps(false)
      }
    })

    const wagersRefHandle = ref(db, "wagers")
    const wagersUnsub = onValue(wagersRefHandle, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const parsedWagers = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) as Wager[]
        setWagers(parsedWagers)
      } else {
        setWagers([])
      }
      setLoadingDeps(false)
    })

    // 2. Realtime Snapshot of Claims list
    const claimsRef = ref(db, "claims")
    const unsubscribe = onValue(claimsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const allData = Object.values(data) as any[]
        // Filter out claims that are still in the initial "verifying" phase (missing manifest)
        const parsedClaims = allData.filter(c => c && c.claim_manifest) as UnifiedResponse[]
        
        // Sort by submission date DESC
        parsedClaims.sort((a, b) => {
          const dateA = a.claim_manifest?.submission_date ? new Date(a.claim_manifest.submission_date).getTime() : 0
          const dateB = b.claim_manifest?.submission_date ? new Date(b.claim_manifest.submission_date).getTime() : 0
          return dateB - dateA
        })
        setClaims(parsedClaims)

        // --- Proactive Consensus Auto-Disbursement ---
        parsedClaims.forEach(claim => {
          const manifest = claim.claim_manifest;
          const status = claim.status;
          const votes = manifest.votes?.count || 0;
          const needsConsensus = claim.verification_results.triage_tier !== 1;
          const isDisbursed = status === "fulfilled" || status === "DISBURSED";

          // If threshold reached but status hasn't updated yet, kick the sync route
          if (votes >= VOTE_THRESHOLD && !isDisbursed && needsConsensus) {
            console.log(`[Auto-Sync] Claim ${manifest.claim_id} met threshold (${votes}/${VOTE_THRESHOLD}). Triggering disbursement sync...`);
            fetch("/api/claims/vote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ claimId: manifest.claim_id, sync: true }),
            }).catch(e => console.error("Auto-sync failed:", e));
          }
        });
      } else {
        setClaims([])
      }
      setLoading(false)
    })

    setMounted(true)
    return () => {
      unsubscribe()
      statsUnsub()
      wagersUnsub()
    }
  }, [])

  const toggleVote = async (claimId: string) => {
    if (!user) {
      alert("Please log in to vote.")
      return
    }

    if (loadingDeps || !platformStats) {
      alert("Voting power data still loading...")
      return
    }

    const maxVotes = calculateVotingPower(user.uid, platformStats, wagers, claims.length)
    const usedVotesCount = claims.filter(c => c.claim_manifest.votes?.voterIds?.includes(user.uid)).length
    const claim = claims.find(c => c.claim_manifest.claim_id === claimId)
    const hasVotedLocal = user && claim?.claim_manifest.votes?.voterIds?.includes(user.uid)

    if (!hasVotedLocal && usedVotesCount >= maxVotes) {
      alert(`Voting limit reached (${maxVotes} total). Unvote another claim to vote here.`)
      return
    }

    const isDisbursed = claim?.verification_results.disbursement.status === "DISBURSED" || claim?.status === "fulfilled"
    if (isDisbursed || claim?.verification_results.triage_tier === 1) {
      alert("This claim has already been processed or disbursed.")
      return
    }

    setVotingState((prev) => ({ ...prev, [claimId]: true }))

    try {
      const res = await fetch("/api/claims/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, userId: user.uid }),
      });

      const data = await res.json();
      if (data.payoutTriggered) {
        alert("Wait! Enough community votes reached - payout has been triggered via ILP!");
      }
    } catch (err) {
      console.error("Atomic transaction failed", err)
      alert("Failed to register vote properly.")
    } finally {
      setVotingState((prev) => ({ ...prev, [claimId]: false }))
    }
  }

  // --- Utility render stuff for Details view ---
  const renderDetails = (manifest: ClaimManifest) => {
    if (manifest.category_details?.property) {
      return (
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="font-semibold text-slate-300 mb-2">Property Details</h4>
          <p className="text-sm text-slate-400">Address: {manifest.category_details.property.home_address}</p>
          <p className="text-sm text-slate-400 mt-1">Registry Match: {manifest.category_details.property.registry_match ? "True" : "False"}</p>
        </div>
      )
    }
    if (manifest.category_details?.presence) {
      return (
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="font-semibold text-slate-300 mb-2">Presence Logs</h4>
          <p className="text-sm text-slate-400">Telecom Data Base: {manifest.category_details.presence.telecom_tower_data}</p>
          <p className="text-sm text-slate-400 mt-1">GPS Points Logged: {manifest.category_details.presence.gps_location_logs?.length || 0}</p>
        </div>
      )
    }
    if (manifest.category_details?.livelihood) {
      return (
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="font-semibold text-slate-300 mb-2">Livelihood Disruption</h4>
          <p className="text-sm text-slate-400">Sector: {manifest.category_details.livelihood.sector}</p>
          <p className="text-sm text-slate-400 mt-1">UEN: {manifest.category_details.livelihood.business_uen}</p>
        </div>
      )
    }
    return <p className="text-sm text-slate-400 mt-4">No detailed evidence provided.</p>
  }

  return (
    <main className="min-h-screen bg-slate-900 relative font-sans text-slate-100 selection:bg-[#6366F1]/30 pb-20">
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0" />

      {/* Nav */}
      <nav className="w-full flex justify-between items-center py-6 px-6 md:px-10 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="hidden sm:block mx-4">
          <PoolDisplay />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/claims/submit" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-white/5">
            Submit New Claim
          </Link>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <Link href="/debug/ilp-test" className="px-4 py-2 rounded-lg bg-[#6366F1]/10 text-[#6366F1] text-sm font-bold transition-colors border border-[#6366F1]/20 hover:bg-[#6366F1]/20">
            Protocol Lab
          </Link>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button
            onClick={() => setActiveTab('claims')}
            className={`text-sm font-medium transition-colors ${activeTab === 'claims' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Active Claims
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`text-sm font-medium transition-colors ${activeTab === 'ledger' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Transaction Ledger
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
              {activeTab === 'claims' ? 'Community Claims Review Hub' : 'Transparency Audit Ledger'}
            </h1>
            <p className="text-slate-400 max-w-xl">
              {activeTab === 'claims'
                ? 'Review community claims requiring distributed governance. Verified tiers are automatically paid. Pending tiers require community consensus to unlock funds.'
                : 'Full audit logs of all community fund payouts and replenishment from resolved wagers. Every cent is tracked on-chain for maximum transparency.'}
            </p>
          </div>

          {user && platformStats && (
            <div className="bg-slate-800/50 border border-[#6366F1]/20 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm self-start md:self-auto">
              <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Available Voting Power</p>
                <p className="text-2xl font-bold text-white leading-none">
                  {Math.max(0, calculateVotingPower(user.uid, platformStats, wagers, claims.length) - claims.filter(c => c.claim_manifest.votes?.voterIds?.includes(user.uid)).length)}
                </p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6366F1]"></div>
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-slate-400">No active claims found.</p>
          </div>
        ) : (
          activeTab === 'ledger' ? (
            <TransactionLedger />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claims.map((claim) => {
                const manifest = claim.claim_manifest
                const hasVoted = user && manifest.votes?.voterIds?.includes(user.uid)
                const isDisbursed = claim.verification_results.disbursement.status === "DISBURSED" || claim.status === "fulfilled"
                const tierColor = isDisbursed ? 'text-green-400 bg-green-400/10' :
                  claim.verification_results.triage_tier === 1 ? 'text-green-400 bg-green-400/10' :
                  claim.verification_results.triage_tier === 2 ? 'text-yellow-400 bg-yellow-400/10' :
                    'text-orange-400 bg-orange-400/10';

                return (
                  <div
                    key={manifest.claim_id}
                    className="flex flex-col p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10 cursor-pointer"
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColor}`}>
                        {isDisbursed ? 'Disbursed' : `Tier ${claim.verification_results.triage_tier}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {mounted ? new Date(manifest.submission_date).toLocaleDateString() : "Loading..."}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">{manifest.title}</h3>
                    <p className="text-xl font-bold text-[#6366F1] mb-4">${manifest.amount_requested.toLocaleString()}</p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      {!isDisbursed && claim.verification_results.triage_tier !== 1 ? (
                        <div className="flex flex-col flex-1">
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Community Consensus</span>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-semibold text-slate-300">
                              {manifest.votes?.count || 0}/{VOTE_THRESHOLD}
                            </span>
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                              <div 
                                className="h-full bg-[#6366F1] transition-all duration-500" 
                                style={{ width: `${Math.min(100, ((manifest.votes?.count || 0) / VOTE_THRESHOLD) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col flex-1">
                           <span className="text-xs text-slate-500 uppercase tracking-wide">Final Status</span>
                           <span className="text-sm font-bold text-green-400">Automated Disbursement Completed</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {!isDisbursed && claim.verification_results.triage_tier !== 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVote(manifest.claim_id);
                            }}
                            disabled={votingState[manifest.claim_id]}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${votingState[manifest.claim_id] ? 'opacity-50 cursor-not-allowed bg-slate-700' :
                              hasVoted ? 'bg-[#6366F1] text-white' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white'
                              }`}
                          >
                            {votingState[manifest.claim_id] ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                            )}
                          </button>
                        )}
                        <button 
                          className="px-3 py-1.5 rounded-lg bg-[#6366F1]/10 text-[#6366F1] text-xs font-bold hover:bg-[#6366F1]/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(claim);
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClaim(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedClaim.verification_results.triage_tier === 1 ? 'text-green-400 bg-green-400/10' :
                    selectedClaim.verification_results.triage_tier === 2 ? 'text-yellow-400 bg-yellow-400/10' :
                    'text-orange-400 bg-orange-400/10'
                  }`}>
                    Tier {selectedClaim.verification_results.triage_tier}
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Claim Details
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedClaim(null)}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Basic Info */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedClaim.claim_manifest.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#6366F1]" /> {new Date(selectedClaim.claim_manifest.submission_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-[#6366F1]" /> ID: {selectedClaim.claim_manifest.claim_id.slice(0, 8)}...</span>
                    {selectedClaim.claim_manifest.disaster_info.location && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#6366F1]" /> {selectedClaim.claim_manifest.disaster_info.location}</span>
                    )}
                  </div>
                  <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5">
                    <p className="text-slate-300 leading-relaxed">{selectedClaim.claim_manifest.description}</p>
                  </div>
                </section>

                {/* Amount & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Requested Amount</p>
                    <p className="text-3xl font-bold text-[#6366F1]">${selectedClaim.claim_manifest.amount_requested.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Verification Status</p>
                    <p className="text-xl font-bold text-slate-200">{selectedClaim.verification_results.disbursement.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {/* Verification Results Details */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    <h4 className="font-bold text-slate-200">AI Assessment Audit</h4>
                  </div>
                  <div className="bg-slate-800/20 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-slate-400">Calculated Credibility Score</span>
                      <span className="text-2xl font-bold text-white">{selectedClaim.verification_results.calculated_score}/100</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-400 uppercase tracking-tight mb-2 flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> Logic Explanation
                      </h5>
                      <p className="text-sm text-slate-300 italic leading-relaxed">
                        "{selectedClaim.verification_results.analysis_explanation}"
                      </p>
                    </div>
                  </div>
                </section>

                {/* Category Details */}
                <section className="space-y-4">
                   <h4 className="font-bold text-slate-200">Evidence Verification</h4>
                   {renderDetails(selectedClaim.claim_manifest)}
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm font-bold text-slate-300">{selectedClaim.claim_manifest.votes?.count || 0} Community Votes</span>
                </div>
                <button 
                  onClick={() => setSelectedClaim(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
