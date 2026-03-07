"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Activity, 
    ArrowLeft, 
    ChevronRight, 
    Coins, 
    Database, 
    ExternalLink, 
    LayoutDashboard, 
    Loader2, 
    RefreshCcw, 
    Send, 
    ShieldCheck, 
    Wallet 
} from "lucide-react";
import Link from "next/link";

interface PoolGrant {
    id: string;
    amount: number;
    walletUrl: string;
    status: string;
    createdAt: string;
    sourceWagerId?: string;
}

export default function ILPTestPage() {
    const [grants, setGrants] = useState<PoolGrant[]>([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    
    // Form fields
    const [testWallet, setTestWallet] = useState("https://ilp.interledger-test.dev/pineapple-receiver");
    const [testAmount, setTestAmount] = useState("50");
    const [testDescription, setTestDescription] = useState("System Payout Test");
    
    // Result
    const [result, setResult] = useState<any>(null);

    const fetchGrants = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ilp/grants");
            const data = await res.json();
            setGrants(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrants();
    }, []);

    const handleRunTest = async () => {
        setExecuting(true);
        setResult(null);
        try {
            const res = await fetch("/api/ilp/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    claimantWallet: testWallet,
                    amount: Math.round(Number(testAmount) * 100).toString(),
                    description: testDescription
                })
            });
            const data = await res.json();
            setResult(data);
            fetchGrants(); // Refresh list to see consumed grants
        } catch (err) {
            console.error(err);
            setResult({ error: String(err) });
        } finally {
            setExecuting(false);
        }
    };

    const totalPool = grants
        .filter(g => g.status === 'available')
        .reduce((sum, g) => sum + g.amount, 0);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#6366F1]/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366F1]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">ILP Protocol Laboratory</h1>
                            <p className="text-slate-500 text-sm">Testing autonomous outgoing payment grants and pool assembly</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Protocol Live</span>
                        </div>
                        <button 
                            onClick={fetchGrants}
                            disabled={loading}
                            className="p-2 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form & Tools */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Send className="w-20 h-20 text-[#6366F1]" />
                             </div>
                             
                             <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-[#6366F1]" />
                                Trigger Outgoing Claim
                             </h2>

                             <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Wallet</label>
                                    <div className="relative group">
                                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#6366F1] transition-colors" />
                                        <input 
                                            value={testWallet}
                                            onChange={(e) => setTestWallet(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/50 transition-all"
                                            placeholder="https://test.wallet/receiver"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (SGD)</label>
                                        <div className="relative">
                                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="number"
                                                value={testAmount}
                                                onChange={(e) => setTestAmount(e.target.value)}
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#6366F1]/50 transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Context</label>
                                        <input 
                                            value={testDescription}
                                            onChange={(e) => setTestDescription(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:border-[#6366F1]/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleRunTest}
                                    disabled={executing || loading || totalPool < (Number(testAmount) * 100)}
                                    className="w-full group relative overflow-hidden py-4 rounded-2xl bg-[#6366F1] font-bold text-white shadow-lg shadow-[#6366F1]/20 hover:shadow-[#6366F1]/40 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                                >
                                    {executing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Assembling Grants...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-5 h-5" />
                                            <span>Authorize Protocol Sweep</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 h-1 bg-white/20 transition-all" style={{ width: executing ? '100%' : '0%' }} />
                                </button>

                                {totalPool < (Number(testAmount) * 100) && (
                                    <p className="text-[10px] text-red-400 font-bold text-center uppercase tracking-wider">
                                        Insufficient assembled pool balance (Available: ${(totalPool/100).toFixed(2)})
                                    </p>
                                )}
                             </div>
                        </section>

                        {/* Result Area */}
                        <AnimatePresence>
                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-6 border rounded-[2rem] overflow-hidden relative ${result.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                                >
                                    <h3 className={`text-sm font-bold mb-4 uppercase tracking-widest ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {result.success ? '✓ Payout Fulfilled' : '✕ Protocol Error'}
                                    </h3>
                                    <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto p-4 bg-black/40 rounded-xl">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Grants List */}
                    <div className="lg:col-span-7 space-y-6">
                        <section className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-[700px]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center">
                                        <Database className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Relief Fund Pool</h2>
                                        <p className="text-xs text-slate-500">{grants.filter(g => g.status === 'available').length} Active Outgoing Grants</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Assembled Pool</p>
                                    <p className="text-3xl font-black text-[#6366F1] font-mono">${(totalPool / 100).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                {loading && grants.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#6366F1] mb-4" />
                                        <p className="text-sm font-medium">Scanning network for grants...</p>
                                    </div>
                                ) : grants.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-slate-500">
                                        <p>No grants found in the pool yet.</p>
                                        <p className="text-[10px] mt-2 non-italic">Resolve a wager to see it here.</p>
                                    </div>
                                ) : (
                                    grants.map((grant) => (
                                        <div 
                                            key={grant.id}
                                            className={`group p-5 rounded-2xl border transition-all duration-300 ${grant.status === 'available' ? 'bg-slate-950 border-white/10 hover:border-[#6366F1]/30' : 'bg-slate-900/30 border-white/5 opacity-60 grayscale'}`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${grant.status === 'available' ? 'bg-[#6366F1]/10 border-[#6366F1]/20 text-[#6366F1]' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                                        <Coins className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-white font-mono">${(grant.amount/100).toFixed(2)}</span>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${grant.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                                                                {grant.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{grant.walletUrl}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{new Date(grant.createdAt).toLocaleDateString()}</p>
                                                    <a 
                                                        href={grant.walletUrl} 
                                                        target="_blank" 
                                                        className="inline-flex items-center gap-1 text-[8px] text-[#6366F1] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        WALLET INFO <ExternalLink className="w-2 h-2" />
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                                 <div className="flex -space-x-2">
                                                     <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-900" />
                                                     <div className="w-4 h-4 rounded-full bg-[#6366F1]/20 border border-slate-900 flex items-center justify-center">
                                                        <Activity className="w-2 h-2 text-[#6366F1]" />
                                                     </div>
                                                 </div>
                                                 <span className="text-[9px] text-slate-600 font-medium">Source: {grant.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.2);
                }
            `}</style>
        </main>
    );
}
