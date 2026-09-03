import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <h1>Something broke</h1>
          <p style={{ color: 'var(--ash)', marginTop: 12 }}>
            {this.state.message ?? 'An unexpected error occurred.'}
          </p>
          <button className="btn btn--primary" style={{ marginTop: 24 }} onClick={() => window.location.assign('/')}>
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
