import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import {
  FiX,
  FiAlertTriangle,
  FiActivity,
  FiBriefcase,
  FiUser,
  FiCalendar,
  FiExternalLink,
  FiCheckCircle,
  FiDollarSign,
  FiTarget,
  FiChevronLeft,
  FiChevronRight,
  FiSend
} from 'react-icons/fi';
import { getImageUrl } from '../utils/imageUrl';

const ExecutiveProjectModal = ({ project, onClose, onProjectUpdated }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [directiveText, setDirectiveText] = useState('');
  const [savingDirective, setSavingDirective] = useState(false);

  if (!project) return null;

  const budgetNum = parseFloat(project.totalBudget || 0);
  const spentNum = project.totalSpent || 0;
  const progressPct = project.progressPct || 0;
  const burnRatePct = project.burnRatePct || 0;
  const rag = project.rag || { status: 'GREEN', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  const handleSaveDirective = async () => {
    if (!directiveText.trim()) return;
    try {
      setSavingDirective(true);
      const res = await api.post(`/projects/${project.id}/directive`, {
        directive: directiveText.trim()
      });
      Swal.fire({
        icon: 'success',
        title: 'ออกข้อสั่งการสำเร็จ',
        text: 'ข้อสั่งการถูกส่งตรงไปยังผู้รับผิดชอบโครงการเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false
      });
      project.presidentDirective = directiveText.trim();
      project.executiveDirective = directiveText.trim();
      project.directiveIssuerName = user?.name || user?.username;
      project.directiveUpdatedAt = new Date().toISOString();
      setDirectiveText('');
      if (onProjectUpdated) onProjectUpdated(res.data);
    } catch (err) {
      console.error('Failed to issue directive:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อสั่งการได้'
      });
    } finally {
      setSavingDirective(false);
    }
  };

  const projectPhotos = [];
  if (project.activities) {
    project.activities.forEach(a => {
      if (a.images && a.images.length > 0) {
        a.images.forEach(img => {
          projectPhotos.push({
            id: img.id,
            imageUrl: getImageUrl(img.filePath),
            activityName: a.name,
            createdAt: img.createdAt
          });
        });
      }
    });
  }

  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (activePhotoIndex === null || !projectPhotos.length) return;
    setActivePhotoIndex((prev) => (prev - 1 + projectPhotos.length) % projectPhotos.length);
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (activePhotoIndex === null || !projectPhotos.length) return;
    setActivePhotoIndex((prev) => (prev + 1) % projectPhotos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev - 1 + projectPhotos.length) % projectPhotos.length);
      }
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev + 1) % projectPhotos.length);
      }
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, projectPhotos.length]);

  const handleOpenLayer3 = () => {
    onClose();
    navigate(`/executive-projects/${project.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-2xs ${rag.badgeColor}`}>
                {rag.status === 'RED' ? '🔴 RED FLAG - วิกฤต' : rag.status === 'YELLOW' ? '🟡 WARN - เฝ้าระวัง' : '🟢 GREEN - ปกติ'}
              </span>
              <span className="text-xs font-bold text-slate-400">รหัสโครงการ #{project.id}</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 leading-snug">{project.name}</h2>
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
              <span>{project.faculty?.name || 'ส่วนกลาง'}</span>
              <span>•</span>
              <span>{project.department?.name || 'ไม่ระบุภาควิชา'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Root Cause Alert Box (If Red/Yellow) */}
        {rag.reason && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 shadow-2xs ${rag.status === 'RED' ? 'bg-rose-50/90 text-rose-800 border-rose-200' : 'bg-amber-50/90 text-amber-800 border-amber-200'}`}>
            <FiAlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${rag.status === 'RED' ? 'text-rose-600' : 'text-amber-600'}`} />
            <div>
              <div className="font-black text-slate-900 text-xs mb-0.5">สาเหตุและจุดวิกฤตที่ต้องได้รับการแก้ไข:</div>
              <div>{rag.reason}</div>
            </div>
          </div>
        )}

        {/* 4-Tier Strategic Alignment Pipeline */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎯 ความเชื่อมโยงตามประเด็นยุทธศาสตร์ (Strategic Alignment)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* Tier 1: Local Issue */}
            <div className="p-2.5 rounded-xl bg-white border border-violet-100 shadow-3xs space-y-1">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700">1. ประเด็นการพัฒนา</span>
              <div className="font-bold text-slate-800 text-[11px] line-clamp-2">
                {project.subStrategy?.strategy?.localIssue?.code ? `${project.subStrategy.strategy.localIssue.code}: ` : ''}
                {project.subStrategy?.strategy?.localIssue?.name || 'ไม่ระบุ'}
              </div>
            </div>

            {/* Tier 2: Strategy */}
            <div className="p-2.5 rounded-xl bg-white border border-purple-100 shadow-3xs space-y-1">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700">2. แผนงานหลัก</span>
              <div className="font-bold text-slate-800 text-[11px] line-clamp-2">
                {project.subStrategy?.strategy?.code ? `${project.subStrategy.strategy.code}: ` : ''}
                {project.subStrategy?.strategy?.name || 'ไม่ระบุ'}
              </div>
            </div>

            {/* Tier 3: Sub-Strategy */}
            <div className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-3xs space-y-1">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">3. แผนงานย่อย</span>
              <div className="font-bold text-slate-800 text-[11px] line-clamp-2">
                {project.subStrategy?.code ? `${project.subStrategy.code}: ` : ''}
                {project.subStrategy?.name || 'ไม่ระบุ'}
              </div>
            </div>

            {/* Tier 4: Indicator / Main Project */}
            <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-3xs space-y-1">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">4. โครงการหลัก</span>
              <div className="font-bold text-slate-800 text-[11px] line-clamp-2">
                {project.indicator?.code ? `${project.indicator.code}: ` : ''}
                {project.indicator?.name || 'ไม่ระบุ'}
              </div>
            </div>
          </div>
        </div>

        {/* 30-Second Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">งบประมาณอนุมัติ</div>
            <div className="font-black text-slate-800 text-sm mt-0.5">{budgetNum.toLocaleString()} ฿</div>
          </div>

          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ยอดเบิกจ่ายจริง</div>
            <div className="font-black text-emerald-600 text-sm mt-0.5">{spentNum.toLocaleString()} ฿ ({burnRatePct}%)</div>
          </div>

          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ผลสัมฤทธิ์ KPI</div>
            <div className="font-black text-primary text-sm mt-0.5">{project.completedCount || 0} / {project.targetCount || 0} ({progressPct}%)</div>
          </div>
        </div>

        {/* Responsible Lead Info */}
        <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-800">{project.creator?.name || 'ไม่ระบุผู้รับผิดชอบ'}</div>
              <div className="text-[10px] text-slate-400">หัวหน้าผู้รับผิดชอบโครงการ</div>
            </div>
          </div>

          <div className="text-right text-[11px] font-bold text-slate-500">
            ปีงบประมาณ พ.ศ. {project.fiscalYear?.year}
          </div>
        </div>

        {/* Project Activity Photos */}
        {projectPhotos.length > 0 && (
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ภาพถ่ายกิจกรรมความสำเร็จในโครงการ ({projectPhotos.length} ภาพ)</h4>
            <div className="flex overflow-x-auto gap-3 pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {projectPhotos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  onClick={() => setActivePhotoIndex(index)}
                  className="relative w-24 h-18 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-3xs group cursor-pointer"
                >
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.activityName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                    <span className="text-[8px] font-black text-white text-center line-clamp-2 leading-tight">{photo.activityName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Directives Section (ข้อสั่งการอธิการบดี / ผู้บริหาร) */}
        <div className="space-y-3 bg-violet-50/60 p-4 rounded-2xl border border-violet-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-violet-900 flex items-center gap-1.5">
              <FiSend className="w-3.5 h-3.5 text-primary" />
              <span>ข้อสั่งการเชิงยุทธศาสตร์ของผู้บริหาร (Executive Directives)</span>
            </h4>
            {project.directiveUpdatedAt && (
              <span className="text-[10px] text-violet-600 font-bold">
                อัปเดตล่าสุด: {new Date(project.directiveUpdatedAt).toLocaleDateString('th-TH')}
              </span>
            )}
          </div>

          {/* Current Active Directive Banner */}
          {(project.presidentDirective || project.deanDirective || project.executiveDirective) ? (
            <div className="p-3 bg-white rounded-xl border border-violet-200 text-xs text-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-primary">
                <span>🏛️ ข้อสั่งการโดย: {project.presidentDirectiveIssuerName || project.deanDirectiveIssuerName || project.directiveIssuerName || 'ผู้บริหาร'}</span>
              </div>
              <div className="font-medium text-slate-700 leading-relaxed">
                "{project.presidentDirective || project.deanDirective || project.executiveDirective}"
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium italic">
              ยังไม่มีข้อสั่งการบันทึกสำหรับโครงการนี้
            </div>
          )}

          {/* Form for Executive to issue directive */}
          {['PRESIDENT', 'DEAN', 'ADMIN'].includes(user?.role) && (
            <div className="space-y-2 pt-2 border-t border-violet-200/60">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="font-bold text-violet-900">แม่แบบข้อสั่งการด่วน:</span>
                <button
                  type="button"
                  onClick={() => setDirectiveText('ขอให้เร่งรัดการเบิกจ่ายงบประมาณที่ค้างท่อให้เป็นไปตามเป้าหมายของไตรมาส')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-violet-100 text-violet-800 border border-violet-200 transition-all font-semibold cursor-pointer"
                >
                  ⚡ เร่งรัดการเบิกจ่าย
                </button>
                <button
                  type="button"
                  onClick={() => setDirectiveText('ขอให้ปรับแผนการดำเนินกิจกรรมและรายงานความก้าวหน้าต่อสถาบันภายใน 7 วัน')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-violet-100 text-violet-800 border border-violet-200 transition-all font-semibold cursor-pointer"
                >
                  📋 ปรับแผน & รายงานใน 7 วัน
                </button>
                <button
                  type="button"
                  onClick={() => setDirectiveText('ขอให้ประสานงานกับคณบดีเพื่อแก้ไขปัญหาคอขวดและอุปสรรคหน้างานโดยด่วน')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-violet-100 text-violet-800 border border-violet-200 transition-all font-semibold cursor-pointer"
                >
                  🤝 ประสานคณบดีแก้ปัญหา
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={directiveText}
                  onChange={(e) => setDirectiveText(e.target.value)}
                  placeholder="พิมพ์ข้อสั่งการอธิการบดีถึงผู้รับผิดชอบโครงการ..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-violet-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 font-medium"
                />
                <button
                  type="button"
                  onClick={handleSaveDirective}
                  disabled={savingDirective || !directiveText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <FiSend className="w-3 h-3" />
                  <span>{savingDirective ? 'กำลังบันทึก...' : 'ส่งข้อสั่งการ'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Drill-down to Layer 3 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>

          <button
            type="button"
            onClick={handleOpenLayer3}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FiExternalLink className="w-4 h-4" />
            <span>ดูรายงานยุทธศาสตร์ฉบับเต็ม</span>
          </button>
        </div>
      </div>

      {/* Nested Fullscreen Lightbox Modal */}
      {activePhotoIndex !== null && projectPhotos[activePhotoIndex] && createPortal(
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setActivePhotoIndex(null)}
        >
          {/* Close button */}
          <button 
            onClick={() => setActivePhotoIndex(null)} 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer active:scale-95 transition-all z-[70]"
            title="ปิดหน้าต่าง"
          >
            <FiX className="w-6 h-6" />
          </button>

          {/* Left Arrow Button */}
          <button 
            onClick={handlePrevPhoto}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 rounded-full text-white cursor-pointer transition-all z-[70] shadow-lg backdrop-blur-xs"
            title="ภาพก่อนหน้า (ลูกศรซ้าย)"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button 
            onClick={handleNextPhoto}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 rounded-full text-white cursor-pointer transition-all z-[70] shadow-lg backdrop-blur-xs"
            title="ภาพถัดไป (ลูกศรขวา)"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>

          <div 
            className="max-w-[92vw] w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row relative z-[65] md:h-[82vh] h-auto"
          >
            <div className="md:w-3/5 bg-black flex flex-col items-center justify-center p-6 md:h-full justify-between">
              <div className="flex-1 flex items-center justify-center w-full">
                <img src={projectPhotos[activePhotoIndex].imageUrl} alt={projectPhotos[activePhotoIndex].activityName} className="max-w-full max-h-[62vh] object-contain rounded-lg animate-fadeIn" />
              </div>
              
              {/* Thumbnails list at the bottom of image container */}
              {projectPhotos.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 max-w-full overflow-x-auto py-1 px-2 select-none z-50">
                  {projectPhotos.map((img, idx) => {
                    const isActive = idx === activePhotoIndex;
                    return (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex(idx);
                        }}
                        className={`relative w-12 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer active:scale-95 ${
                          isActive ? 'border-primary scale-105 shadow-md shadow-primary/40' : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                        }`}
                      >
                        <img src={img.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="md:w-2/5 p-8 flex flex-col justify-between text-white space-y-6 md:h-full md:overflow-y-auto">
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-black bg-primary/30 text-primary-200 px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wider">{project.department?.name || 'ส่วนกลาง'}</span>
                </div>
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">โครงการหลัก</h4>
                  <p className="text-xs font-semibold text-slate-200 leading-relaxed">{project.name}</p>
                </div>
                {projectPhotos[activePhotoIndex].createdAt && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">วันเวลาดำเนินการ</h4>
                    <p className="text-xs font-semibold text-slate-350">{new Date(projectPhotos[activePhotoIndex].createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' })} น.</p>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-800 pt-5 flex items-center justify-between text-slate-450 text-[10px] font-black tracking-wide">
                <span>{project.faculty?.name || 'ส่วนกลาง'}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};

export default ExecutiveProjectModal;
