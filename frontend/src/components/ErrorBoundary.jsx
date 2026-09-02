import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-center">
          <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">เกิดข้อผิดพลาดในการแสดงผล</h2>
            <p className="text-xs text-slate-500 mb-4">
              {this.state.error?.message || 'ระบบเกิดข้อผิดพลาดชั่วคราวในการโหลดส่วนนี้'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md"
            >
              โหลดหน้าเว็บใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
