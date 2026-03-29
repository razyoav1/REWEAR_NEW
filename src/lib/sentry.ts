import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!import.meta.env.PROD || !dsn) return;

  Sentry.init({
    dsn,
    integrations: [Sentry.browserTracingIntegration()],
    // Sample 20% of transactions for performance monitoring
    tracesSampleRate: 0.2,
    environment: "production",
  });
}

export { Sentry };
