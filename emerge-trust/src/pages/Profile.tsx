import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Shield, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/appState";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function ProfilePage() {
  const { user, setUser } = useAppStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/login");
  };

  const trustLevel =
    (user?.trustScore ?? 0) >= 100
      ? "Verified Leader"
      : (user?.trustScore ?? 0) >= 50
      ? "Trusted Member"
      : "New Member";

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-[var(--border)]">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-pt-muted hover:text-pt-text transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-pt-text font-bold text-lg">Profile</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-24">
        {/* Avatar + name */}
        <div className="flex flex-col items-center py-6 gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-20 h-20 rounded-full border-2 border-pt-cyan/60"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-pt-panel border-2 border-pt-cyan/40 flex items-center justify-center">
              <span className="text-pt-cyan font-black text-3xl">
                {user?.displayName?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          <div className="text-center">
            <h2 className="text-pt-text font-bold text-xl">
              {user?.displayName}
            </h2>
            <p className="text-pt-muted text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Trust Score */}
        <Card glow>
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-pt-cyan" />
            <h3 className="text-pt-text font-semibold">Trust Score</h3>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-pt-cyan font-black text-4xl">
              {user?.trustScore ?? 0}
            </span>
            <span className="text-pt-muted text-sm mb-1">pts</span>
          </div>
          <div className="h-2 rounded-full bg-pt-panel overflow-hidden mb-2">
            <div
              className="h-full bg-pt-cyan rounded-full transition-all"
              style={{ width: `${Math.min(100, (user?.trustScore ?? 0))}%` }}
            />
          </div>
          <p className="text-pt-muted text-xs">{trustLevel}</p>
        </Card>

        {/* Status */}
        {user?.isVolunteerLeader && (
          <Card>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-amber-400" />
              <p className="text-pt-text font-semibold text-sm">
                Volunteer Leader
              </p>
            </div>
            <p className="text-pt-muted text-xs mt-1.5">
              You are authorized to file aggregated claims on behalf of your
              community.
            </p>
          </Card>
        )}

        {user?.isBlacklisted && (
          <div className="p-4 rounded-2xl border border-red-500/60 bg-red-500/10">
            <p className="text-red-400 font-semibold text-sm">
              Account Restricted
            </p>
            <p className="text-red-400/70 text-xs mt-1">
              Your account has been flagged. Contact support to appeal.
            </p>
          </div>
        )}

        {/* Wallet address */}
        <Card>
          <p className="text-pt-muted text-xs uppercase tracking-wider mb-2">
            Wallet Address
          </p>
          <p className="text-pt-text text-sm font-mono break-all">
            {user?.walletAddress ?? "Not connected"}
          </p>
        </Card>

        <Button
          variant="ghost"
          size="md"
          className="w-full text-red-400 hover:bg-red-500/10"
          onClick={handleSignOut}
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </main>
    </div>
  );
}

export default ProfilePage;
