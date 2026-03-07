"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "./firebase";

interface AuthUser {
    uid: string;
    name: string;
    email: string;
    avatar: string;
    handle: string;
    walletAddress?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    firebaseUser: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);

                // Try to fetch full profile from RTDB
                try {
                    const snap = await get(ref(db, `users/${fbUser.uid}`));
                    if (snap.exists()) {
                        setUser({ uid: fbUser.uid, ...snap.val() });
                    } else {
                        // Fallback: construct from Firebase Auth profile
                        setUser({
                            uid: fbUser.uid,
                            name: fbUser.displayName || "Anonymous",
                            email: fbUser.email || "",
                            avatar: fbUser.photoURL || fbUser.displayName?.charAt(0).toUpperCase() || "?",
                            handle: `@${(fbUser.displayName || "user").toLowerCase().replace(/\s+/g, "")}`,
                        });
                    }
                } catch {
                    setUser({
                        uid: fbUser.uid,
                        name: fbUser.displayName || "Anonymous",
                        email: fbUser.email || "",
                        avatar: fbUser.photoURL || fbUser.displayName?.charAt(0).toUpperCase() || "?",
                        handle: `@${(fbUser.displayName || "user").toLowerCase().replace(/\s+/g, "")}`,
                    });
                }
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setLoading(false);
        });

        return unsub;
    }, []);

    const signOut = async () => {
        await fbSignOut(auth);
        setUser(null);
        setFirebaseUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
