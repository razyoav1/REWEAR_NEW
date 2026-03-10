import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "USD"): string {
  // 'NIS' is our DB code for Israeli shekel; Intl needs the ISO 4217 code 'ILS'
  const isoCurrency = currency === "NIS" ? "ILS" : currency;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: isoCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", ILS: "₪", NIS: "₪", JPY: "¥",
  CAD: "C$", AUD: "A$", CHF: "Fr", KRW: "₩", INR: "₹",
};

export function getCurrencySymbol(currency = "USD"): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

// Static exchange rates relative to USD (good-enough for a local marketplace)
// NIS = Israeli New Shekel (our DB code); ILS = same currency, ISO 4217 code used on listings
const RATES_TO_USD: Record<string, number> = { USD: 1, ILS: 1 / 3.7, NIS: 1 / 3.7 };
const RATES_FROM_USD: Record<string, number> = { USD: 1, ILS: 3.7, NIS: 3.7 };

export function convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const toUSD = RATES_TO_USD[fromCurrency] ?? 1;
  const fromUSD = RATES_FROM_USD[toCurrency] ?? 1;
  return amount * toUSD * fromUSD;
}

export function displayPrice(amount: number, listingCurrency: string, userCurrency: string): string {
  const converted = convertPrice(amount, listingCurrency, userCurrency);
  return formatPrice(converted, userCurrency);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
