import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ChevronRight, LogOut, Bell, Shield, HelpCircle,
  MapPin, DollarSign, Loader2, Check, Languages, Clock, Sun, Trash2, FileText,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "USD", label: "$ USD" },
  { code: "NIS", label: "₪ NIS" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [radius, setRadius] = useState(profile?.default_radius_km ?? 30);
  const radiusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep slider in sync if profile loads after mount
  useEffect(() => {
    if (profile?.default_radius_km != null) setRadius(profile.default_radius_km);
  }, [profile?.default_radius_km]);

  // Clear debounce timer on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (radiusTimerRef.current) clearTimeout(radiusTimerRef.current);
    };
  }, []);

  const name = profile?.name ?? "You";
  const currency = profile?.currency ?? "USD";

  async function handleCurrencyChange(c: string) {
    if (!user || c === currency) return;
    setSavingCurrency(true);
    const { error } = await supabase.from("users").update({ currency: c }).eq("id", user.id);
    if (error) {
      toast.error(t.failedUpdateCurrency);
      setSavingCurrency(false);
      return;
    }
    await refreshProfile();
    const label = CURRENCIES.find(x => x.code === c)?.label ?? c;
    toast.success(`${t.currencySetTo} ${label}`);
    setSavingCurrency(false);
  }

  async function handleUpdateLocation() {
    if (!navigator.geolocation) { toast.error(t.geolocationUnavailable); return; }
    if (!user) return;
    const userId = user.id; // capture before async callback to avoid stale reference
    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from("users").update({
          location_lat: pos.coords.latitude,
          location_lng: pos.coords.longitude,
        }).eq("id", userId);
        await refreshProfile();
        toast.success(t.locationUpdated);
        setUpdatingLocation(false);
      },
      () => { toast.error(t.cantGetLocation); setUpdatingLocation(false); }
    );
  }

  function handleRadiusChange(val: number) {
    setRadius(val);
    if (radiusTimerRef.current) clearTimeout(radiusTimerRef.current);
    radiusTimerRef.current = setTimeout(async () => {
      if (!user) return;
      await supabase.from("users").update({ default_radius_km: val }).eq("id", user.id);
      await refreshProfile();
    }, 600);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      navigate("/auth");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
      setDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t.settings}</h1>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Profile summary */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left"
        >
          <Avatar className="w-14 h-14 border-2 border-border">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{name}</p>
            <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </motion.button>

        {/* Currency */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> {t.currency}
            {savingCurrency && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </p>
          <div className="flex gap-3">
            {CURRENCIES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => handleCurrencyChange(code)}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                  currency === code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {currency === code && <Check className="w-3 h-3 inline mr-1" />}
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Language */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" /> {t.language}
          </p>
          <div className="flex gap-2">
            {(["en", "he"] as const).map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); toast.success(l === "en" ? "Language set to English" : "השפה הוגדרה לעברית"); }}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                  lang === l
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {lang === l && <Check className="w-3 h-3 inline mr-1" />}
                {l === "en" ? "🇺🇸 English" : "🇮🇱 עברית"}
              </button>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" /> {t.appearance}
          </p>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                  theme === th
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {theme === th && <Check className="w-3 h-3 inline mr-1" />}
                {th === "light" ? `☀️ ${t.lightMode}` : `🌙 ${t.darkMode}`}
              </button>
            ))}
          </div>
        </section>

        {/* Location */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {t.location}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={handleUpdateLocation}
              disabled={updatingLocation}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-muted/50 transition-colors disabled:opacity-60"
            >
              {updatingLocation
                ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                : <MapPin className="w-4 h-4 text-muted-foreground" />
              }
              <div className="flex-1">
                <span className="text-sm font-medium">{t.updateLocation}</span>
                {profile?.location_lat ? (
                  <p className="text-xs text-muted-foreground">{t.locationSaved}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t.locationNotSet}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Search Radius */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {t.searchRadius}
          </p>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.showWithin}</span>
              <span className="text-sm font-bold text-primary">{radius} {t.km}</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={radius}
              onChange={e => handleRadiusChange(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5 {t.km}</span>
              <span>100 {t.km}</span>
              <span>200 {t.km}</span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> {t.notifications}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <SettingsRow icon={Bell} label={t.pushNotifications} value={t.comingSoon} />
          </div>
        </section>

        {/* Privacy & Safety */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> {t.privacySafety}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <SettingsRow icon={Shield} label={t.blockedUsers} onClick={() => navigate("/settings/blocked")} />
            <Separator />
            <SettingsRow icon={Shield} label={t.reportHistory} onClick={() => navigate("/settings/reports")} />
          </div>
        </section>

        {/* History */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {t.history}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <SettingsRow icon={Clock} label={t.recentlySeen} onClick={() => navigate("/recently-seen")} />
          </div>
        </section>

        {/* Support */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> {t.support}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <SettingsRow icon={HelpCircle} label={t.helpFAQ} onClick={() => navigate("/help")} />
            <Separator />
            <SettingsRow icon={FileText} label="Terms of Service" onClick={() => navigate("/terms")} />
            <Separator />
            <SettingsRow icon={FileText} label="Privacy Policy" onClick={() => navigate("/privacy")} />
          </div>
        </section>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" /> {t.signOutBtn}
        </Button>

        {/* Danger zone */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Danger Zone
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Delete my account</span>
          </button>
        </section>

        {/* App version */}
        <p className="text-center text-xs text-muted-foreground/50 pt-2">{t.appVersion}</p>
      </div>

      {/* Delete account confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all your listings, messages, and data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deletingAccount}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccount}>
              {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsRow({
  icon: Icon, label, value, onClick,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-muted/50 transition-colors disabled:opacity-60 disabled:cursor-default"
    >
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value
        ? <span className="text-xs text-muted-foreground">{value}</span>
        : onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />
      }
    </button>
  );
}
