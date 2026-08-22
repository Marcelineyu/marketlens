import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { message: error.message || 'Something went wrong while rendering this view.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.message) {
      return (
        <main className="start">
          <section className="hero">
            <h1>We could not display this dataset</h1>
            <p>{this.state.message}</p>
            <p>Try uploading a different file or refreshing the page.</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
