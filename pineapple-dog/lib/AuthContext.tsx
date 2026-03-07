"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, db } from "./firebase";

interface AuthUser {
    uid: string;
    name: string;
    email: string;
    avatar: string;
    handle: string;
    walletAddress?: string;
    firstName?: string;
    lastName?: string;
    identification?: string;
    homeAddress?: string;
    householdIncome?: string;
    dob?: string;
    interledgerLink?: string;
    kycVerified?: boolean;
    identityDocUrl?: string;
    onboardingComplete?: boolean;
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
        let profileUnsub: (() => void) | null = null;

        const authUnsub = onAuthStateChanged(auth, (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);

                // Setup real-time listener for profile
                const userRef = ref(db, `users/${fbUser.uid}`);
                profileUnsub = onValue(userRef, (snap: any) => {
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
                    setLoading(false);
                }, (err: Error) => {
                    console.error("Profile listener error:", err);
                    setLoading(false);
                });
            } else {
                setFirebaseUser(null);
                setUser(null);
                if (profileUnsub) {
                    profileUnsub();
                    profileUnsub = null;
                }
                setLoading(false);
            }
        });

        return () => {
            authUnsub();
            if (profileUnsub) profileUnsub();
        };
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
