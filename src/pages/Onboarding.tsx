import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = ["Welcome", "Your Name", "Location"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");

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
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h1 className="text-4xl font-bold tracking-tight leading-tight">
                  Welcome to <br />
                  <span className="gradient-text">Rewear</span>
                </h1>
                <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                  Buy and sell secondhand clothing. Fashion that lives on.
                </p>
              </div>
              <Button size="xl" onClick={() => setStep(1)} className="mt-4">
                Get Started <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">What's your name?</h2>
                <p className="text-muted-foreground mt-2 text-sm">This is how you'll appear to others.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <Button size="xl" onClick={() => setStep(2)} disabled={!name.trim()}>
                Continue <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Allow location?</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  We use your location to show you items nearby. You can change this anytime.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button size="xl" onClick={() => {}}>
                  Allow Location Access
                </Button>
                <Button size="xl" variant="outline" onClick={() => {}}>
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
