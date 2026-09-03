import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUser, FiKey, FiBriefcase, FiLayers, FiBookmark, FiCamera } from 'react-icons/fi';
import { getImageUrl } from '../utils/imageUrl';

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  uploadingAvatar, 
  onAvatarUpload, 
  avatarInputRef 
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const getAvatarSrc = (avatarPath) => {
    if (!avatarPath || typeof avatarPath !== 'string') return null;
    return getImageUrl(avatarPath);
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case 'ADMIN': return 'ผู้ดูแลระบบ (Admin)';
      case 'PRESIDENT': return 'อธิการบดี';
      case 'DEAN': return 'คณบดี';
      default: return 'อาจารย์ / เจ้าหน้าที่';
    }
  };

  const departmentName = typeof user.department === 'object' && user.department?.name 
    ? user.department.name 
    : (typeof user.department === 'string' ? user.department : 'ส่วนกลาง');

  const facultyName = typeof user.department === 'object' && user.department?.faculty?.name 
    ? user.department.faculty.name 
    : (typeof user.faculty === 'object' && user.faculty?.name ? user.faculty.name : 'มหาวิทยาลัยราชภัฏบุรีรัมย์');

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-md bg-white text-slate-800 rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <input 
          type="file" 
          ref={avatarInputRef} 
          accept="image/jpeg,image/jpg,image/png" 
          className="hidden" 
          onChange={onAvatarUpload} 
        />

        {/* ── Soft & Clean Header ── */}
        <div className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-slate-50 p-6 border-b border-slate-100 relative shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-all duration-150 cursor-pointer focus:outline-none border border-slate-200/80 shadow-2xs"
            title="ปิดหน้าต่าง"
          >
            <FiX className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-4 relative z-10 pr-8">
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="group relative w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary/50 flex items-center justify-center text-2xl font-black text-slate-700 shadow-sm shrink-0 overflow-hidden cursor-pointer transition-all"
              title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
            >
              {user.avatar ? (
                <img 
                  src={getAvatarSrc(user.avatar)} 
                  alt={user.name || 'User'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-primary">{user.name?.charAt(0) || 'U'}</span>
              )}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
                <FiCamera className="w-4 h-4 mb-0.5" />
                <span>เปลี่ยนรูป</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold tracking-wider mb-1">
                ข้อมูลผู้ใช้งาน
              </span>
              <h3 className="text-base font-bold text-slate-800 truncate">{user.name || '-'}</h3>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {getRoleTitle(user.role)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Content Body ── */}
        <div className="p-5 space-y-3.5 overflow-y-auto min-h-0">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="w-full py-2 px-3 bg-slate-50 hover:bg-purple-50/50 text-slate-700 hover:text-primary border border-slate-200 hover:border-purple-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <FiCamera className="w-4 h-4 text-primary" />
            <span>{uploadingAvatar ? 'กำลังอัปโหลด...' : 'อัปเดตรูปโปรไฟล์ (JPG, PNG)'}</span>
          </button>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Field 1: Name */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                <FiUser className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อ - นามสกุล</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{user.name || '-'}</div>
              </div>
            </div>

            {/* Field 2: Personnel Code */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                <FiKey className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รหัสประจำตัว</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {user.personnelCode ? (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-primary border border-purple-200/60 inline-block font-bold">
                      {user.personnelCode}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Field 3: Position / Role */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                <FiBriefcase className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ตำแหน่ง / บทบาทระบบ</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {getRoleTitle(user.role)}
                </div>
              </div>
            </div>

            {/* Field 4: Department */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                <FiLayers className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ภาควิชา / หน่วยงาน</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{departmentName}</div>
              </div>
            </div>

            {/* Field 5: Faculty */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-500 shrink-0 mt-0.5 shadow-2xs">
                <FiBookmark className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สังกัดคณะ</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {facultyName}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Action ── */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
