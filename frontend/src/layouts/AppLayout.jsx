import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div 
      className="flex h-screen overflow-hidden bg-background"
      style={{ '--sidebar-width': sidebarCollapsed ? '80px' : '224px' }}
    >
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        isCollapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible print:h-auto print:block">
        {/* Topbar Panel */}
        <Topbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        {/* Content Outlet — Soft Slate Canvas background + page enter animation */}
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

