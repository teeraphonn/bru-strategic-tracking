/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/services/api.js
 * หน้าที่: Axios HTTP Client Instance สำหรับติดต่อสื่อสารกับ Backend API
 *          - ตั้งค่า Base URL จาก Environment Variables (VITE_API_URL) หรือ Localhost
 *          - Request Interceptor: ดักจับและแนบ JWT Bearer Token อัตโนมัติทุก Request
 *          - Response Interceptor: ดักจับ HTTP 401 Unauthorized ล้าง Session และ Redirect ไปหน้า Login
 * ============================================================================
 */

import axios from 'axios';

// ─── สร้างอินสแตนซ์ของ Axios พร้อมกำหนดค่าเริ่มต้น ────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Timeout สูงสุด 30 วินาที
  headers: {
    'Content-Type': 'application/json'
  }
});

// ─── Request Interceptor: แนบ JWT Bearer Token อัตโนมัติ ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: จัดการ Error 401 Unauthorized กลาง ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // หากได้รับ 401 (Token หมดอายุ หรือไม่มีสิทธิ์) ให้ล้างข้อมูลและส่งไปหน้า Login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
