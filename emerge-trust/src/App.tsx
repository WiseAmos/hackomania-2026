import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/appState";
import { useDisasterStore } from "@/store/disasterStore";
import { useOffline } from "@/hooks/useOffline";

import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Wager from "@/pages/Wager";
import Claim from "@/pages/Claim";
import Vote from "@/pages/Vote";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import OfflineBanner from "@/components/crisis/OfflineBanner";

function App() {
  const { mode, user } = useAppStore();
  const { subscribeToDisasterZones } = useDisasterStore();
  const { isOnline } = useOffline();

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
