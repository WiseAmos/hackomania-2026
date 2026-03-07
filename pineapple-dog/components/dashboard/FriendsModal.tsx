"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, UserCheck, Loader2, Users } from "lucide-react";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid: string;
}

export function FriendsModal({ isOpen, onClose, currentUserUid }: FriendsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<Record<string, boolean>>({});
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchFriends();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsSearching(true);
    try {
      const resp = await fetch("/api/users");
      const data = await resp.json();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const resp = await fetch(`/api/users/friends?uid=${currentUserUid}`);
      const data = await resp.json();
      setFriends(data || {});
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const handleToggleFriend = async (targetUid: string) => {
    const isFriend = !!friends[targetUid];
    try {
      const resp = await fetch("/api/users/friends", {
        method: isFriend ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUserUid, friendUid: targetUid }),
      });
      if (resp.ok) {
        setFriends(prev => ({ ...prev, [targetUid]: !isFriend }));
      }
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.uid !== currentUserUid && 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.handle?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#6366F1]/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Find Friends</h2>
                  <p className="text-slate-400 text-xs">Build your competitive circle</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-white/5 bg-slate-900/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or handle..."
                  className="w-full bg-slate-800 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/50 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isSearching && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6366F1] mb-4" />
                  <p className="text-slate-400 text-sm">Searching for rivals...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                          {u.avatar?.startsWith("http") ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-[#6366F1]">{u.avatar || u.name?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#6366F1] transition-colors">{u.name}</h4>
                          <p className="text-xs text-slate-500">@{u.handle}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleFriend(u.uid)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          friends[u.uid] 
                            ? "bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-500" 
                            : "bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-lg shadow-[#6366F1]/20"
                        }`}
                      >
                        {friends[u.uid] ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="group-hover:hidden">Following</span>
                            <span className="hidden group-hover:inline">Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Follow
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-20 text-center">
                      <Users className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-500 text-sm italic">No users found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/30 text-center border-t border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Competitive Social Layer
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
