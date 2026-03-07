import { useState } from "react";
import { Lock } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/store/appState";
import { useOpenPayments } from "@/hooks/useOpenPayments";

interface CommitmentLockProps {
  onLocked?: (wagerId: string) => void;
}

function CommitmentLock({ onLocked }: CommitmentLockProps) {
  const { user } = useAppStore();
  const { requestGrant, isLoading, error } = useOpenPayments();

  const [goal, setGoal] = useState("");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(user?.walletAddress ?? "");
  const [deadline, setDeadline] = useState("");
  const [locked, setLocked] = useState(false);

  const handleLock = async () => {
    if (!user || !goal || !amount || !walletId || !deadline) return;

    const amountInCents = Math.round(parseFloat(amount) * 100).toString();

    const grantResponse = await requestGrant({
      uid: user.uid,
      senderWalletId: walletId,
      receiverWalletId: walletId, // In P2P architecture, the receiver is defined at payout time. We just authorize the sender's vault temporarily.
      amount: amountInCents,
      assetCode: "SGD",
    });

    if (grantResponse) {
      sessionStorage.setItem(
        "pendingWager",
        JSON.stringify({ goal, amount: parseFloat(amount), deadline, walletId })
      );
      // Redirect user to authorize the Open Payments grant
      window.location.href = grantResponse.grantUrl;
      setLocked(true);
      onLocked?.(grantResponse.continueToken);
    }
  };

  if (locked) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-14 h-14 rounded-full bg-pt-cyan/10 flex items-center justify-center">
            <Lock size={24} className="text-pt-cyan" />
          </div>
          <p className="text-pt-text font-semibold">Redirecting to authorize...</p>
          <p className="text-pt-muted text-sm">
            Complete authorization in your Open Payments wallet to lock the commitment.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card glow>
      <div className="flex items-center gap-2 mb-5">
        <Lock size={18} className="text-pt-cyan" />
        <h3 className="text-pt-text font-semibold text-base">
          Lock Commitment
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-pt-muted text-xs mb-1.5 uppercase tracking-wider">
            Goal
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Exercise 5x per week"
            className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3 text-pt-text text-sm placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-pt-muted text-xs mb-1.5 uppercase tracking-wider">
              Amount (SGD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              min="0.01"
              step="0.01"
              className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3 text-pt-text text-sm placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-pt-muted text-xs mb-1.5 uppercase tracking-wider">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3 text-pt-text text-sm placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-pt-muted text-xs mb-1.5 uppercase tracking-wider">
            Your Wallet Address
          </label>
          <input
            type="text"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="your-wallet-id"
            className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3 text-pt-text text-sm placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm px-1">{error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleLock}
          isLoading={isLoading}
          disabled={!goal || !amount || !walletId || !deadline}
        >
          <Lock size={16} className="mr-2" />
          Lock Commitment
        </Button>
      </div>
    </Card>
  );
}

export default CommitmentLock;
