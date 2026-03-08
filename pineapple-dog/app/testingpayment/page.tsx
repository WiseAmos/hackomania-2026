"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRightLeft, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

function TestingPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [senderWallet, setSenderWallet] = useState("$ilp.interledger-test.dev/pranav");
    const [receiverWallet, setReceiverWallet] = useState("$ilp.interledger-test.dev/recevier");

    // Total Authorization limit for the entire grant
    const [grantAmount, setGrantAmount] = useState("10000");

    // How much to send per click of Execute
    const [paymentAmount, setPaymentAmount] = useState("100");

    const [status, setStatus] = useState<"idle" | "loading" | "authorized" | "executing" | "error" | "payment_success">("idle");
    const [log, setLog] = useState<string>("");
    const [activeGrantId, setActiveGrantId] = useState<string | null>(null);

    useEffect(() => {
        // Check if we are returning from an Open Payments auth flow
        const grantId = searchParams.get("grantId");
        const interactRef = searchParams.get("interact_ref");

        if (grantId && interactRef && status === "idle") {
            continueGrant(grantId, interactRef);
        }
    }, [searchParams]);

    const startAuthFlow = async () => {
        try {
            setStatus("loading");
            setLog("Initializing interactive grant request from sender wallet...");

            const res = await fetch("/api/ilp/testing/grant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderWallet, receiverWallet, amount: grantAmount }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Failed to initialize grant");

            setLog("Grant initialized successfully! Redirecting to Identity Provider for authorization...");

            setTimeout(() => {
                window.location.href = data.grantUrl;
            }, 500);

        } catch (err: any) {
            setStatus("error");
            setLog(`Initialization Error: ${err.message}`);
        }
    };

    const continueGrant = async (grantId: string, interactRef: string) => {
        try {
            setStatus("loading");
            setLog("Returned from authorization! Continuing grant to secure access token...");

            const res = await fetch("/api/ilp/testing/continue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ grantId, interactRef }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Failed to continue grant");

            setActiveGrantId(grantId);
            setStatus("authorized");
            setLog(`Grant successfully secured! You can now execute payments repeatedly under this grant limit.`);

            // Clean up the URL
            router.replace("/testingpayment", { scroll: false });

        } catch (err: any) {
            setStatus("error");
            setLog(`Authorization Error: ${err.message}`);
            router.replace("/testingpayment", { scroll: false });
        }
    };

    const executePayment = async () => {
        if (!activeGrantId) return;
        try {
            setStatus("executing");
            setLog(`Executing a ${paymentAmount} cent payment using active grant...`);

            const res = await fetch("/api/ilp/testing/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ grantId: activeGrantId, amount: paymentAmount }),
            });

            const data = await res.json();
            if (!res.ok) {
                // Display raw API error if passed
                throw new Error(data.rawError ? JSON.stringify(data.rawError, null, 2) : (data.message || "Failed to execute payment"));
            }

            setStatus("payment_success");
            setLog(`Payment executed successfully! ID: ${data.paymentId} | Total Grant Spent So Far: ${data.grantSpentAmount}`);

        } catch (err: any) {
            setStatus("error");
            setLog(`${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#07050A] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full flex flex-col gap-6">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#DFF169] to-[#9EE15E]">
                        Multi-Payment Tester
                    </h1>
                    <p className="text-neutral-400">
                        Authorize a single grant, and execute multiple payments against it!
                    </p>
                </div>

                <div className="bg-[#110D17]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col gap-5">

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold tracking-wide text-neutral-300">SENDER WALLET</label>
                            <input
                                type="text"
                                value={senderWallet}
                                onChange={(e) => setSenderWallet(e.target.value)}
                                disabled={status !== "idle"}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#DFF169]/50 transition-colors placeholder:text-neutral-600 disabled:opacity-50"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold tracking-wide text-neutral-300">RECEIVER WALLET</label>
                            <input
                                type="text"
                                value={receiverWallet}
                                onChange={(e) => setReceiverWallet(e.target.value)}
                                disabled={status !== "idle"}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#DFF169]/50 transition-colors placeholder:text-neutral-600 disabled:opacity-50"
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <label className="text-sm font-semibold tracking-wide text-neutral-300">MAX GRANT LIMIT (CENTS)</label>
                            <input
                                type="number"
                                value={grantAmount}
                                onChange={(e) => setGrantAmount(e.target.value)}
                                disabled={status !== "idle"}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 transition-colors"
                                title="The max limit authorized for the lifetime of this grant"
                            />
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-4 border-t border-white/5">
                        {status === "idle" && (
                            <button
                                onClick={startAuthFlow}
                                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                Authorize High-Limit Grant <ShieldCheck className="w-5 h-5" />
                            </button>
                        )}

                        {(status === "loading" || status === "executing") && (
                            <div className="flex flex-col items-center justify-center py-4 gap-4">
                                <Loader2 className="w-8 h-8 text-[#DFF169] animate-spin" />
                                <p className="text-sm text-neutral-400 text-center animate-pulse">
                                    {log}
                                </p>
                            </div>
                        )}

                        {(status === "authorized" || status === "payment_success" || status === "error") && activeGrantId && (
                            <div className="flex flex-col gap-4">

                                {status === "error" && (
                                    <pre className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-left w-full overflow-x-auto break-words whitespace-pre-wrap">
                                        {log}
                                    </pre>
                                )}
                                {status === "payment_success" && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
                                        {log}
                                    </div>
                                )}

                                <div className="flex border border-white/10 rounded-xl overflow-hidden">
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="bg-black/50 px-4 py-4 outline-none w-1/3 text-[#DFF169] font-bold"
                                        placeholder="Amount"
                                    />
                                    <button
                                        onClick={executePayment}
                                        className="w-2/3 bg-[#DFF169] text-black font-semibold py-4 hover:bg-[#c9da5e] transition-colors"
                                    >
                                        Execute Outgoing Payment
                                    </button>
                                </div>

                                <button
                                    onClick={() => { setStatus("idle"); setLog(""); setActiveGrantId(null); router.replace("/testingpayment"); }}
                                    className="mt-2 text-sm text-white/50 hover:text-white underline text-center"
                                >
                                    Clear and Start New Grant
                                </button>
                            </div>
                        )}

                        {(status === "error" || status === "payment_success") && !activeGrantId && (
                            <div className="flex flex-col items-center justify-center py-4 gap-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <pre className="text-sm text-red-500 font-medium text-left p-4 w-full overflow-x-auto break-words whitespace-pre-wrap">
                                    {log}
                                </pre>
                                <button
                                    onClick={() => { setStatus("idle"); setLog(""); }}
                                    className="mt-2 text-sm text-white/70 hover:text-white underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
}

export default function TestingPayment() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#07050A] text-white flex items-center justify-center"><Loader2 className="animate-spin text-[#DFF169]" /></div>}>
            <TestingPaymentContent />
        </Suspense>
    );
}
