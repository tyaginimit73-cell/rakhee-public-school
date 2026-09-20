import { Component } from 'react';

// Previously there was no error boundary anywhere in the app — a thrown
// error during render (a null-pointer style bug, a bad API shape, etc.)
// would unmount the entire React tree and leave a blank white screen with
// no way to recover short of the user guessing to reload. See
// PROJECT_AUDIT.md Phase 4/10.
//
// React error boundaries must be class components — there is no Hooks
// equivalent of getDerivedStateFromError/componentDidCatch.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this is the only remaining signal that something broke
    // (no crash-reporting service is wired up in this project) — kept as
    // console.error rather than removed, so it's still visible in server/
    // hosting logs if the user checks the browser console.
    console.error('Unhandled error in the app:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted">
            This page hit an unexpected error. You can try going back to the homepage — if the
            problem continues, please contact the school office.
          </p>
          <button type="button" className="btn-primary" onClick={this.handleReload}>Back to homepage</button>
        </div>
      );
    }
    return this.props.children;
  }
}
