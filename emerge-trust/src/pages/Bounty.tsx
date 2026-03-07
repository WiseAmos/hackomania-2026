import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Crosshair, TrendingUp, AlertTriangle } from "lucide-react";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/appState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { Claim } from "@/types";

export default function BountyPage() {
    const { user } = useAppStore();
    const navigate = useNavigate();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [slashingId, setSlashingId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch claims that the Phase 1 Bot rejected due to low score (<50) or plagiarized
        const q = query(ref(db, "claims"), orderByChild("status"), equalTo("rejected"));

        const unsubscribe = onValue(q, (snap) => {
            if (!snap.exists()) {
                setClaims([]);
                return;
            }
            const data: Claim[] = [];
            snap.forEach((child) => {
                data.push({ id: child.key as string, ...(child.val() as Omit<Claim, "id">) });
            });
            // Sort by bot score ascending so hunters see the worst claims first
            data.sort((a, b) => (a.botScore || 0) - (b.botScore || 0));
            setClaims(data);
        });

        return unsubscribe;
    }, []);

    const handleSlash = async (claimId: string) => {
        if (!user) return;
        setSlashingId(claimId);
        try {
            await fetch(`/api/bounty/slash/${claimId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hunterId: user.uid }),
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSlashingId(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
            <header className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-[#00F0FF]/30">
                <button
                    onClick={() => navigate("/")}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[#00F0FF] transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-[#00F0FF] font-black tracking-tight text-lg flex items-center gap-2">
                        <Crosshair size={18} /> Bounty Board
                    </h1>
                    <p className="text-[var(--text-muted)] text-xs">
                        Slash fraudulent claims to earn 50% of their $5 stake.
                    </p>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 space-y-4 pb-28">
                {claims.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <ShieldAlert size={40} className="text-[#00F0FF]/40" />
                        <p className="text-[var(--text-primary)] font-semibold">No bounties available</p>
                        <p className="text-[var(--text-muted)] text-sm">
                            The ecosystem is secure. Check back later for flagged claims.
                        </p>
                    </div>
                ) : (
                    claims.map((claim) => (
                        <Card key={claim.id} className="border-red-500/30 bg-red-500/5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-red-400 font-bold uppercase text-xs tracking-wider flex items-center gap-1">
                                        <AlertTriangle size={14} /> Flagged Fraud
                                    </h3>
                                    <p className="text-[var(--text-primary)] font-mono text-sm mt-1">Claim #{claim.id.slice(-6).toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[var(--text-muted)] text-xs">Bot Score</p>
                                    <p className="text-red-400 font-black text-xl">{claim.botScore}/100</p>
                                </div>
                            </div>
                            <p className="text-[var(--text-muted)] text-xs mb-4">
                                Category: <span className="capitalize text-[var(--text-primary)]">{claim.category}</span> &bull; Zone: {claim.zoneId}
                            </p>
                            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-red-500/20">
                                <div className="text-xs text-[#00F0FF]">
                                    <TrendingUp size={14} className="inline mr-1 mb-0.5" />
                                    Earn +10 Trust
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    isLoading={slashingId === claim.id}
                                    onClick={() => handleSlash(claim.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white border-0"
                                >
                                    <Crosshair size={14} className="mr-1" /> $2.50 Slash Reward
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
