import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0f12] text-neutral-200 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#14171d] border border-white/10 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Bir Hata Oluştu</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Uygulama çalışırken beklenmeyen bir durum meydana geldi. Sayfayı yenileyerek çalışmaya devam edebilirsiniz.
            </p>
            {this.state.error && (
              <pre className="p-3 rounded-lg bg-black/50 text-left text-[11px] font-mono text-red-400 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b5924d] text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sayfayı Yenile ve Devam Et</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
