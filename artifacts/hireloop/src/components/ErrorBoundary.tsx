import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred in the application. Our team has been notified.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="p-3 bg-secondary/50 rounded-lg text-left text-xs font-mono overflow-auto max-h-40">
                <span className="text-destructive font-semibold">{this.state.error.message}</span>
              </div>
            )}

            <div className="pt-4 flex gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Reload Page
              </button>
              <Link href="/">
                <button 
                  onClick={() => this.setState({ hasError: false })}
                  className="px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  Go Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
