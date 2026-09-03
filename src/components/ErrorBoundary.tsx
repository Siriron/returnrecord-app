import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ReturnRecord UI error', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main style={{ padding: 32 }}><h1>Something went wrong</h1><p>{this.state.error?.message}</p><button onClick={() => location.reload()}>Reload</button></main>;
  }
}
