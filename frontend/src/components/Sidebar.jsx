import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { 
  FiGrid, 
  FiLayers, 
  FiDatabase, 
  FiPieChart, 
  FiLogOut,
  FiBookmark,
  FiGitCommit,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiImage,
  FiActivity,
  FiAlertTriangle,
  FiBriefcase,
  FiChevronDown,
  FiX
} from 'react-icons/fi';

// Role label helper
const getRoleLabel = (role) => {
  switch (role) {
    case 'ADMIN': return 'ผู้ดูแลระบบ';
    case 'PRESIDENT': return 'อธิการบดี';
    case 'DEAN': return 'คณบดี';
    case 'TEACHER': return 'อาจารย์ / เจ้าหน้าที่';
    default: return role || 'ผู้ใช้งาน';
  }
};

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [masterExpanded, setMasterExpanded] = useState(true);

  const navItems = user?.role === 'ADMIN' ? [
    { to: '/',             name: 'แดชบอร์ดภาพรวมระบบ', shortName: 'แดชบอร์ด', icon: <FiGrid className="w-5 h-5" />,          roles: ['ADMIN'] },
    {
      to: '/master-data',
      name: 'จัดการข้อมูลระบบ',
      shortName: 'ข้อมูลระบบ',
      icon: <FiDatabase className="w-5 h-5" />,
      roles: ['ADMIN'],
      subItems: [
        { to: '/master-data?tab=user',          name: 'ผู้ใช้งาน',                     shortName: 'ผู้ใช้',        icon: <FiUsers className="w-4 h-4" /> },
        { to: '/master-data?tab=strategy',      name: 'แผนงานหลัก (Program Name)',     shortName: 'แผนงานหลัก',    icon: <FiDatabase className="w-4 h-4" /> },
        { to: '/master-data?tab=sub-strategy',  name: 'แผนงานย่อย (Sub-Program Name)', shortName: 'แผนงานย่อย',    icon: <FiGitCommit className="w-4 h-4" /> },
        { to: '/master-data?tab=indicator',     name: 'โครงการหลัก (Main project Name)', shortName: 'โครงการหลัก', icon: <FiBriefcase className="w-4 h-4" /> },
        { to: '/projects',                      name: 'โครงการยุทธศาสตร์ทั้งหมด',     shortName: 'โครงการ',       icon: <FiBriefcase className="w-4 h-4" /> },
        { to: '/activities',                    name: 'รายการกิจกรรม',        shortName: 'กิจกรรม',   icon: <FiActivity className="w-4 h-4" /> },
        { to: '/master-data?tab=fiscal-year',   name: 'ปีงบประมาณ',           shortName: 'ปีงบฯ',    icon: <FiCalendar className="w-4 h-4" /> },
        { to: '/master-data?tab=budget-source', name: 'แหล่งงบประมาณ',        shortName: 'แหล่งงบฯ', icon: <FiDollarSign className="w-4 h-4" /> },
        { to: '/master-data?tab=faculty',       name: 'คณะ',                  shortName: 'คณะ',      icon: <FiBookmark className="w-4 h-4" /> },
        { to: '/master-data?tab=department',    name: 'ภาควิชา/หน่วยงาน',     shortName: 'ภาควิชา',  icon: <FiLayers className="w-4 h-4" /> },
      ]
    },
    { to: '/reports',      name: 'รายงานสรุป',        shortName: 'รายงาน',   icon: <FiPieChart className="w-5 h-5" />,      roles: ['ADMIN'] },
    { to: '/admin/issues', name: 'รายงานปัญหาระบบ',  shortName: 'ปัญหา',    icon: <FiAlertTriangle className="w-5 h-5" />, roles: ['ADMIN'] },
  ] : user?.role === 'TEACHER' ? [
    { to: '/',           name: 'แดชบอร์ดงานของฉัน',   shortName: 'แดชบอร์ด', icon: <FiGrid className="w-5 h-5" />,      roles: ['TEACHER'] },
    { to: '/projects',   name: 'รายการโครงการ',       shortName: 'โครงการ',   icon: <FiBriefcase className="w-5 h-5" />, roles: ['TEACHER'] },
    { to: '/activities', name: 'รายการกิจกรรม',       shortName: 'กิจกรรม',  icon: <FiActivity className="w-5 h-5" />,  roles: ['TEACHER'] },
    { to: '/gallery',    name: 'แกลเลอรีภาพกิจกรรม', shortName: 'แกลเลอรี', icon: <FiImage className="w-5 h-5" />,     roles: ['TEACHER'] },
  ] : user?.role === 'DEAN' ? [
    { to: '/',         name: 'แดชบอร์ดภาพรวมคณะ',       shortName: 'แดชบอร์ด', icon: <FiGrid className="w-5 h-5" />,     roles: ['DEAN'] },
    { to: '/projects', name: 'โครงการ & Red Flags คณะ', shortName: 'โครงการ',  icon: <FiBriefcase className="w-5 h-5" />, roles: ['DEAN'] },
    { to: '/reports',  name: 'รายงานสรุประดับคณะ',      shortName: 'รายงาน',   icon: <FiPieChart className="w-5 h-5" />,  roles: ['DEAN'] },
  ] : [
    { to: '/',         name: 'แดชบอร์ดภาพรวมสถาบัน',      shortName: 'แดชบอร์ด', icon: <FiGrid className="w-5 h-5" />,     roles: ['PRESIDENT'] },
    { to: '/projects', name: 'Strategic Heatmap โครงการ', shortName: 'โครงการ',  icon: <FiBriefcase className="w-5 h-5" />, roles: ['PRESIDENT'] },
    { to: '/reports',  name: 'รายงานสรุปยุทธศาสตร์',      shortName: 'รายงาน',   icon: <FiPieChart className="w-5 h-5" />,  roles: ['PRESIDENT'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden no-print print:hidden transition-opacity cursor-pointer"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col no-print print:hidden
        transition-transform duration-300 ease-in-out lg:static shadow-2xl lg:shadow-none
        ${isCollapsed ? 'w-20' : 'w-60'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
        style={{ background: 'linear-gradient(180deg, #2F1481 0%, #1E0A4A 100%)' }}
      >
        {/* ── Branding Header ── */}
        <div className={`flex items-center justify-between border-b border-white/10 shrink-0 ${isCollapsed ? 'justify-center py-4 px-2' : 'px-4 py-4'}`}>
          <div className="flex items-center gap-3">
            <img
              src="/logob.png"
              alt="BRU Logo"
              className={`object-contain shrink-0 drop-shadow-md ${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'}`}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {!isCollapsed && (
              <div>
                <div className="text-sm font-black tracking-wider text-white leading-tight">
                  BRU STRATEGIC
                </div>
                <div className="text-[9px] font-bold text-purple-300/80 tracking-wider uppercase mt-0.5">
                  Performance Tracking
                </div>
              </div>
            )}
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 lg:hidden transition-colors cursor-pointer"
            title="ปิดเมนู"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ── User Profile Card (Clean & Full Name) ── */}
        <div className={`mx-3 my-2.5 rounded-xl border border-white/10 bg-white/5 shrink-0 ${isCollapsed ? 'p-2 flex justify-center' : 'p-2.5 px-3'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
            {/* Avatar */}
            <div className="relative shrink-0" title={user?.name}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-white text-xs font-bold overflow-hidden">
                {user?.avatar ? (
                  <img 
                    src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} 
                    alt={user?.name || 'User'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400/90 rounded-full border border-[#2F1481]" />
            </div>

            {/* User info - Full clean name display */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white leading-snug break-words" title={user?.name}>
                  {user?.name}
                </div>
                <div className="text-[11px] text-purple-200/70 mt-0.5">
                  {getRoleLabel(user?.role)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-2.5 pb-2 overflow-y-auto space-y-0.5">
          {!isCollapsed && (
            <p className="text-[9px] font-extrabold text-purple-300/60 uppercase tracking-widest px-2 pt-2 pb-1.5">
              เมนูหลัก
            </p>
          )}

          {filteredItems.map(item => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            return (
              <div key={item.name} className="space-y-0.5">
                {hasSubItems ? (
                  <div>
                    <button
                      onClick={() => setMasterExpanded(!masterExpanded)}
                      title={isCollapsed ? item.name : undefined}
                      className={`w-full flex ${isCollapsed ? 'flex-col items-center justify-center gap-0.5 py-2 px-1' : 'items-center justify-between px-3 py-2.5'} rounded-xl font-semibold transition-all duration-200 text-[13px] text-white/60 hover:text-white hover:bg-white/8`}
                    >
                      <div className={`flex ${isCollapsed ? 'flex-col items-center gap-1 w-full' : 'items-center gap-3'}`}>
                        <span className="shrink-0">{item.icon}</span>
                        {isCollapsed ? (
                          <span className="text-[9px] font-extrabold leading-tight tracking-tight text-center break-words">{item.shortName || item.name}</span>
                        ) : (
                          <span className="leading-snug text-left">{item.name}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <FiChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${masterExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {masterExpanded && (
                      <div className={isCollapsed ? 'space-y-0.5 mt-1' : 'pl-4 mt-0.5 space-y-0.5 border-l-2 border-white/10 ml-5'}>
                        {item.subItems.map(sub => {
                          const currentTab = new URLSearchParams(location.search).get('tab');
                          const subTab = new URLSearchParams(sub.to.split('?')[1]).get('tab');
                          const isSubActive = subTab
                            ? (location.pathname.startsWith('/master-data') && currentTab === subTab)
                            : (location.pathname === sub.to || (sub.to !== '/' && location.pathname.startsWith(sub.to)));

                          return (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              title={isCollapsed ? sub.name : undefined}
                              className={`flex ${isCollapsed ? 'flex-col items-center justify-center gap-0.5 py-1.5 px-0.5' : 'gap-2.5 px-3 py-2'} rounded-xl font-semibold transition-all duration-150 group relative text-[12px]
                                ${isSubActive
                                  ? 'bg-white text-primary shadow-md shadow-black/20'
                                  : 'text-white/55 hover:text-white hover:bg-white/10'}`}
                              onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                            >
                              <span className="opacity-90 shrink-0">{sub.icon}</span>
                              {isCollapsed ? (
                                <span className="text-[8px] font-black leading-tight tracking-tight text-center break-words">{sub.shortName || sub.name}</span>
                              ) : (
                                <span className="leading-snug text-left">{sub.name}</span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) => `
                      flex ${isCollapsed ? 'flex-col items-center justify-center gap-0.5 py-2 px-1' : 'gap-3 px-3 py-2.5'} rounded-xl font-semibold transition-all duration-200 group relative text-[13px]
                      ${isActive
                        ? 'bg-white text-primary shadow-md shadow-black/20'
                        : 'text-white/60 hover:text-white hover:bg-white/10'}
                    `}
                    onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                  >
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">{item.icon}</span>
                    {isCollapsed ? (
                      <span className="text-[9px] font-extrabold leading-tight tracking-tight text-center break-words">{item.shortName || item.name}</span>
                    ) : (
                      <span className="leading-snug text-left">{item.name}</span>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer / Logout ── */}
        <div className="px-2.5 py-2.5 border-t border-white/10 shrink-0">
          <button
            onClick={logout}
            title={isCollapsed ? 'ออกจากระบบ' : undefined}
            className={`flex ${isCollapsed ? 'flex-col items-center justify-center gap-0.5 py-2 px-1' : 'gap-3 px-3 py-2.5'} w-full text-xs font-bold rounded-xl text-red-300/80 hover:text-red-200 hover:bg-red-500/15 transition-all duration-200 group`}
          >
            <FiLogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {isCollapsed ? (
              <span className="text-[9px] font-extrabold leading-none text-center">ออกระบบ</span>
            ) : (
              <span>ออกจากระบบ</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
