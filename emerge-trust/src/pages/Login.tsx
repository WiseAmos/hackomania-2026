import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAppStore } from "@/store/appState";
import Button from "@/components/ui/Button";
import type { User } from "@/types";

function Login() {
  const { setUser } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUserProfile = async (
    uid: string,
    email: string,
    displayName: string,
    photoURL: string | null
  ) => {
    const userRef = ref(db, `users/${uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) {
      const newUser: Omit<User, "uid"> = {
        email,
        displayName,
        photoURL,
        walletAddress: null,
        trustScore: 0,
        isVolunteerLeader: false,
        isBlacklisted: false,
        createdAt: new Date().toISOString(),
      };
      await set(userRef, newUser);
    }
    const profileSnap = await get(userRef);
    return { uid, ...(profileSnap.val() as Omit<User, "uid">) } as User;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const credential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      const profile = await createUserProfile(
        credential.user.uid,
        email,
        email.split("@")[0],
        null
      );
      setUser(profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const profile = await createUserProfile(
        result.user.uid,
        result.user.email ?? "",
        result.user.displayName ?? "",
        result.user.photoURL
      );
      setUser(profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-pt-bg">
      {/* Logo + Title */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-pt-panel border-2 border-pt-cyan/60 flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
          <div className="w-10 h-10 rounded-full bg-pt-cyan/20 animate-vault-breathe" />
        </div>
        <h1 className="text-pt-text font-black text-3xl tracking-tight">
          EmergeTrust
        </h1>
        <p className="text-pt-muted text-sm mt-2">
          Community-governed disaster insurance
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleEmailAuth}
        className="w-full max-w-sm space-y-4"
      >
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3.5 text-pt-text text-base placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3.5 text-pt-text text-base placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
          />
        </div>

        {/* Floating Error Popup */}
        {error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-max max-w-[90vw]">
            <div className="bg-red-500/10 border border-red-500/40 backdrop-blur-xl text-red-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_4px_30px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="text-red-400 shrink-0" size={18} />
              <p className="text-sm font-medium leading-tight">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-200 transition-colors ml-1"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          {isSignUp ? "Create Account" : "Sign In"}
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-pt-muted text-xs">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleGoogleAuth}
          isLoading={isLoading}
        >
          Continue with Google
        </Button>

        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="w-full text-pt-muted text-sm text-center hover:text-pt-text transition-colors py-2"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "New here? Create account"}
        </button>
      </form>
    </div>
  );
}

export default Login;
