import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('МЕЗО: ошибка рендеринга', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="boot-error">
          <b>МЕЗО</b>
          <h1>Не удалось открыть приложение</h1>
          <p>Обновите страницу или закройте и снова запустите МЕЗО.</p>
          <button type="button" onClick={() => window.location.reload()}>Повторить</button>
        </main>
      );
    }
    return this.props.children;
  }
}
