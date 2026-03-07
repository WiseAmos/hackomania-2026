import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/appState";
import { useDisasterStore } from "@/store/disasterStore";
import { useOffline } from "@/hooks/useOffline";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Wager from "@/pages/Wager";
import Claim from "@/pages/Claim";
import Vote from "@/pages/Vote";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Bounty from "@/pages/Bounty";
import OfflineBanner from "@/components/crisis/OfflineBanner";

function App() {
  const { mode, user, isAuthLoading, setUser, setAuthLoading } = useAppStore();
  const { subscribeToDisasterZones } = useDisasterStore();
  const { isOnline } = useOffline();

  // Handle Firebase Auth Persistence
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended profile from RTDB
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUser({ ...snapshot.val(), uid: firebaseUser.uid });
        } else {
          // Fallback if RTDB is slow or missing
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            trustScore: 50,
            walletAddress: "",
            isVolunteerLeader: false,
            isBlacklisted: false,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading]);

  // Apply mode to root element for CSS variable switching
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  // Subscribe to real-time disaster zone updates
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToDisasterZones();
      return unsubscribe;
    }
  }, [user, subscribeToDisasterZones]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-pt-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col mode-transition">
      {!isOnline && <OfflineBanner />}
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/wager"
          element={user ? <Wager /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/claim"
          element={user ? <Claim /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/vote"
          element={user ? <Vote /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/bounty"
          element={user ? <Bounty /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={
            user?.uid ? <Admin /> : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
