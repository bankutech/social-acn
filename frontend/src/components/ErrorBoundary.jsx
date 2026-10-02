import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Hook for future telemetry (Sentry etc.)
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="eb-root">
          <span className="eb-mark">ACN+</span>
          <h2>Something broke on this page</h2>
          <p>
            Your data is safe. Reloading usually fixes it — if it keeps happening, the details below
            help track down the cause.
          </p>
          {this.state.error && (
            <pre className="eb-detail">
              {String(this.state.error.message || this.state.error).slice(0, 200)}
            </pre>
          )}
          <button onClick={this.handleReload}>
            <RotateCcw size={14} /> Reload
          </button>
          <style>{`
            .eb-root {
              min-height: 100vh;
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              gap: 10px; padding: 24px; text-align: center;
              background: var(--bg-primary, #17140f); color: var(--text-primary, #ece7dc);
              font-family: 'Inter', sans-serif;
            }
            .eb-mark {
              font-family: 'Fraunces', Georgia, serif;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 14px;
            }
            .eb-root h2 {
              font-family: 'Fraunces', Georgia, serif;
              font-size: 20px; font-weight: 500; margin: 0;
            }
            .eb-root p { color: var(--text-secondary, #a89f8f); font-size: 14px; margin: 0 0 10px; max-width: 340px; line-height: 1.6; }
            .eb-detail {
              font-family: 'JetBrains Mono', monospace;
              font-size: 11.5px;
              color: var(--text-muted, #6f6759);
              background: var(--bg-secondary, #1d1915);
              border: 1px solid var(--border-color, #2e2820);
              border-radius: 6px;
              padding: 10px 12px;
              max-width: 380px;
              overflow-wrap: anywhere;
              text-align: left;
              margin: 0 0 8px;
            }
            .eb-root button {
              display: inline-flex; align-items: center; gap: 7px;
              background: var(--accent, #c96a3b);
              color: #1d1915; border: none; cursor: pointer;
              padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;
            }
            .eb-root button:hover { background: var(--accent-light, #e08a55); }
          `}</style>
        </div>
      );
    }
    return this.props.children;
  }
}
