"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Swords,
    ArrowLeft,
    Wallet,
    Trophy,
    Clock,
    CheckCircle,
    Loader2,
    Zap,
} from "lucide-react";
import Link from "next/link";

type Step = "form" | "redirecting" | "authorized" | "waiting_opponent";

export default function WagerPage() {
    const [step, setStep] = useState<Step>("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wagerId, setWagerId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [stakeAmount, setStakeAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [myWallet, setMyWallet] = useState("");
    const [opponentWallet, setOpponentWallet] = useState("");

    // Handle Fynbos redirect callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const interactRef = params.get("interact_ref");
        const hash = params.get("hash");
        const player = params.get("player");
        const returnedWagerId = params.get("wagerId");

        // Restore form state from session
        const savedForm = sessionStorage.getItem("pendingShowdown");
        if (savedForm) {
            const parsed = JSON.parse(savedForm);
            setTitle(parsed.title || "");
            setDescription(parsed.description || "");
            setStakeAmount(parsed.stakeAmount || "");
            setDeadline(parsed.deadline || "");
            setMyWallet(parsed.myWallet || "");
            setOpponentWallet(parsed.opponentWallet || "");
        }

        if (interactRef && hash && returnedWagerId) {
            setWagerId(returnedWagerId);

            // Retrieve stored grantId
            const grantId = sessionStorage.getItem("pendingGrantId");

            if (grantId) {
                // Send interact_ref to backend
                fetch("/api/ilp/interact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ grantId, interact_ref: interactRef, hash }),
                })
                    .then((res) => res.json())
                    .then(() => {
                        sessionStorage.removeItem("pendingGrantId");
                        sessionStorage.removeItem("pendingShowdown");
                        setStep("authorized");
                        // Clean URL
                        window.history.replaceState(
                            {},
                            document.title,
                            window.location.pathname
                        );
                    })
                    .catch((err) => {
                        console.error("Failed to capture interact_ref", err);
                        setError("Failed to complete authorization");
                    });
            }
        }
    }, []);

    const handleCreateShowdown = async () => {
        if (!title || !stakeAmount || !myWallet || !opponentWallet || !deadline) {
            setError("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const amountCents = Math.round(parseFloat(stakeAmount) * 100).toString();

            // Save form state before redirect
            sessionStorage.setItem(
                "pendingShowdown",
                JSON.stringify({
                    title,
                    description,
                    stakeAmount,
                    deadline,
                    myWallet,
                    opponentWallet,
                })
            );

            const params = new URLSearchParams({
                walletAddress: myWallet,
                amount: amountCents,
                player: "player1",
                title,
                description,
                deadline,
                opponentWallet,
            });

            const res = await fetch(`/api/ilp/grant?${params}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to request grant");
            }

            // Store grantId for callback
            sessionStorage.setItem("pendingGrantId", data.grantId);

            setStep("redirecting");

            // Redirect to Fynbos authorization
            window.location.href = data.grantUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 relative font-sans text-slate-100 selection:bg-[#6366F1]/30">
            {/* Background Ambient Glow */}
            <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0" />

            {/* Nav */}
            <nav className="w-full flex justify-between items-center py-6 px-6 md:px-10 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Arena</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-[#6366F1]" />
                    <span className="font-[family-name:var(--font-heading)] font-bold text-lg">
                        New Showdown
                    </span>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-20 relative z-10">
                <AnimatePresence mode="wait">
                    {/* ─── STEP 1: Form ─── */}
                    {step === "form" && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <motion.div
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#FF4D4D] mb-4 shadow-[0_0_32px_rgba(99,102,241,0.3)]"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Swords className="w-8 h-8 text-white" />
                                </motion.div>
                                <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-2">
                                    Create a Showdown
                                </h1>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    Challenge a friend. Both of you stake real money. The loser&apos;s
                                    stake fuels disaster relief. The winner gets half back.
                                </p>
                            </div>

                            {/* Form Card */}
                            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 space-y-5 backdrop-blur-sm">
                                {/* Title */}
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                        Challenge Title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. First to run 5km this week"
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                        Description{" "}
                                        <span className="text-slate-600">(optional)</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Rules and conditions..."
                                        rows={2}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all resize-none"
                                    />
                                </div>

                                {/* Amount + Deadline */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                            Stake Per Player (SGD)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#06B6D4] font-bold text-sm">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                                placeholder="10.00"
                                                min="0.01"
                                                step="0.01"
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                            Deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Wallet Addresses */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                            <Wallet className="w-3 h-3 inline mr-1" />
                                            Your Wallet Address
                                        </label>
                                        <input
                                            type="text"
                                            value={myWallet}
                                            onChange={(e) => setMyWallet(e.target.value)}
                                            placeholder="$ilp.interledger-test.dev/james"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                            <Swords className="w-3 h-3 inline mr-1" />
                                            Opponent&apos;s Wallet Address
                                        </label>
                                        <input
                                            type="text"
                                            value={opponentWallet}
                                            onChange={(e) => setOpponentWallet(e.target.value)}
                                            placeholder="$ilp.interledger-test.dev/opponent"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Fee Disclosure */}
                                <div className="bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Zap className="w-4 h-4 text-[#6366F1] mt-0.5 shrink-0" />
                                        <div className="text-xs text-slate-300 leading-relaxed">
                                            <strong className="text-white">How it works:</strong> Both
                                            players authorize a ${stakeAmount || "0"} hold. The winner
                                            gets their money back + 50% of the loser&apos;s stake. The
                                            remaining 50% goes to the{" "}
                                            <span className="text-[#06B6D4] font-semibold">
                                                Community Relief Pool
                                            </span>
                                            .
                                        </div>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleCreateShowdown}
                                    disabled={
                                        isSubmitting ||
                                        !title ||
                                        !stakeAmount ||
                                        !myWallet ||
                                        !opponentWallet ||
                                        !deadline
                                    }
                                    className="w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-[family-name:var(--font-heading)] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Swords className="w-4 h-4" />
                                    )}
                                    {isSubmitting ? "Connecting to Wallet..." : "Create Showdown"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── STEP 2: Redirecting ─── */}
                    {step === "redirecting" && (
                        <motion.div
                            key="redirecting"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <Loader2 className="w-12 h-12 text-[#6366F1] animate-spin mx-auto mb-4" />
                            <p className="text-white text-lg font-semibold">
                                Redirecting to your wallet...
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                Authorize the stake hold on the Interledger testnet.
                            </p>
                        </motion.div>
                    )}

                    {/* ─── STEP 3: Authorized ─── */}
                    {step === "authorized" && (
                        <motion.div
                            key="authorized"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30"
                            >
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </motion.div>

                            <div>
                                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white mb-2">
                                    Stake Authorized!
                                </h2>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                    Your ${stakeAmount || "0"} SGD hold has been authorized. The
                                    money stays in your wallet until the showdown is resolved.
                                </p>
                            </div>

                            {wagerId && (
                                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 max-w-sm mx-auto">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                                        Showdown ID
                                    </p>
                                    <p className="text-[#06B6D4] font-mono text-xs break-all">
                                        {wagerId}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 justify-center pt-2">
                                <Link
                                    href="/dashboard"
                                    className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                >
                                    Back to Arena
                                </Link>
                                <button
                                    onClick={() => {
                                        setStep("form");
                                        setTitle("");
                                        setDescription("");
                                        setStakeAmount("");
                                        setDeadline("");
                                        setMyWallet("");
                                        setOpponentWallet("");
                                    }}
                                    className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_16px_rgba(99,102,241,0.3)]"
                                >
                                    Create Another
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
