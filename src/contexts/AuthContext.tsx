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
      async (event, session) => {
        // Don't let INITIAL_SESSION override the loading state — getSession() owns that.
        // Only handle subsequent real events (sign-in, sign-out, token refresh, etc.)
        // This prevents the race where INITIAL_SESSION fires with null before token
        // refresh completes, causing a false redirect to the auth page on web refresh.
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
        // Only clear the loading state for post-init events, not INITIAL_SESSION.
        // getSession().then() handles the initial load; this handles everything after.
        if (event !== "INITIAL_SESSION") {
          setLoading(false);
        }
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

        // PKCE flow: ?code= in query string
        const codeMatch = url.match(/[?&]code=([^&#]+)/);
        if (codeMatch?.[1]) {
          const code = decodeURIComponent(codeMatch[1]);
          console.log("[OAuth] PKCE code received, finding verifier in localStorage...");

          // Supabase may store the verifier under different key variants — check all
          let codeVerifier: string | null = null;
          const verifierKeys = [
            "sb-jddcaaasineiikfzhjel-auth-token-code-verifier",
            "supabase.auth.token-code-verifier",
            "sb-api-auth-token-code-verifier",
          ];
          for (const k of verifierKeys) {
            codeVerifier = localStorage.getItem(k);
            if (codeVerifier) { console.log("[OAuth] verifier found at:", k); break; }
          }
          if (!codeVerifier) {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i) ?? "";
              if (k.includes("verifier") || k.includes("pkce")) {
                codeVerifier = localStorage.getItem(k);
                console.log("[OAuth] verifier found by scan:", k); break;
              }
            }
          }
          console.log("[OAuth] verifier present:", !!codeVerifier);

          try {
            // Use raw fetch — supabase.auth.exchangeCodeForSession() throws instead of returning
            // errors (known bug) and can deadlock on iOS native due to internal lock mechanism
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
            const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
            console.log("[OAuth] raw token exchange...");
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
              body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier ?? "" }),
            });
            const tokenData = await res.json();
            if (!res.ok) {
              console.error("[OAuth] exchange failed:", res.status, JSON.stringify(tokenData));
              return;
            }
            console.log("[OAuth] exchange success, user:", tokenData.user?.id);
            const nowSecs = Math.floor(Date.now() / 1000);
            localStorage.setItem("sb-jddcaaasineiikfzhjel-auth-token", JSON.stringify({
              access_token: tokenData.access_token, refresh_token: tokenData.refresh_token,
              token_type: tokenData.token_type ?? "bearer", expires_in: tokenData.expires_in ?? 3600,
              expires_at: nowSecs + (tokenData.expires_in ?? 3600), user: tokenData.user,
            }));
            if (tokenData.user) {
              setUser(tokenData.user);
              setSession({ access_token: tokenData.access_token, refresh_token: tokenData.refresh_token, token_type: tokenData.token_type ?? "bearer", expires_in: tokenData.expires_in ?? 3600, expires_at: nowSecs + (tokenData.expires_in ?? 3600), user: tokenData.user } as Session);
              setProfileFetched(false);
              await fetchProfile(tokenData.user.id);
              console.log("[OAuth] done!");
            }
          } catch (e) { console.error("[OAuth] raw exchange error:", e); }
          return;
        }

        // Fallback: implicit flow (#access_token in hash) — decode JWT locally, no network calls
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
          console.log("[OAuth] implicit fallback flow...");
          const params = new URLSearchParams(url.slice(hashIndex + 1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token") ?? "";
          if (access_token) {
            try {
              const payload = JSON.parse(atob(access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
              const nowSecs = Math.floor(Date.now() / 1000);
              localStorage.setItem("sb-jddcaaasineiikfzhjel-auth-token", JSON.stringify({
                access_token, refresh_token, token_type: "bearer",
                expires_in: Math.max(0, (payload.exp || 0) - nowSecs),
                expires_at: payload.exp || nowSecs + 3600,
                user: { id: payload.sub, email: payload.email, role: payload.role ?? "authenticated", aud: payload.aud ?? "authenticated", created_at: payload.created_at ?? "", user_metadata: payload.user_metadata ?? {}, app_metadata: payload.app_metadata ?? {} },
              }));
              setUser({ id: payload.sub, email: payload.email, user_metadata: payload.user_metadata ?? {}, app_metadata: payload.app_metadata ?? {}, aud: payload.aud ?? "authenticated", created_at: payload.created_at ?? "" } as User);
              setProfileFetched(false);
              await fetchProfile(payload.sub);
              console.log("[OAuth] implicit done!");
            } catch (e) { console.error("[OAuth] implicit fallback failed:", e); }
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
