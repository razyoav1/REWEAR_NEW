import { NavLink, useLocation } from "react-router-dom";
import { Compass, Search, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { to: "/", icon: Compass, label: "Discover" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/wishlist", icon: Heart, label: "Saved" },
  { to: "/messages", icon: MessageCircle, label: "Inbox" },
  { to: "/profile", icon: User, label: "Me" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-full group"
            >
              <div className="relative flex flex-col items-center">
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive
                      ? "text-primary stroke-[2.5px]"
                      : "text-muted-foreground stroke-[1.5px] group-hover:text-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold mt-0.5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
