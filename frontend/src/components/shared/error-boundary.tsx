import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Heading shown when the subtree crashes. */
  fallbackTitle?: string;
  /** Body copy shown when the subtree crashes. */
  fallbackDescription?: string;
  /** Optional class applied to the fallback container. */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Isolates a render subtree (e.g. Resume Studio's LeftPane) so a crash from
 * telemetry, an observer callback, or malformed context data degrades to a
 * local retry card instead of freezing the whole page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // Keep reporting through the console (Sentry picks it up globally);
    // never rethrow — the boundary's job is containment.
    console.error("[ErrorBoundary] contained subtree crash:", error);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div
        className={
          this.props.className ??
          "m-4 rounded-xl border border-border/60 bg-surface/60 p-4 text-center"
        }
      >
        <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-warning/10 text-warning">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="mt-2 text-xs font-semibold text-foreground">
          {this.props.fallbackTitle ?? "This panel hit a hiccup"}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {this.props.fallbackDescription ??
            "Nothing was lost — your resume is safe. Retry to reload this panel."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 h-7 rounded-md text-[11px]"
          onClick={this.handleRetry}
        >
          <span className="text-[11px] font-medium">Retry panel</span>
        </Button>
      </div>
    );
  }
}
