/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/layouts/AppLayout.jsx
 * หน้าที่: เลย์เอาต์โครงสร้างหลักของหน้าเว็บ (Application Shell Layout)
 *          - เมนูด้านข้าง Sidebar (รองรับ Mobile Drawer และ Desktop Collapse ย่อ/ขยาย)
 *          - แถบเมนูด้านบน Topbar (แสดงชื่อผู้ใช้ แจ้งเตือน และโปรไฟล์)
 *          - พื้นที่แสดงเนื้อหาหลัก <Outlet /> พร้อมแอนิเมชันเปลี่ยนหน้า (Page Enter)
 *          - รองรับการแสดงผลขณะสั่งพิมพ์ (Print-friendly Styles)
 * ============================================================================
 */

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AppLayout = () => {
  // สถานะเปิด/ปิด Sidebar บนมือถือ
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // สถานะย่อ/ขยาย Sidebar บนเดสก์ท็อป (80px vs 270px)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div 
      className="flex h-screen overflow-hidden bg-background"
      style={{ '--sidebar-width': sidebarCollapsed ? '80px' : '270px' }}
    >
      {/* ─── 1. เมนูนำทางด้านข้าง (Sidebar Navigation) ──────────────────────── */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        isCollapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* ─── 2. พื้นที่เนื้อหาหลักและ Topbar ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible print:h-auto print:block">
        {/* แถบด้านบน (Topbar Panel) */}
        <Topbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        {/* จุดแสดงผลเนื้อหาของ Route ย่อย (<Outlet />) */}
        <main
          key={location.pathname}
          className="flex-1 p-3.5 sm:p-5 md:p-7 lg:p-8 space-y-4 sm:space-y-6 bg-content-canvas page-enter print:p-0 print:m-0 print:space-y-0 print:bg-white min-w-0 max-w-full"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
