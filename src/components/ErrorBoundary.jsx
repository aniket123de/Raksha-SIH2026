import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Raksha Portal ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="max-w-md space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Emergency View Recovered</h2>
              <p className="text-xs text-slate-400">
                A non-fatal rendering glitch was safely contained to keep your emergency system active and responsive.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-red-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Emergency View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('emergencylink_auth_user');
                  } catch {}
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Portal Select</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
