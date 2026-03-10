import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Camera, Loader2, User } from "lucide-react";
import rewearLogo from "@/assets/rewear_logo_circle_transparent.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import imageCompression from "browser-image-compression";

const STEPS = ["Welcome", "Your Name", "Bio", "Avatar", "Location"];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<{ file: File; preview: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingAvatar, setProcessingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingAvatar(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true });
      const preview = URL.createObjectURL(compressed);
      setAvatar({ file: compressed as File, preview });
    } finally {
      setProcessingAvatar(false);
    }
  }

  async function finish(coords?: { lat: number; lng: number }) {
    if (!user) return;
    setSubmitting(true);
    try {
      let avatarUrl: string | undefined;

      // Upload avatar if selected
      if (avatar) {
        const ext = avatar.file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatar.file, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = `${publicUrl}?t=${Date.now()}`;
        }
      }

      const { error } = await supabase.from("users").upsert({
        id: user.id,
        name: name.trim(),
        bio: bio.trim() || null,
        onboarding_completed: true,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        ...(coords ? { location_lat: coords.lat, location_lng: coords.lng } : {}),
      });
      if (error) throw error;
      await refreshProfile();
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAllowLocation() {
    if (!navigator.geolocation) return finish();
    navigator.geolocation.getCurrentPosition(
      (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => finish(),
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-lime-glow opacity-50" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-glow opacity-40" />
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 pt-14">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 relative">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <img src={rewearLogo} alt="RE-WEAR" className="w-20 h-20 mb-2" />
                <h1 className="text-4xl font-bold tracking-tight leading-tight">
                  {t.welcomeTitle} <br />
                  <span className="gradient-text">RE-WEAR</span>
                </h1>
                <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                  {t.welcomeSubtitle}
                </p>
              </div>
              <Button size="xl" onClick={() => setStep(1)} className="mt-4">
                {t.getStarted} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{t.whatsYourName}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{t.howYouAppear}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">{t.fullName}</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <Button size="xl" onClick={() => setStep(2)} disabled={!name.trim()}>
                {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Bio */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{t.addABio}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{t.bioHint}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bio">{t.bioLabel}</Label>
                <textarea
                  id="bio"
                  placeholder="e.g. Lover of vintage finds and sustainable fashion 🌿"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  autoFocus
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button size="xl" onClick={() => setStep(3)}>
                  {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button size="xl" variant="ghost" onClick={() => { setBio(""); setStep(3); }}>
                  {t.skip}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Avatar */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6 items-center text-center"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{t.addAPhoto}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{t.photoHint}</p>
              </div>

              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={processingAvatar}
                className="relative w-32 h-32 rounded-full bg-muted border-4 border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden"
              >
                {avatar ? (
                  <img src={avatar.preview} alt="" className="w-full h-full object-cover" />
                ) : processingAvatar ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <User className="w-10 h-10" />
                    <span className="text-xs font-medium">{t.addPhoto}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />

              {avatar && (
                <p className="text-xs text-muted-foreground">
                  {t.looksGreat} {name.split(" ")[0]}!{" "}
                  <button onClick={() => setAvatar(null)} className="text-destructive underline">{t.remove}</button>
                </p>
              )}

              <div className="flex flex-col gap-3 w-full">
                <Button size="xl" onClick={() => setStep(4)} disabled={processingAvatar}>
                  {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button size="xl" variant="ghost" onClick={() => { setAvatar(null); setStep(4); }}>
                  {t.skip}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{t.allowLocation}</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t.locationHint}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button size="xl" onClick={handleAllowLocation} disabled={submitting}>
                  {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.settingUp}</> : t.allowLocationAccess}
                </Button>
                <Button size="xl" variant="outline" onClick={() => finish()} disabled={submitting}>
                  {t.skipForNow}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
