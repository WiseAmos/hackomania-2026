"use client"
import { useEffect, useState } from "react"
import { ArrowLeft, Clock, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../lib/AuthContext"
import { db } from "../../lib/firebase"
import { ref, onValue, runTransaction } from "firebase/database"
import { ClaimManifest, UnifiedResponse } from "../../lib/pdl-engine"
import { calculateVotingPower } from "../../src/utils/voting"
import { PlatformStats, Wager } from "../../types/dashboard"

export default function ClaimsDashboard() {
  const { user } = useAuth()
  const [claims, setClaims] = useState<UnifiedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<UnifiedResponse | null>(null)
  const [votingState, setVotingState] = useState<{ [key: string]: boolean }>({})
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [wagers, setWagers] = useState<Wager[]>([])

  useEffect(() => {
    // 1. Fetch Stats & Wagers internally for Voting Power calculation once mounted
    const fetchDependencies = async () => {
      try {
        const statsRes = await fetch("/api/stats")
        const statsData = await statsRes.json()
        setPlatformStats(statsData)

        const wagersRes = await fetch("/api/wagers")
        const wagersData = await wagersRes.json()
        setWagers(wagersData)
      } catch (err) {
        console.error("Failed to load voting dependencies", err)
      }
    }
    fetchDependencies()

    // 2. Realtime Snapshot of Claims list
    const claimsRef = ref(db, "claims")
    const unsubscribe = onValue(claimsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const parsedClaims = Object.values(data) as UnifiedResponse[]
        // Sort by submission date DESC
        parsedClaims.sort((a, b) => {
          return new Date(b.claim_manifest.submission_date).getTime() - new Date(a.claim_manifest.submission_date).getTime()
        })
        setClaims(parsedClaims)
      } else {
        setClaims([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const toggleVote = async (claimId: string) => {
    if (!user) {
      alert("Please log in to vote.")
      return
    }

    if (!platformStats || !wagers) {
      alert("Voting power data still loading...")
      return
    }

    setVotingState((prev) => ({ ...prev, [claimId]: true }))

    try {
      // Calculate Power
      const votingPower = calculateVotingPower(user.uid, platformStats, wagers)
      // Reference to the nested votes object inside claim manifest
      const votesRef = ref(db, `claims/${claimId}/claim_manifest/votes`)

      await runTransaction(votesRef, (currentVotes) => {
        if (!currentVotes) {
          // fallback guard
          return { count: votingPower, voterIds: [user.uid] }
        }

        const voterIds = currentVotes.voterIds || []
        const hasVoted = voterIds.includes(user.uid)

        if (hasVoted) {
          // Remove Vote
          return {
            count: Math.max(0, currentVotes.count - votingPower),
            voterIds: voterIds.filter((id: string) => id !== user.uid)
          }
        } else {
          // Add Vote
          return {
            count: currentVotes.count + votingPower,
            voterIds: [...voterIds, user.uid]
          }
        }
      })
    } catch (err) {
      console.error("Atomic transaction failed", err)
      alert("Failed to register vote properly.")
    } finally {
      setVotingState((prev) => ({ ...prev, [claimId]: false }))
    }
  }

  // --- Utility render stuff for Details view ---
  const renderDetails = (manifest: ClaimManifest) => {
    if (manifest.category_details.property) {
      return (
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="font-semibold text-slate-300 mb-2">Property Details</h4>
          <p className="text-sm text-slate-400">Address: {manifest.category_details.property.home_address}</p>
          <p className="text-sm text-slate-400 mt-1">Registry Match: {manifest.category_details.property.registry_match ? "True" : "False"}</p>
        </div>
      )
    }
    if (manifest.category_details.presence) {
      return (
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="font-semibold text-slate-300 mb-2">Presence Logs</h4>
          <p className="text-sm text-slate-400">Telecom Data Base: {manifest.category_details.presence.telecom_tower_data}</p>
          <p className="text-sm text-slate-400 mt-1">GPS Points Logged: {manifest.category_details.presence.gps_location_logs?.length || 0}</p>
        </div>
      )
    }
    if (manifest.category_details.livelihood) {
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
        <Link href="/claims/submit" className="px-4 py-2 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/25">
          Submit New Claim
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
              Community Claims Review Hub
            </h1>
            <p className="text-slate-400 max-w-xl">
              Review community claims requiring distributed governance. Verified tiers are automatically paid. Pending tiers require community consensus to unlock funds.
            </p>
          </div>

          {user && platformStats && wagers.length > 0 && (
            <div className="bg-slate-800/50 border border-[#6366F1]/20 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm self-start md:self-auto">
              <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Available Voting Power</p>
                <p className="text-2xl font-bold text-white leading-none">
                  {calculateVotingPower(user.uid, platformStats, wagers)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {claims.map((claim) => {
              const manifest = claim.claim_manifest
              const isSelected = selectedClaim?.claim_manifest.claim_id === manifest.claim_id
              const hasVoted = user && manifest.votes?.voterIds?.includes(user.uid)
              const tierColor = claim.verification_results.triage_tier === 1 ? 'text-green-400 bg-green-400/10' :
                claim.verification_results.triage_tier === 2 ? 'text-yellow-400 bg-yellow-400/10' :
                  'text-orange-400 bg-orange-400/10';

              return (
                <div
                  key={manifest.claim_id}
                  className={`flex flex-col p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isSelected ? 'bg-slate-800/80 border-[#6366F1]/50 ring-1 ring-[#6366F1]/50' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10 cursor-pointer'
                    }`}
                  onClick={() => !isSelected && setSelectedClaim(claim)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColor}`}>
                      Tier {claim.verification_results.triage_tier}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(manifest.submission_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">{manifest.title}</h3>
                  <p className="text-xl font-bold text-[#6366F1] mb-4">${manifest.amount_requested.toLocaleString()}</p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Community Votes</span>
                      <span className="text-sm font-semibold text-slate-300">{manifest.votes?.count || 0} Votes</span>
                    </div>

                    {claim.verification_results.triage_tier !== 1 && (
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
                  </div>

                  {/* Expanded Detail View */}
                  {isSelected && (
                    <div className="mt-6 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{manifest.description}</p>
                      {renderDetails(manifest)}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClaim(null);
                        }}
                        className="mt-6 w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Close Details
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
