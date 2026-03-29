import { Component, type ReactNode } from "react";
import { Sentry } from "@/lib/sentry";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    import.meta.env.DEV && console.error("Uncaught render error:", error, info);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-2xl font-black">Something went wrong</p>
          <p className="text-muted-foreground text-sm">Please close and reopen the app.</p>
          <button
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
