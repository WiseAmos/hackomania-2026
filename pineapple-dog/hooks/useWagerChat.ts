import { useState, useMemo, useEffect } from 'react';
import { ChatWager, ChatUser, ChatMessage } from '../types/chat';
import { Wager } from '../types/dashboard';

export function useWagerChat(userId?: string, activeWagerId?: string) {
  const [wagers, setWagers] = useState<ChatWager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all wagers for the user
  const fetchWagers = async () => {
    if (!userId) return;
    try {
      setIsSyncing(true);
      const resp = await fetch(`/api/wagers?userId=${userId}`);
      const data = await resp.json();

      if (!Array.isArray(data)) return;

      // Transform API wagers to ChatWagers
      const chatWagers: ChatWager[] = data.map((w: any) => {
        let participants: ChatUser[] = [];

        if (Array.isArray(w.participants)) {
          participants = w.participants.map((p: any) => ({
            id: p.uid,
            name: p.name,
            avatar: p.avatar,
            status: p.status,
            grantId: p.grantId || null,
          }));
        } else {
          // Fallback legacy
          if (w.player1) participants.push({ id: w.player1.uid, name: w.player1.name, avatar: w.player1.avatar });
          if (w.player2?.uid) participants.push({ id: w.player2.uid, name: w.player2.name, avatar: w.player2.avatar });
        }

        // Check if the current user's participant entry has a grantId
        const myParticipant = (w.participants || []).find((p: any) => p.uid === userId);
        // Also check top-level grantId for legacy wagers where creator's grantId was stored there
        const isCreator = w.player1?.uid === userId || myParticipant === (w.participants || [])[0];
        const legacyGrantId = isCreator ? (w.grantId || null) : null;
        const myGrantId: string | null = (myParticipant?.grantId && myParticipant.grantId.length > 0)
          ? myParticipant.grantId
          : (legacyGrantId && legacyGrantId.length > 0 ? legacyGrantId : null);
        // Only show the modal if we truly have no grant reference at all and the wager is still active
        const needsGrant = !myGrantId && w.status === 'active';

        return {
          id: w.id,
          title: w.title,
          imageUrl: w.imageUrl || 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=200',
          status: w.status === 'resolved' ? 'green' : 'green',
          latestAction: w.status === 'resolved' ? 'Challenge Completed!' : 'Wager active',
          participants,
          isStreak: !!w.isStreak,
          dbStatus: w.status,
          messages: [],
          // Grant tracking
          myGrantId,
          needsGrant,
          stakeAmount: w.stakeAmount || 0,
          wagerId: w.id,
        };
      });

      setWagers(chatWagers);
    } catch (err) {
      console.error("Failed to fetch wagers:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Fetch proofs/messages for wagers
  const fetchMessages = async () => {
    if (!userId || wagers.length === 0) return;
    try {
      setIsSyncing(true);
      const resp = await fetch(`/api/proofs`);
      const allProofs = await resp.json();

      if (!Array.isArray(allProofs)) return;

      setWagers(currentWagers => currentWagers.map(wager => {
        const wagerProofs = allProofs.filter((p: any) => p.wager?.id === wager.id);

        // Transform proofs to ChatMessages
        const messages: ChatMessage[] = wagerProofs.map((p: any) => ({
          id: p.id,
          type: 'proof',
          sender: {
            id: p.user.id,
            name: p.user.name,
            avatar: p.user.avatar,
          },
          photoUrl: p.photoUrl,
          timestamp: p.timestamp || p.createdAt,
          verifiedCount: p.verifications || 0,
          totalRequired: Math.max(1, wager.participants.length - 1),
          hasVoted: false,
        }));

        messages.unshift({
          id: `sys-${wager.id}`,
          type: 'system',
          text: `Wager started: ${wager.title}`,
          timestamp: new Date().toISOString(),
        });

        // Determine wager status and latest action
        let status: 'red' | 'yellow' | 'green' = 'green';
        let latestAction = 'Challenge active';

        if (wager.dbStatus === 'resolved') {
          latestAction = 'Challenge Resolved: Winner decided!';
        } else if (wager.isStreak) {
          const myLastProof = wagerProofs.find((p: any) => p.user?.id === userId);
          const today = new Date().toDateString();
          const hasUploadedToday = myLastProof && new Date(myLastProof.timestamp).toDateString() === today;

          if (!hasUploadedToday) {
            status = 'red';
            latestAction = 'You need to upload proof today!';
          }
        }

        // Jury duty check still applies to everyone
        const pendingVotes = wagerProofs.filter((p: any) => p.user?.id !== userId && (p.verifications || 0) < (wager.participants.length - 1));
        if (status !== 'red' && pendingVotes.length > 0) {
          status = 'yellow';
          latestAction = 'Jury Duty: Vote on proofs';
        }

        if (wager.dbStatus === 'resolved') {
          latestAction = 'Challenge Resolved • Winner Awarded';
        } else if (wagerProofs.length > 0) {
          const lastProof = wagerProofs[wagerProofs.length - 1];
          const uploaderName = lastProof?.user?.name ?? lastProof?.sender?.name ?? 'Someone';
          latestAction = `${uploaderName} uploaded proof`;
        }

        return {
          ...wager,
          messages: messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          status,
          latestAction,
        };
      }));

    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchWagers();
  }, [userId]);

  useEffect(() => {
    fetchMessages();

    // Listen for manual refresh events (e.g. after upload)
    const handleRefreshEvent = () => fetchMessages();
    window.addEventListener('proof-submitted', handleRefreshEvent);

    // Poll for updates every 3 seconds for "real-time" feel
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('proof-submitted', handleRefreshEvent);
    };
  }, [userId, wagers.length]);

  const activeWager = useMemo(() => {
    return wagers.find(w => w.id === activeWagerId) || null;
  }, [wagers, activeWagerId]);

  const hasUploadedToday = useMemo(() => {
    if (!activeWager || !userId) return false;
    const today = new Date().toDateString();
    return activeWager.messages.some(m =>
      m.type === 'proof' &&
      m.sender.id === userId &&
      new Date(m.timestamp).toDateString() === today
    );
  }, [activeWager, userId]);

  const handleVote = async (messageId: string, isVerified: boolean) => {
    // In a real app, this would call an API like POST /api/proofs/{id}/vote
    // For now, we'll just optimistically update local state and fetch again
    try {
      // Mocking the vote API call
      console.log(`Voting ${isVerified ? 'VERIFY' : 'BS'} on ${messageId}`);
      // fetchMessages(); // refresh
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  const handleUpload = () => {
    // This is handled by the ProofSubmissionModal in page.tsx
    // But we can trigger a refresh here if needed
    fetchMessages();
  };

  const wagersNeedingGrant = useMemo(
    () => wagers.filter(w => w.needsGrant),
    [wagers]
  );

  return {
    wagers,
    activeWager,
    isLoading,
    isSyncing,
    handleVote,
    handleUpload,
    hasUploadedToday,
    refresh: fetchMessages,
    refreshWagers: fetchWagers,
    wagersNeedingGrant,
  };
}
