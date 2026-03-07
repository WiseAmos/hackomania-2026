import { useState } from "react";
import { ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Claim, VoteChoice } from "@/types";

interface VotingPanelProps {
  claim: Claim;
  onVote: (claimId: string, choice: VoteChoice) => Promise<void>;
  hasVoted?: boolean;
  userVote?: VoteChoice;
}

function VotingPanel({ claim, onVote, hasVoted = false, userVote }: VotingPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localVote, setLocalVote] = useState<VoteChoice | null>(userVote ?? null);

  const handleVote = async (choice: VoteChoice) => {
    if (hasVoted || localVote) return;
    setIsSubmitting(true);
    try {
      await onVote(claim.id, choice);
      setLocalVote(choice);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = claim.tier2Amount / 100;
  const deadline = claim.votingDeadlineAt
    ? new Date(claim.votingDeadlineAt)
    : null;
  const hoursLeft = deadline
    ? Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 3_600_000))
    : null;

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-cr-orange/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={18} className="text-cr-orange" />
        </div>
        <div className="flex-1">
          <p className="text-cr-text font-bold text-base leading-tight">
            Claim #{claim.id.slice(-6).toUpperCase()}
          </p>
          <p className="text-cr-muted text-xs mt-0.5">
            Zone: {claim.zoneId} &bull; {claim.type}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-cr-orange font-black text-xl">${amount.toFixed(2)}</p>
          <p className="text-cr-muted text-xs">80% payout</p>
        </div>
      </div>

      {claim.photoUrl && (
        <img
          src={claim.photoUrl}
          alt="Claim evidence"
          className="w-full h-40 object-cover rounded-xl mb-4"
        />
      )}

      {deadline && (
        <div className="flex items-center gap-1.5 mb-4 text-cr-muted text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-cr-orange animate-pulse" />
          {hoursLeft !== null && hoursLeft > 0
            ? `${hoursLeft}h remaining to vote`
            : "Voting window closing"}
        </div>
      )}

      {localVote ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-cr-surface border border-cr-orange/30">
          {localVote === "approve" ? (
            <ThumbsUp size={18} className="text-green-400" />
          ) : (
            <ThumbsDown size={18} className="text-red-400" />
          )}
          <span className="text-cr-text font-semibold text-sm">
            You voted to {localVote === "approve" ? "Approve" : "Reject"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleVote("approve")}
            isLoading={isSubmitting}
            className="border-green-500/40 text-green-400 hover:bg-green-500/10"
          >
            <ThumbsUp size={18} className="mr-2" />
            Approve
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => handleVote("reject")}
            isLoading={isSubmitting}
          >
            <ThumbsDown size={18} className="mr-2" />
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}

export default VotingPanel;
