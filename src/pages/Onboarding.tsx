import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
import rewearLogo from "@/assets/rewear_logo_circle_transparent.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STEPS = ["Welcome", "Name", "Location"];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  // Pre-fill name from OAuth profile (Google/Apple users already have their name)
  const [name, setName] = useState(profile?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function finish(coords?: { lat: number; lng: number }) {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("users").upsert({
        id: user.id,
        name: name.trim(),
        onboarding_completed: true,
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
    if (!navigator.geolocation) { void finish(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        .catch(err => toast.error(err instanceof Error ? err.message : "Something went wrong")),
      () => finish()
        .catch(err => toast.error(err instanceof Error ? err.message : "Something went wrong")),
    );
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-y-auto">
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

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{t.allowLocation}</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t.locationHint}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button size="xl" onClick={handleAllowLocation} disabled={submitting}>
                  {submitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.settingUp}</>
                    : <><MapPin className="w-5 h-5 mr-1" /> {t.allowLocationAccess}</>
                  }
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
