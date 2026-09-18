/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/contexts/AuthContext.jsx
 * หน้าที่: React Context สำหรับบริหารจัดการสถานะการยืนยันตัวตน (Authentication State Store)
 *          - จัดเก็บข้อมูลผู้ใช้งาน (user) และสถานะการโหลด (loading)
 *          - ตรวจสอบความถูกต้องของ Token ใน LocalStorage เมื่อเปิดแอพ (checkUserSession)
 *          - จัดเตรียมฟังก์ชันหลัก: login, logout, changePassword, refreshUser
 *          - กระจาย Context ไปยังทุก Component ทั่วทั้งระบบผ่าน <AuthProvider>
 * ============================================================================
 */

import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * ตรวจสอบ Session และความถูกต้องของ Token จาก LocalStorage
   * - เรียก GET /api/auth/me เพื่อดึงข้อมูลโปรไฟล์ล่าสุด
   * - หาก Token หมดอายุหรือไม่ถูกต้อง จะล้างค่าใน LocalStorage อัตโนมัติ
   */
  const checkUserSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (err) {
      console.error('Session validation failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบสถานะการ Login ทันทีเมื่อแอพพลิเคชันเริ่มต้นทำงาน
  useEffect(() => {
    checkUserSession();
  }, []);

  /**
   * ฟังก์ชันเข้าสู่ระบบ (Login)
   * @param {string} username - ชื่อผู้ใช้งาน
   * @param {string} password - รหัสผ่าน
   * @returns {Promise<Object>} ข้อมูลผู้ใช้
   */
  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  /**
   * ฟังก์ชันออกจากระบบ (Logout)
   * - ล้าง Token และ User Cache ใน LocalStorage
   * - นำทางกลับไปยังหน้า Login ทันที
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login');
  };

  /**
   * ฟังก์ชันเปลี่ยนรหัสผ่านของตนเอง
   */
  const changePassword = async (oldPassword, newPassword) => {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, changePassword, refreshUser: checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};
