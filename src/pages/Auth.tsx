import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import rewearLogo from "@/assets/rewear_logo_circle_transparent.png";
import { useLanguage } from "@/contexts/LanguageContext";

type Mode = "login" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup" && password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          // Email confirmation is disabled — user is immediately signed in
          navigate("/onboarding");
        } else {
          // Email confirmation is required — ask user to check inbox
          toast.success(t.checkEmail);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const redirectTo = Capacitor.isNativePlatform()
      ? "com.rewear.yoavraz://login-callback"
      : `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: Capacitor.isNativePlatform() },
    });

    if (error) { toast.error(error.message); return; }

    if (Capacitor.isNativePlatform() && data.url) {
      await Browser.open({ url: data.url });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-glow opacity-60" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-lime-glow opacity-40" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 mb-10"
        >
          <img src={rewearLogo} alt="RE-WEAR" className="w-28 h-28 drop-shadow-lg" />
          <p className="text-muted-foreground text-sm">{t.fashionLivesOn}</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
                  mode === m
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? t.logIn : t.signUp}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-destructive mt-1">At least 6 characters required</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
              {loading ? t.loading : mode === "login" ? t.logIn : t.createAccount}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">{t.or}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {mode === "signup" && (
            <p className="text-xs text-center text-muted-foreground">
              By signing up you agree to our{" "}
              <Link to="/terms" className="underline text-foreground">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="underline text-foreground">Privacy Policy</Link>.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full" size="lg" onClick={handleGoogle}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.continueWithGoogle}
            </Button>

            {/* Apple Sign-In — disabled until configured */}
            {/* <Button className="w-full bg-white text-black hover:bg-white/90 border border-white/20" size="lg" onClick={handleApple}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              {t.continueWithApple}
            </Button> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
