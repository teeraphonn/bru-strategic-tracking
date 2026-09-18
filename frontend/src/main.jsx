/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/main.jsx
 * หน้าที่: จุดเริ่มต้นการเรนเดอร์แอพพลิเคชัน React เข้าสู่ DOM (#root)
 *          - นำเข้า Tailwind CSS และสไตล์ส่วนกลาง (index.css)
 *          - ครอบด้วย StrictMode สำหรับการตรวจสอบความถูกต้องในขั้นตอน Development
 *          - ครอบด้วย ErrorBoundary ป้องกันปัญหาหน้าจอขาวเมื่อเกิด Runtime Error
 *          - จัดการกรณี Chunk Mismatch เมื่อมีการ Deploy เวอร์ชั่นใหม่ (vite:preloadError)
 * ============================================================================
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// ─── จัดการข้อผิดพลาดเมื่อเกิด Dynamic Chunk Mismatch หลัง Deploy ──────────
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lock = sessionStorage.getItem('chunk_reload_lock');
  if (!lock) {
    sessionStorage.setItem('chunk_reload_lock', 'true');
    window.location.reload();
  }
});

// ล้าง Reload Lock เมื่อระบบเริ่มต้นทำงานสำเร็จผ่านไป 5 วินาที
setTimeout(() => {
  sessionStorage.removeItem('chunk_reload_lock');
}, 5000);

// ─── เรนเดอร์ React App เข้าสู่โหนด #root ใน index.html ───────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
