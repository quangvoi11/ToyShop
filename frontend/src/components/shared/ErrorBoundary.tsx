import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">Đã có lỗi xảy ra</h1>
          <p className="mb-4 text-gray-500">Vui lòng tải lại trang.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary/90"
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
