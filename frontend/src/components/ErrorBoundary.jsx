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
    if (error?.message && (
      error.message.includes('dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('Loading chunk')
    )) {
      const lock = sessionStorage.getItem('chunk_reload_lock');
      if (!lock) {
        sessionStorage.setItem('chunk_reload_lock', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('dynamically imported module') ||
                           this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-center">
          <div className="p-8 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold ${
              isChunkError ? 'bg-primary/10 text-primary' : 'bg-rose-100 text-rose-600'
            }`}>
              {isChunkError ? '🚀' : '!'}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {isChunkError ? 'ระบบมีการอัปเดตเวอร์ชันใหม่' : 'เกิดข้อผิดพลาดในการแสดงผล'}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {isChunkError 
                  ? 'เซิร์ฟเวอร์เพิ่งได้รับการปรับปรุงโค้ดเวอร์ชันล่าสุด กรุณากดปุ่มด้านล่างเพื่อโหลดข้อมูลใหม่'
                  : (this.state.error?.message || 'ระบบเกิดข้อผิดพลาดชั่วคราวในการโหลดส่วนนี้')}
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('chunk_reload_lock');
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/25 cursor-pointer"
            >
              🔄 อัปเดตและโหลดหน้าเว็บใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
