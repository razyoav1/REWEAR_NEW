import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileFetched: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks whether we've completed at least one profile fetch attempt
  const [profileFetched, setProfileFetched] = useState(false);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error && error.code !== "PGRST116") {
      // PGRST116 = row not found (expected for new Google OAuth users before onboarding)
      import.meta.env.DEV && console.error("fetchProfile failed:", error.message);
    }
    // Always update profile state (null if row doesn't exist)
    setProfile(data as UserProfile | null);
    setProfileFetched(true);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Safety net: if getSession hangs (e.g. no network on cold start), unblock the UI
      setLoading(false);
      setProfileFetched(true);
    }, 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfileFetched(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfileFetched(false); // reset so route guards wait for the new profile
          await fetchProfile(session.user.id);
          // Update last_seen_at on every sign-in / session restore
          supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", session.user.id)
            .then(({ error }) => { if (error) import.meta.env.DEV && console.error("last_seen_at update failed:", error.message); });
        } else {
          setProfile(null);
          setProfileFetched(true);
        }
        setLoading(false);
      }
    );

    // Handle Google OAuth deep-link callback on iOS (com.rewear.yoavraz://login-callback?code=...)
    let removeUrlListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith("com.rewear.yoavraz://login-callback")) return;
        // Close the in-app browser
        await Browser.close().catch(() => {});

        // Use string operations only — new URL() throws for custom dotted schemes in WebKit

        // PKCE flow: ?code= in query string
        const codeMatch = url.match(/[?&]code=([^&#]+)/);
        if (codeMatch?.[1]) {
          const { error } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
          if (error) import.meta.env.DEV && console.error("exchangeCodeForSession failed:", error.message);
          return;
        }

        // Implicit flow: #access_token= in hash
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
          const params = new URLSearchParams(url.slice(hashIndex + 1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token") ?? "";
          if (access_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) import.meta.env.DEV && console.error("setSession failed:", error.message);
          }
        }
      }).then(handle => { removeUrlListener = () => handle.remove(); });
    }

    return () => { clearTimeout(timeout); subscription.unsubscribe(); removeUrlListener?.(); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, profileFetched, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
