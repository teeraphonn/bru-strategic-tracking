import React, { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FiMenu, FiUser, FiKey, FiLogOut, FiX, FiBell, FiAlertTriangle, FiCalendar, FiTrash2, FiCheckSquare, FiSquare, FiCamera, FiClock, FiChevronDown } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../services/api';
import ReportIssueModal from './ReportIssueModal';
import ProfileModal from './ProfileModal';
import { getImageUrl, compressImage } from '../utils/imageUrl';

const Topbar = ({ toggleSidebar, toggleCollapse, isCollapsed }) => {
  const { user, setUser, logout, changePassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const avatarInputRef = useRef(null);

  // Dynamic page title from pathname, query params, and user role
  const getPageTitle = (pathname, search, role) => {
    const params = new URLSearchParams(search);
    const tab = params.get('tab');

    // Root path '/'
    if (pathname === '/') {
      if (role === 'ADMIN') return 'แดชบอร์ดภาพรวมระบบ';
      if (role === 'TEACHER') return 'แดชบอร์ดงานของฉัน';
      if (role === 'DEAN') return 'แดชบอร์ดภาพรวมคณะ';
      if (role === 'PRESIDENT') return 'แดชบอร์ดภาพรวมสถาบัน';
      return 'แดชบอร์ด';
    }

    if (pathname === '/master-data') {
      const masterTabs = {
        'user': 'จัดการข้อมูลผู้ใช้งาน',
        'local-issue': 'จัดการประเด็นการพัฒนาท้องถิ่น',
        'strategy': 'จัดการแผนงานหลัก',
        'sub-strategy': 'จัดการแผนงานย่อย',
        'indicator': 'จัดการโครงการหลัก',
        'fiscal-year': 'จัดการปีงบประมาณ',
        'budget-source': 'จัดการแหล่งงบประมาณ',
        'faculty': 'จัดการข้อมูลคณะ',
        'department': 'จัดการภาควิชา/หน่วยงาน'
      };
      return masterTabs[tab] || 'จัดการข้อมูลพื้นฐานระบบ';
    }

    if (pathname.startsWith('/dashboard')) return 'แดชบอร์ด';
    if (pathname.startsWith('/projects/new')) return 'สร้างโครงการใหม่';
    if (pathname.includes('/edit')) return 'แก้ไขโครงการ';
    if (pathname.startsWith('/projects/')) return 'รายละเอียดโครงการ';
    if (pathname.startsWith('/projects')) {
      if (role === 'ADMIN') return 'โครงการยุทธศาสตร์';
      if (role === 'DEAN') return 'โครงการ & Red Flags คณะ';
      if (role === 'PRESIDENT') return 'Strategic Heatmap โครงการ';
      return 'รายการโครงการ';
    }
    if (pathname.startsWith('/activities')) return 'รายการกิจกรรม';
    if (pathname.startsWith('/gallery')) return 'แกลเลอรีภาพกิจกรรม';
    if (pathname.startsWith('/reports')) {
      if (role === 'ADMIN') return 'รายงานสรุปภาพรวมระบบ';
      if (role === 'DEAN') return 'รายงานสรุประดับคณะ';
      if (role === 'PRESIDENT') return 'รายงานสรุปยุทธศาสตร์สถาบัน';
      return 'รายงานสรุป';
    }
    if (pathname.startsWith('/admin/issues')) return 'รายงานปัญหาระบบ';

    return 'ระบบติดตามการทำงานโครงการยุทธศาสตร์';
  };
  const pageTitle = getPageTitle(location.pathname, location.search, user?.role);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    if (!user?.id) return [];
    try {
      const saved = localStorage.getItem(`cleared_notifs_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [readNotifIds, setReadNotifIds] = useState(() => {
    if (!user?.id) return [];
    try {
      const saved = localStorage.getItem(`read_notifs_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedNotifIds, setSelectedNotifIds] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueModalTab, setIssueModalTab] = useState('form');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('ขนาดไฟล์เกินกำหนด', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5 MB', 'warning');
        return;
      }

      setUploadingAvatar(true);
      const compressed = await compressImage(file, 400, 0.8);
      const formData = new FormData();
      formData.append('avatar', compressed);

      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตรูปโปรไฟล์สำเร็จ',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      Swal.fire('อัปโหลดไม่สำเร็จ', err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Automatically close modals & popups when location/route changes
  useEffect(() => {
    setNotifOpen(false);
    setDropdownOpen(false);
    setProfileModalOpen(false);
    setModalOpen(false);
    setIssueModalOpen(false);
  }, [location.pathname]);

  // Load clearedNotifIds when user changes
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`cleared_notifs_${user.id}`);
        setClearedNotifIds(saved ? JSON.parse(saved) : []);
      } catch {
        setClearedNotifIds([]);
      }
    }
  }, [user?.id]);

  // Fetch notifications for all roles (Issues updates for users, pending issues for Admin, deadline projects for Teachers)
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const combinedNotifs = [];

        // 1. Fetch system issue notifications
        try {
          const res = await api.get('/issues/notifications');
          const issueNotifs = res.data.data || [];
          combinedNotifs.push(...issueNotifs);
        } catch (err) {
          console.error('Failed to load issue notifications:', err);
        }

        // 2. Fetch near-deadline projects for TEACHER role
        if (user?.role === 'TEACHER') {
          try {
            const response = await api.get('/projects', { params: { limit: 100 } });
            const teacherProjects = response.data.projects || [];
            const today = new Date();

            const projectAlerts = teacherProjects.map(proj => {
              if (proj.progress >= 100) return null;
              const endDate = new Date(proj.endDate);
              const diffTime = endDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays <= 30) {
                return {
                  id: `project-${proj.id}`,
                  projectId: proj.id,
                  type: 'PROJECT_DEADLINE',
                  title: `โครงการ: ${proj.name}`,
                  subtitle: diffDays < 0 ? `เกินกำหนดส่งผลงานมาแล้ว ${Math.abs(diffDays)} วัน` : `เหลือเวลาอีก ${diffDays} วันก่อนสิ้นสุดโครงการ`,
                  diffDays,
                  isExpired: diffDays < 0
                };
              }
              return null;
            }).filter(Boolean);

            combinedNotifs.push(...projectAlerts);
          } catch (err) {
            console.error('Failed to load project notifications:', err);
          }

          // 3. Fetch Executive Directives notifications for TEACHER role (separate DEAN and PRESIDENT)
          try {
            const response = await api.get('/projects', { params: { limit: 100 } });
            const teacherProjects = response.data.projects || [];
            
            teacherProjects.forEach(proj => {
              if (proj.deanDirective) {
                combinedNotifs.push({
                  id: `directive-dean-${proj.id}`,
                  projectId: proj.id,
                  type: 'EXECUTIVE_DIRECTIVE',
                  issuerRole: 'DEAN',
                  title: `🚨 ข้อสั่งการจากคณบดี (โครงการ: ${proj.name})`,
                  subtitle: `ข้อสั่งการโดย ${proj.deanDirectiveIssuerName || 'คณบดี'}: "${proj.deanDirective}"`,
                  timestamp: proj.deanDirectiveUpdatedAt || proj.updatedAt
                });
              }

              if (proj.presidentDirective) {
                combinedNotifs.push({
                  id: `directive-president-${proj.id}`,
                  projectId: proj.id,
                  type: 'EXECUTIVE_DIRECTIVE',
                  issuerRole: 'PRESIDENT',
                  title: `🏛️ ข้อสั่งการจากอธิการบดี (โครงการ: ${proj.name})`,
                  subtitle: `ข้อสั่งการโดย ${proj.presidentDirectiveIssuerName || 'อธิการบดี'}: "${proj.presidentDirective}"`,
                  timestamp: proj.presidentDirectiveUpdatedAt || proj.updatedAt
                });
              }

              if (!proj.deanDirective && !proj.presidentDirective && proj.executiveDirective) {
                combinedNotifs.push({
                  id: `directive-legacy-${proj.id}`,
                  projectId: proj.id,
                  type: 'EXECUTIVE_DIRECTIVE',
                  issuerRole: proj.directiveIssuerRole || 'EXECUTIVE',
                  title: `🚨 ข้อสั่งการผู้บริหาร (โครงการ: ${proj.name})`,
                  subtitle: `ข้อสั่งการ: "${proj.executiveDirective}"`,
                  timestamp: proj.directiveUpdatedAt || proj.updatedAt
                });
              }
            });
          } catch (err) {
            console.error('Failed to load directive notifications:', err);
          }
        }

        // Attach standardized timestamp and sort strictly:
        // 1. Unread notifications first
        // 2. Newest timestamp first
        combinedNotifs.forEach(n => {
          n.timestamp = n.timestamp || n.directiveUpdatedAt || n.createdAt || n.updatedAt || n.endDate || new Date();
        });

        combinedNotifs.sort((a, b) => {
          const aRead = readNotifIds.includes(a.id) ? 1 : 0;
          const bRead = readNotifIds.includes(b.id) ? 1 : 0;
          if (aRead !== bRead) {
            return aRead - bRead; // Unread (0) comes before read (1)
          }
          return new Date(b.timestamp) - new Date(a.timestamp); // Newest first
        });

        setNotifications(combinedNotifs);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    window.addEventListener('focus', fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchNotifications);
    };
  }, [user]);

  // Filter out cleared notifications
  const visibleNotifications = notifications.filter(n => !clearedNotifIds.includes(n.id));
  const unreadNotifications = visibleNotifications.filter(n => !readNotifIds.includes(n.id));

  const markNotifAsRead = (id) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      if (user?.id) {
        localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  const saveClearedIds = (ids) => {
    setClearedNotifIds(ids);
    if (user?.id) {
      localStorage.setItem(`cleared_notifs_${user.id}`, JSON.stringify(ids));
    }
  };

  const handleClearSingleNotification = (id, e) => {
    e.stopPropagation();
    const updated = [...clearedNotifIds, id];
    saveClearedIds(updated);
    setSelectedNotifIds(prev => prev.filter(item => item !== id));
  };

  const handleClearSelectedNotifications = () => {
    if (selectedNotifIds.length === 0) return;
    Swal.fire({
      title: `ยืนยันลบการแจ้งเตือนที่เลือก (${selectedNotifIds.length} รายการ)?`,
      text: 'คุณต้องการลบรายการแจ้งเตือนที่เลือกไว้ใช่หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบรายการที่เลือก',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = Array.from(new Set([...clearedNotifIds, ...selectedNotifIds]));
        saveClearedIds(updated);
        setSelectedNotifIds([]);
        Swal.fire({
          icon: 'success',
          title: 'ลบรายการแจ้งเตือนที่เลือกสำเร็จ',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  const handleClearAllNotifications = () => {
    if (visibleNotifications.length === 0) return;
    Swal.fire({
      title: 'ยืนยันการล้างการแจ้งเตือนทั้งหมด?',
      text: 'คุณต้องการลบรายการแจ้งเตือนทั้งหมดออกจากกล่องแจ้งเตือนใช่หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ล้างทั้งหมด',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        const allIds = visibleNotifications.map(n => n.id);
        const updated = Array.from(new Set([...clearedNotifIds, ...allIds]));
        saveClearedIds(updated);
        setSelectedNotifIds([]);
        Swal.fire({
          icon: 'success',
          title: 'ล้างการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  const toggleSelectNotif = (id, e) => {
    e.stopPropagation();
    setSelectedNotifIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenProfileModal = (e) => {
    if (e) e.stopPropagation();
    setDropdownOpen(false);
    setProfileModalOpen(true);
  };

  const handleOpenChangePasswordModal = (e) => {
    if (e) e.stopPropagation();
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const handleOpenIssueModal = (tab = 'form', e) => {
    if (e) e.stopPropagation();
    setDropdownOpen(false);
    setIssueModalTab(tab);
    setIssueModalOpen(true);
  };

  // ESC key listener for profile & password modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (profileModalOpen) setProfileModalOpen(false);
        if (modalOpen) setModalOpen(false);
      }
    };
    if (profileModalOpen || modalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [profileModalOpen, modalOpen]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'รหัสผ่านใหม่ไม่ตรงกัน', text: 'กรุณากรอกรหัสผ่านใหม่อีกครั้ง' });
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire({ icon: 'error', title: 'รหัสผ่านสั้นเกินไป', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', showConfirmButton: false, timer: 1500 });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <header 
      className="sticky top-0 z-40 flex items-center justify-between h-16 py-2 px-3.5 sm:px-6 md:px-8 text-slate-800 border-b border-purple-200/70 shadow-xs transition-all duration-200 no-print print:hidden"
      style={{ background: 'linear-gradient(90deg, #EDE9FE 0%, #F5F3FF 100%)' }}
    >
      <div className="flex items-center gap-2">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleSidebar} 
          className="p-2 -ml-1 sm:-ml-2 text-primary bg-white hover:bg-white/80 border border-purple-200/80 rounded-xl lg:hidden focus:outline-none transition-all shadow-2xs cursor-pointer"
          title="ซ่อน/แสดง เมนู"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <button 
          onClick={toggleCollapse} 
          className="hidden lg:flex p-2 -ml-2 text-primary bg-white hover:bg-white/80 border border-purple-200/80 rounded-xl focus:outline-none transition-all shadow-2xs cursor-pointer"
          title={isCollapsed ? "ขยายแถบบาร์" : "ย่อ/ซ่อนแถบบาร์"}
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Page Title (Truncated, Clear) */}
      <div className="sm:hidden flex items-center min-w-0 flex-1 px-2">
        <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-black truncate shadow-xs">
          {pageTitle}
        </span>
      </div>

      {/* Center: Single line layout with prominent page title badge */}
      <div className="hidden sm:flex items-center gap-2.5 text-xs md:text-sm whitespace-nowrap">
        {/* ส่วนหน้า: ชื่อหน้า (Badge สีม่วงเด่นชัด) */}
        <span className="px-3 py-1 rounded-xl bg-primary text-white font-black tracking-tight shadow-md shadow-primary/20">
          {pageTitle}
        </span>

        <span className="text-purple-300 font-normal">|</span>

        {/* ชื่อระบบ (สีดำ/เทาเข้ม) */}
        <span className="text-slate-800 font-bold tracking-wide">
          ระบบติดตามการทำงานโครงการยุทธศาสตร์
        </span>

        {/* จุดคั่น */}
        <span className="text-purple-300 font-bold">•</span>

        {/* วันที่ (สีม่วงเข้ม) */}
        <span className="text-purple-700 font-semibold">
          {new Date().toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Bell notification badge for ALL users */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(false);
                setNotifOpen(!notifOpen);
              }}
              className="p-2 text-primary bg-white hover:bg-white/80 border border-purple-200/80 rounded-xl transition-all relative focus:outline-none shadow-2xs cursor-pointer"
              title="การแจ้งเตือนระบบ"
            >
              <FiBell className="w-5 h-5" />
              {visibleNotifications.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] font-black rounded-full flex items-center justify-center bg-rose-500 shadow-md animate-pulse`}>
                  {unreadNotifications.length > 0 ? unreadNotifications.length : visibleNotifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute top-full right-0 mt-2 z-50 w-[calc(100vw-28px)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 overflow-hidden origin-top-right">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FiBell className="w-4 h-4 text-primary" />
                      <span>การแจ้งเตือนระบบ</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                        ใหม่ {unreadNotifications.length} / ทั้งหมด {visibleNotifications.length}
                      </span>
                      {visibleNotifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllNotifications}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                          title="ล้างการแจ้งเตือนทั้งหมด"
                        >
                          <FiTrash2 className="w-3 h-3" /> ล้างทั้งหมด
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="ปิดการแจ้งเตือน"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-selection Toolbar if any item selected */}
                  {selectedNotifIds.length > 0 && (
                    <div className="px-4 py-1.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-rose-700">
                        เลือกไว้ {selectedNotifIds.length} รายการ
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelectedNotifications}
                        className="text-[10px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                      >
                        ลบรายการที่เลือก
                      </button>
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.map((item) => {
                        const isSelected = selectedNotifIds.includes(item.id);
                        const isUnread = !readNotifIds.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              markNotifAsRead(item.id);
                              setNotifOpen(false);
                              if (item.type === 'ADMIN_NEW_ISSUE') {
                                navigate('/admin/issues');
                              } else if (item.type === 'USER_ISSUE_UPDATE') {
                                setIssueModalTab('history');
                                setIssueModalOpen(true);
                              } else if (item.type === 'PROJECT_DEADLINE' || item.type === 'EXECUTIVE_DIRECTIVE') {
                                navigate(`/projects/${item.projectId}`);
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5 relative group ${
                              isUnread ? 'bg-rose-50/30' : isSelected ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(e) => toggleSelectNotif(item.id, e)}
                                  className="mt-0.5 text-slate-400 hover:text-primary transition-colors shrink-0"
                                  title={isSelected ? 'ยกเลิกการเลือก' : 'เลือกการแจ้งเตือนนี้'}
                                >
                                  {isSelected ? (
                                    <FiCheckSquare className="w-4 h-4 text-primary" />
                                  ) : (
                                    <FiSquare className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isUnread && (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs shrink-0 animate-pulse">
                                        แจ้งเตือนใหม่
                                      </span>
                                    )}
                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{item.title}</h4>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {item.type === 'PROJECT_DEADLINE' ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-500 shrink-0 flex items-center gap-1">
                                    <FiAlertTriangle className="w-3 h-3" />
                                    {item.isExpired ? 'เกินกำหนด' : `${item.diffDays} วัน`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">
                                    {item.type === 'EXECUTIVE_DIRECTIVE' ? 'ข้อสั่งการ' : item.type === 'ADMIN_NEW_ISSUE' ? 'เรื่องใหม่' : 'อัปเดต'}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => handleClearSingleNotification(item.id, e)}
                                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100"
                                  title="ลบการแจ้งเตือนนี้"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 pl-6">
                              {item.subtitle}
                            </p>

                            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 pt-0.5 pl-6">
                              <FiClock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {new Date(item.timestamp).toLocaleString('th-TH', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} น.
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">
                        ไม่มีรายการแจ้งเตือนในขณะนี้
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User profile dropdown (Minimal Clean) */}
        <button
          onClick={() => {
            setNotifOpen(false);
            setDropdownOpen(!dropdownOpen);
          }}
          className="flex items-center gap-2.5 py-1 px-1.5 pr-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 transition-all focus:outline-none group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs overflow-hidden shrink-0 border border-slate-200/80">
            {user?.avatar ? (
              <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <span className="hidden md:block text-xs font-semibold text-slate-700 max-w-[130px] truncate">
            {user?.name}
          </span>
          <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute top-full right-0 mt-2 z-50 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 transform scale-100 transition-all duration-200 origin-top-right">
              <div className="px-4 py-2.5 mb-1.5 border-b border-slate-100 bg-slate-50/50">
                <div className="text-xs font-extrabold text-slate-800 truncate">{user?.name}</div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                  {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : user?.role === 'PRESIDENT' ? 'อธิการบดี' : user?.role === 'DEAN' ? 'คณบดี' : 'อาจารย์ / เจ้าหน้าที่'}
                </div>
                {user?.personnelCode && (
                  <div className="text-[10px] font-medium text-slate-400 mt-0.5">รหัสประจำตัว: {user?.personnelCode}</div>
                )}
              </div>
              <button
                onClick={handleOpenProfileModal}
                className="flex items-center gap-2.5 w-[92%] mx-auto px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-left transition-all"
              >
                <FiUser className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>ดูรายละเอียดโปรไฟล์</span>
              </button>
              
              <button
                onClick={handleOpenChangePasswordModal}
                className="flex items-center gap-2.5 w-[92%] mx-auto px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-left transition-all"
              >
                <FiKey className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>

              <button
                onClick={(e) => handleOpenIssueModal('form', e)}
                className="flex items-center gap-2.5 w-[92%] mx-auto px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl text-left transition-all"
              >
                <FiAlertTriangle className="w-4 h-4 text-rose-500" />
                <span>แจ้งปัญหาระบบ</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2.5 w-[92%] mx-auto px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl text-left transition-all"
              >
                <FiLogOut className="w-4 h-4 text-red-500" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {modalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fadeIn" 
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div 
            className="relative w-full max-w-md bg-white text-slate-800 rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Soft & Clean Header ── */}
            <div className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-slate-50 p-5 sm:p-6 border-b border-slate-100 relative shrink-0">
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-all duration-150 cursor-pointer focus:outline-none border border-slate-200/80 shadow-2xs"
                title="ปิดหน้าต่าง"
              >
                <FiX className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-primary shrink-0 shadow-2xs">
                  <FiKey className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">เปลี่ยนรหัสผ่านบัญชี</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  รหัสผ่านปัจจุบัน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  รหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Detail Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)}
        user={user}
        uploadingAvatar={uploadingAvatar}
        onAvatarUpload={handleAvatarUpload}
        avatarInputRef={avatarInputRef}
      />

      {/* System Issue Report Modal */}
      <ReportIssueModal 
        isOpen={issueModalOpen} 
        onClose={() => setIssueModalOpen(false)} 
        initialTab={issueModalTab}
      />
    </header>
  );
};

export default Topbar;
