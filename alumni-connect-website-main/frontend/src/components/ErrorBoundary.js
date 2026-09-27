import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home, LogIn, Trash2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  handleGoLogin = () => {
    this.setState({ hasError: false });
    window.location.href = '/login';
  };

  handleClearCacheAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  handleCopyDetails = () => {
    const errorText = [
      `Error: ${this.state.error?.toString() || 'Unknown Error'}`,
      `Path: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}`,
      `Stack: ${this.state.error?.stack || 'No stack'}`,
      `Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}`
    ].join('\n\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(errorText).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 p-6 sm:p-8 rounded-3xl shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              We encountered an unexpected issue while rendering this page. You can safely return to the home page or reset your local session.
            </p>
            
            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button 
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
              
              <button 
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-colors border border-slate-600/50"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Page
              </button>
            </div>

            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button 
                onClick={this.handleGoLogin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded-xl font-medium text-xs transition-colors border border-slate-700"
              >
                <LogIn className="w-3.5 h-3.5" />
                Go to Login
              </button>
              
              <button 
                onClick={this.handleClearCacheAndReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-300 rounded-xl font-medium text-xs transition-colors border border-red-800/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cache & Reset
              </button>
            </div>

            {/* Expandable Technical Details */}
            {this.state.error && (
              <div className="border-t border-slate-700/60 pt-4 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1"
                >
                  <span>Technical Error Details</span>
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 bg-black/40 border border-slate-700/60 p-4 rounded-xl text-xs font-mono overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 font-semibold truncate pr-2">
                        {this.state.error.name || 'Error'}: {this.state.error.message || this.state.error.toString()}
                      </span>
                      <button
                        onClick={this.handleCopyDetails}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] shrink-0 transition-colors"
                        title="Copy error details"
                      >
                        {this.state.copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {this.state.copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 text-slate-400 text-[11px] leading-relaxed">
                      {this.state.error.stack && (
                        <pre className="whitespace-pre-wrap text-slate-400">{this.state.error.stack}</pre>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <pre className="whitespace-pre-wrap text-slate-500 border-t border-slate-800 pt-2">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
