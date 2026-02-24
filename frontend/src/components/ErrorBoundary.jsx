import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button.jsx';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
          <div className="glass-card max-w-md w-full p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-display font-semibold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              We encountered an unexpected error. Please refresh the page or try again later.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
            >
              Back to home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
