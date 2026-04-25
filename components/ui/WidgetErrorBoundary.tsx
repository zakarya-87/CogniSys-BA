import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Simulated Telemetry Tracking
    console.error(' [CogniSys Telemetry] Widget Error:', {
        message: error.message,
        component: this.props.title || 'Unknown Widget',
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
  }

  private handleReset = () => {
    if (this.props.onReset) this.props.onReset();
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private handleSelfHeal = () => {
    // Simulate "Self-Healing" by clearing specific localStorage keys or just a full reload
    console.warn('[Self-Heal] purging component state cache...');
    localStorage.removeItem(`widget_state_${this.props.title?.toLowerCase().replace(/\s/g, '_')}`);
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-surface p-8 flex flex-col items-center justify-center text-center min-h-[250px] space-y-6 border-accent-red/20 shadow-2xl rounded-[2rem] animate-pulse-slow">
          <div className="relative">
            <div className="absolute inset-0 bg-accent-red/20 blur-xl rounded-full" />
            <div className="relative bg-accent-red/10 p-4 rounded-2xl border border-accent-red/30">
                <AlertTriangle className="h-8 w-8 text-accent-red" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-black text-white uppercase tracking-[0.2em]">
              {this.props.title ? `${this.props.title} Offline` : 'Core Runtime Failure'}
            </h4>
            <p className="text-xs text-text-muted-dark max-w-[280px] leading-relaxed font-medium">
              The AI Orchestrator encountered a structural anomaly in this widget's rendering pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent-red/20 border border-accent-red/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent-red hover:bg-accent-red hover:text-white transition-all shadow-lg"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Component
              </button>
              
              <button
                onClick={this.handleSelfHeal}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent-teal/20 border border-accent-teal/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent-teal hover:bg-accent-teal hover:text-white transition-all shadow-lg"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Self-Heal
              </button>
          </div>

          <button 
            onClick={this.toggleDetails}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors"
          >
            <Terminal className="h-3 w-3" />
            {this.state.showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
          </button>

          {this.state.showDetails && (
            <div className="w-full text-left bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[9px] text-accent-red/80 overflow-auto max-h-[150px] custom-scrollbar animate-in slide-in-from-top-2 duration-300">
                <p className="font-bold uppercase mb-2 border-b border-white/10 pb-1">Anomalous Traceback:</p>
                {this.state.error?.stack || 'No trace available'}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
