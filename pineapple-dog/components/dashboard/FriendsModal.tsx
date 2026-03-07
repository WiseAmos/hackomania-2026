import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, UserMinus, Loader2, Users } from "lucide-react";
import { User } from "../../types/dashboard";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid: string;
}

export function FriendsModal({ isOpen, onClose, currentUserUid }: FriendsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUserUid) {
      Promise.all([
        fetch("/api/users").then((res) => res.json()),
        fetch(`/api/users/friends?uid=${currentUserUid}`).then((res) => res.json()),
      ])
        .then(([usersData, friendsData]) => {
          setUsers(usersData);
          setFriends(friendsData || {});
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load users or friends", err);
          setIsLoading(false);
        });
    }
  }, [isOpen, currentUserUid]);

  // Handle adding/removing a friend
  const handleToggleFriend = async (friendUid: string, isAdding: boolean) => {
    setIsProcessing(friendUid);
    try {
      const res = await fetch("/api/users/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUserUid, friendUid, isAdding }),
      });
      const data = await res.json();
      if (data.success) {
        setFriends((prev) => {
          const next = { ...prev };
          if (isAdding) next[friendUid] = true;
          else delete next[friendUid];
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to toggle friend", err);
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (u.id === currentUserUid || u.uid === currentUserUid) return false;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.handle && u.handle.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#6366F1]" />
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">Find Friends</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col min-h-[400px]">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/60 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                />
              </div>

              {/* Users List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="space-y-3">
                    {filteredUsers.map((u: any) => {
                      const uid = u.uid || u.id;
                      const isFriend = !!friends[uid];
                      const isCurrentlyProcessing = isProcessing === uid;

                      return (
                        <div
                          key={uid}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                              {u.avatar?.startsWith("http") ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.avatar || "?"
                              )}
                            </div>
                            <div>
                              <div className="text-white text-sm font-bold leading-tight">{u.name}</div>
                              <div className="text-slate-400 text-xs">@{u.handle}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleFriend(uid, !isFriend)}
                            disabled={isCurrentlyProcessing}
                            className={`p-2 rounded-xl transition-all border ${
                              isFriend
                                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                : "bg-[#6366F1]/10 border-[#6366F1]/20 text-[#6366F1] hover:bg-[#6366F1]/20"
                            } disabled:opacity-50 flex items-center gap-2`}
                          >
                            {isCurrentlyProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isFriend ? (
                              <UserMinus className="w-4 h-4" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-medium">No users found</p>
                    <p className="text-slate-500 text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
