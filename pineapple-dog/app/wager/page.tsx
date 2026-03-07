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
import { useAuth } from "../../lib/AuthContext";

type Step = "form" | "redirecting" | "authorized" | "waiting_opponent";

export default function WagerPage() {
    const { user } = useAuth();
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
    const [opponentUser, setOpponentUser] = useState<any>(null); // Replaces opponentWallet
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [challengeType, setChallengeType] = useState<"global" | "competitive">("global");
    const [isStreak, setIsStreak] = useState(false);

    // Pre-fill wallet from profile
    useEffect(() => {
        if (user && !myWallet) {
            setMyWallet(user.interledgerLink || user.walletAddress || "");
        }
    }, [user, myWallet]);

    // Fetch users on mount for the autocomplete dropdown
    useEffect(() => {
        fetch("/api/users")
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Failed to fetch users", err));
    }, []);

    // 1. Handle Fynbos redirect callback (Capture interaction)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const interactRef = params.get("interact_ref");
        const hash = params.get("hash");
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
            setOpponentUser(parsed.opponentUser || null);
            setImageUrl(parsed.imageUrl || "");
            setChallengeType(parsed.challengeType || "global");
            setIsStreak(parsed.isStreak || false);
        }

        if (interactRef && hash && returnedWagerId) {
            const grantId = sessionStorage.getItem("pendingGrantId");

            if (grantId) {
                // Send interact_ref to backend to finalize the grant
                fetch("/api/ilp/interact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ grantId, interact_ref: interactRef, hash }),
                })
                    .then((res) => res.json())
                    .then(() => {
                        setWagerId(returnedWagerId); // This triggers the next effect
                    })
                    .catch((err) => {
                        console.error("Failed to capture interact_ref", err);
                        setError("Failed to complete authorization");
                    });
            }
        }
    }, []);

    // 2. Persist wager once we have the Wager ID AND the User is fully loaded
    useEffect(() => {
        if (wagerId && user) {
            const savedForm = sessionStorage.getItem("pendingShowdown");
            const restored = savedForm ? JSON.parse(savedForm) : {};
            const grantId = sessionStorage.getItem("pendingGrantId");

            fetch("/api/wagers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: restored.title || "Untitled Challenge",
                    description: restored.description || "",
                    deadline: restored.deadline || "",
                    poolExpiry: (() => {
                        if (!restored.deadline) return "";
                        const d = new Date(restored.deadline);
                        d.setFullYear(d.getFullYear() + 1);
                        return d.toISOString();
                    })(),
                    stakeAmount: parseFloat(restored.stakeAmount || "0"),
                    wagerId: wagerId,
                    grantId,
                    imageUrl: restored.imageUrl || "",
                    type: restored.challengeType || "global",
                    isStreak: restored.isStreak || false,
                    player1: {
                        uid: user.uid,
                        name: user.name,
                        avatar: user.avatar,
                        handle: user.handle,
                        walletAddress: restored.myWallet || "",
                        stakedAmount: parseFloat(restored.stakeAmount || "0"),
                        status: "alive"
                    },
                    player2: restored.challengeType === "competitive" ? restored.opponentUser : null,
                    participants: restored.challengeType === "competitive" ? [
                        {
                            uid: user.uid,
                            name: user.name,
                            avatar: user.avatar,
                            handle: user.handle,
                            walletAddress: restored.myWallet || "",
                            stakedAmount: parseFloat(restored.stakeAmount || "0"),
                            grantId,
                            status: "alive",
                            joinedAt: new Date().toISOString()
                        },
                        {
                            ...restored.opponentUser,
                            status: "awaiting_auth",
                            joinedAt: new Date().toISOString()
                        }
                    ] : [
                        {
                            uid: user.uid,
                            name: user.name,
                            avatar: user.avatar,
                            handle: user.handle,
                            walletAddress: restored.myWallet || "",
                            stakedAmount: parseFloat(restored.stakeAmount || "0"),
                            grantId,
                            status: "alive",
                            joinedAt: new Date().toISOString()
                        }
                    ]
                }),
            })
                .then(() => {
                    sessionStorage.removeItem("pendingGrantId");
                    sessionStorage.removeItem("pendingShowdown");
                    setStep("authorized");
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch(e => console.error("Failed to persist wager:", e));
        }
    }, [wagerId, user]);

    const handleCreateShowdown = async () => {
        if (!title || !stakeAmount || !myWallet || !deadline) {
            setError("Please fill in all fields");
            return;
        }

        if (challengeType === "competitive" && !opponentUser) {
            setError("Please select an opponent for a Direct Showdown");
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
                    imageUrl,
                    challengeType,
                    isStreak,
                    opponentUser: challengeType === "competitive" ? opponentUser : null,
                })
            );

            const params = new URLSearchParams({
                walletAddress: myWallet,
                amount: amountCents,
                player: "player1",
                title,
                description,
                deadline,
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
                        {challengeType === "global" ? "Global Arena" : "Direct Showdown"}
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
                                    {challengeType === "global" ? "Declare Global Challenge" : "Challenge a Friend"}
                                </h1>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    {challengeType === "global" 
                                        ? "Whoever on the platform can take up your challenge. The first to submit valid proof wins."
                                        : "Directly challenge an opponent to a high-stakes duel. Only the bravest win."}
                                </p>
                            </div>

                            {/* Challenge Type Selector */}
                            <div className="flex p-1 bg-slate-800/80 rounded-2xl border border-white/5 max-w-md mx-auto">
                                <button
                                    onClick={() => setChallengeType("global")}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${challengeType === "global" ? "bg-[#6366F1] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                                >
                                    Global Arena
                                </button>
                                <button
                                    onClick={() => setChallengeType("competitive")}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${challengeType === "competitive" ? "bg-[#6366F1] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                                >
                                    Direct Showdown
                                </button>
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

                                {/* Banner Image Upload */}
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                        Showdown Banner Image
                                        <span className="text-slate-600 ml-1">(optional)</span>
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className={`relative flex items-center justify-center w-28 h-20 rounded-xl border-2 border-dashed ${imageUrl ? 'border-[#6366F1] bg-[#6366F1]/10' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800'} cursor-pointer group overflow-hidden transition-all`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    // Resize and compress string logic inline
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const img = new Image();
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            const ctx = canvas.getContext('2d');
                                                            const MAX_WIDTH = 800;
                                                            const MAX_HEIGHT = 800;
                                                            let width = img.width;
                                                            let height = img.height;
                                                            if (width > height) {
                                                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                                            } else {
                                                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                                                            }
                                                            canvas.width = width;
                                                            canvas.height = height;
                                                            ctx?.drawImage(img, 0, 0, width, height);
                                                            const compressed = canvas.toDataURL("image/jpeg", 0.7);
                                                            setImageUrl(compressed);
                                                        };
                                                        img.src = event.target?.result as string;
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                            {imageUrl ? (
                                                <img src={imageUrl} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    <span className="text-[10px] font-bold">Upload</span>
                                                </div>
                                            )}
                                        </label>
                                        <div className="flex-1 text-xs text-slate-500 leading-snug">
                                            Upload an image to make this challenge stand out on the Arena feed. Square or landscape images work best.
                                        </div>
                                    </div>
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
                                    {challengeType === "competitive" && (
                                        <div className="relative">
                                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">
                                                Select Opponent
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(e.target.value);
                                                        setIsDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setIsDropdownOpen(true)}
                                                    placeholder="Search citizens by name or handle..."
                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                                                />
                                                {opponentUser && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#6366F1]/20 px-3 py-1 rounded-lg border border-[#6366F1]/30">
                                                        <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden">
                                                            <img src={opponentUser.avatar} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-xs font-bold text-[#6366F1]">{opponentUser.name}</span>
                                                        <button 
                                                            onClick={() => setOpponentUser(null)}
                                                            className="text-[#6366F1] hover:text-white transition-colors"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dropdown */}
                                            {isDropdownOpen && searchQuery && (
                                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                                    {users
                                                        .filter(u => u.uid !== user?.uid && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.handle.toLowerCase().includes(searchQuery.toLowerCase())))
                                                        .map((u) => (
                                                            <button
                                                                key={u.uid}
                                                                onClick={() => {
                                                                    setOpponentUser(u);
                                                                    setSearchQuery("");
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                                                    <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">{u.name}</div>
                                                                    <div className="text-[10px] text-slate-500 font-medium">{u.handle}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    {users.filter(u => u.uid !== user?.uid && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.handle.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                                                        <div className="px-4 py-4 text-center text-slate-500 text-xs italic">No matching citizens found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

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

                                    {/* Streak Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                <Zap className={`w-5 h-5 ${isStreak ? 'text-amber-500' : 'text-slate-500'}`} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Daily Streak Requirement</div>
                                                <div className="text-[10px] text-slate-500 font-medium">Participants must upload proof every 24h</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsStreak(!isStreak)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${isStreak ? 'bg-[#6366F1]' : 'bg-slate-700'}`}
                                        >
                                            <motion.div
                                                animate={{ x: isStreak ? 26 : 2 }}
                                                className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-md"
                                            />
                                        </button>
                                    </div>

                                </div>

                                {/* Fee Disclosure */}
                                <div className="bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Zap className="w-4 h-4 text-[#6366F1] mt-0.5 shrink-0" />
                                        <div className="text-xs text-slate-300 leading-relaxed">
                                            <strong className="text-white">{challengeType === "global" ? "Global Rules:" : "Showdown Rules:"}</strong> {challengeType === "global" 
                                                ? "Anyone can join. The first to submit valid proof wins the challenge."
                                                : "The winner takes half the loser's stake. If neither wins, funds go to the Relief Pool after 1 year."}
                                            <br />
                                            Funds are held for up to <span className="text-[#06B6D4] font-bold">1 year after expiry</span> for the Community Relief Pool if no winner is declared.
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
                                        !deadline
                                    }
                                    className="w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-[family-name:var(--font-heading)] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Swords className="w-4 h-4" />
                                    )}
                                    {isSubmitting ? "Connecting to Wallet..." : challengeType === "global" ? "Declare Global Challenge" : "Issue Direct Challenge"}
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
                                        setOpponentUser(null);
                                        setImageUrl("");
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
