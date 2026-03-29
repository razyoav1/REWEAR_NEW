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

    if (error && error.code === "PGRST116") {
      // No profile row yet — auto-create one from OAuth user metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const meta = authUser?.user_metadata ?? {};
      const name = meta.full_name || meta.name || meta.email?.split("@")[0] || "User";
      const avatar_url = meta.avatar_url || meta.picture || null;

      const { data: created, error: createError } = await supabase
        .from("users")
        .insert({
          id: userId,
          name,
          avatar_url,
          onboarding_completed: true,
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Auto-create profile failed:", createError.message);
      } else {
        setProfile(created as UserProfile | null);
        setProfileFetched(true);
        return;
      }
    } else if (error) {
      console.error("fetchProfile failed:", error.message);
    }

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

    // Handle Google OAuth deep-link callback on iOS (com.rewear.yoavraz://login-callback#access_token=...)
    let removeUrlListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith("com.rewear.yoavraz://login-callback")) return;
        // Close the in-app browser first
        await Browser.close().catch(() => {});

        // Wait for SFSafariViewController dismissal animation to finish.
        // iOS blocks WKWebView network requests while the modal is still animating out.
        await new Promise(resolve => setTimeout(resolve, 600));

        // Use string operations only — new URL() throws for custom dotted schemes in WebKit

        // PKCE flow: ?code= in query string (primary path with flowType: 'pkce')
        const codeMatch = url.match(/[?&]code=([^&#]+)/);
        if (codeMatch?.[1]) {
          console.log("[OAuth] PKCE flow, exchanging code...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
          if (error) {
            console.error("[OAuth] exchangeCodeForSession failed:", error.message);
            return;
          }
          console.log("[OAuth] exchange success, user:", data.user?.id);
          if (data.user) {
            setUser(data.user);
            setSession(data.session);
            setProfileFetched(false);
            await fetchProfile(data.user.id);
            console.log("[OAuth] done.");
          }
          return;
        }

        // Fallback: implicit flow (#access_token in hash) — decode JWT locally, no setSession call
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
          console.log("[OAuth] implicit fallback flow...");
          const params = new URLSearchParams(url.slice(hashIndex + 1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token") ?? "";
          if (access_token) {
            try {
              // Decode JWT payload without any network call
              const payload = JSON.parse(atob(access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
              const nowSecs = Math.floor(Date.now() / 1000);
              // Write session directly to localStorage — avoids setSession lock deadlock
              localStorage.setItem("sb-jddcaaasineiikfzhjel-auth-token", JSON.stringify({
                access_token, refresh_token, token_type: "bearer",
                expires_in: Math.max(0, (payload.exp || 0) - nowSecs),
                expires_at: payload.exp || nowSecs + 3600,
                user: {
                  id: payload.sub, email: payload.email, role: payload.role ?? "authenticated",
                  aud: payload.aud ?? "authenticated", created_at: payload.created_at ?? "",
                  user_metadata: payload.user_metadata ?? {}, app_metadata: payload.app_metadata ?? {},
                },
              }));
              // Now load session from localStorage — no network call needed
              const { data } = await supabase.auth.getSession();
              console.log("[OAuth] implicit fallback session loaded:", data.session?.user?.id);
              if (data.session?.user) {
                setUser(data.session.user);
                setSession(data.session);
                setProfileFetched(false);
                await fetchProfile(data.session.user.id);
                console.log("[OAuth] done.");
              }
            } catch (e) {
              console.error("[OAuth] implicit fallback failed:", e);
            }
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
