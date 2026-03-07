"use client"

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, Wallet } from "lucide-react";
import { db } from "../../lib/firebase";
import { ref, onValue } from "firebase/database";

interface Transaction {
  id: string;
  type: "payout" | "refill";
  amount: number;
  description: string;
  timestamp: string;
  status: string;
}

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const claimsRef = ref(db, "claims");
    const grantsRef = ref(db, "pool/grants");

    let claimsData: any[] = [];
    let grantsData: any[] = [];

    const combineAndSort = () => {
      const combined = [...claimsData, ...grantsData];
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(combined);
      setLoading(false);
    };

    const unsubscribeClaims = onValue(claimsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        claimsData = Object.entries(data)
          .map(([id, val]: [string, any]) => {
            const status = val.verification_results?.disbursement?.status || val.status;
            const isPaid = ["DISBURSED", "PARTIAL_DISBURSED", "fulfilled", "partial"].includes(status);
            
            if (!isPaid) return null;

            return {
              id,
              type: "payout",
              amount: val.claim_manifest?.amount_requested || val.amount || 0,
              description: val.claim_manifest?.title || val.wagerTitle || "Claim Payout",
              timestamp: val.updated_at || val.timestamp || new Date().toISOString(),
              status: status,
            };
          })
          .filter(Boolean) as Transaction[];
      }
      combineAndSort();
    });

    const unsubscribeGrants = onValue(grantsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        grantsData = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          type: "refill",
          amount: (val.amount || 0) / 100, // Convert cents to dollars
          description: `Fund Refill from Wager ${val.sourceWagerId || id}`,
          timestamp: val.createdAt || new Date().toISOString(),
          status: "completed",
        })) as Transaction[];
      }
      combineAndSort();
    });

    return () => {
      unsubscribeClaims();
      unsubscribeGrants();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6366F1]"></div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-800/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Transaction</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No transactions found in the ledger.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'payout' ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                        {tx.type === 'payout' ? (
                          <ArrowUpRight className={`w-4 h-4 ${tx.type === 'payout' ? 'text-orange-400' : 'text-green-400'}`} />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{tx.description}</p>
                        <p className="text-xs text-slate-500 font-mono">ID: {tx.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      tx.type === 'payout' ? 'text-orange-400 bg-orange-400/10' : 'text-green-400 bg-green-400/10'
                    }`}>
                      {tx.type === 'payout' ? 'Payout' : 'Refill'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold ${tx.type === 'payout' ? 'text-slate-200' : 'text-green-400'}`}>
                      {tx.type === 'payout' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-tight">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      On-Chain
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 p-4 rounded-2xl bg-slate-800/40 border border-white/5 backdrop-blur-sm">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Disbursed</p>
          <p className="text-2xl font-bold text-white">
            ${transactions.filter(t => t.type === 'payout').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-slate-800/40 border border-white/5 backdrop-blur-sm">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Refilled</p>
          <p className="text-2xl font-bold text-green-400">
            ${transactions.filter(t => t.type === 'refill').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
