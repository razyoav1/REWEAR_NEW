import { motion } from "framer-motion";
import { X, Heart, RotateCcw, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  onSkip: () => void;
  onSave: () => void;
  onChat: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  className?: string;
}

function ActionBtn({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-full border-2 shadow-card transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

export function ActionButtons({ onSkip, onSave, onChat, onUndo, canUndo = false, className }: ActionButtonsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {/* Undo */}
      <ActionBtn
        onClick={onUndo ?? (() => {})}
        disabled={!canUndo}
        className="w-11 h-11 bg-card border-border text-muted-foreground hover:border-yellow-400 hover:text-yellow-400"
      >
        <RotateCcw className="w-4 h-4" />
      </ActionBtn>

      {/* Skip */}
      <ActionBtn
        onClick={onSkip}
        className="w-16 h-16 bg-card border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive hover:shadow-[0_0_20px_hsl(0_84%_60%_/_0.3)]"
      >
        <X className="w-7 h-7" strokeWidth={3} />
      </ActionBtn>

      {/* Save to wishlist (star/heart up) */}
      <ActionBtn
        onClick={onSave}
        className="w-16 h-16 bg-card border-secondary/60 text-secondary hover:bg-secondary/10 hover:border-secondary hover:shadow-[0_0_20px_hsl(80_100%_50%_/_0.3)]"
      >
        <Heart className="w-7 h-7" />
      </ActionBtn>

      {/* Chat with seller */}
      <ActionBtn
        onClick={onChat}
        className="w-16 h-16 bg-primary border-primary text-white hover:shadow-pink"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
      </ActionBtn>
    </div>
  );
}
