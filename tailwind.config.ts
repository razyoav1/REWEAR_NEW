import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        pink: {
          DEFAULT: "hsl(var(--primary))",
          glow: "hsl(var(--primary) / 0.3)",
        },
        lime: {
          DEFAULT: "hsl(var(--secondary))",
          glow: "hsl(var(--secondary) / 0.3)",
        },
        green: {
          DEFAULT: "hsl(var(--primary))",
          glow: "hsl(var(--primary) / 0.3)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.6)" },
        },
        "swipe-left": {
          to: { transform: "translateX(-150%) rotate(-20deg)", opacity: "0" },
        },
        "swipe-right": {
          to: { transform: "translateX(150%) rotate(20deg)", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "swipe-left": "swipe-left 0.4s ease-out forwards",
        "swipe-right": "swipe-right 0.4s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
      },
      backgroundImage: {
        "pink-glow": "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        "lime-glow": "radial-gradient(ellipse at center, hsl(var(--secondary) / 0.15) 0%, transparent 70%)",
        "primary-glow": "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        "card-gradient": "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
        "hero-gradient": "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--secondary) / 0.04) 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.04) 50%, transparent 100%)",
      },
      boxShadow: {
        "pink": "0 0 30px hsl(var(--primary) / 0.3)",
        "lime": "0 0 30px hsl(var(--secondary) / 0.3)",
        "primary": "0 0 30px hsl(var(--primary) / 0.3)",
        "card": "0 4px 24px hsl(0 0% 0% / 0.12)",
        "card-hover": "0 8px 40px hsl(0 0% 0% / 0.18)",
        "nav": "0 -1px 0 hsl(var(--border)), 0 -8px 32px hsl(0 0% 0% / 0.08)",
      },
    },
  },
  plugins: [animate],
};

export default config;
