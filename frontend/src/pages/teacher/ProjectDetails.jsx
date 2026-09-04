import React, { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { 
  FiArrowLeft, 
  FiPlus, 
  FiLock, 
  FiUnlock, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiCalendar, 
  FiInfo, 
  FiUsers, 
  FiDollarSign, 
  FiClock, 
  FiFileText,
  FiImage,
  FiTrash2,
  FiUploadCloud,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
  FiBriefcase,
  FiFolder,
  FiActivity,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { getImageUrl, compressImage } from '../../utils/imageUrl';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('activities'); // activities, summary, gallery
  
  // Persistent collapsed activities state per project
  const [collapsedActivities, setCollapsedActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(`collapsed_activities_proj_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleCollapseActivity = (actId) => {
    setCollapsedActivities(prev => {
      const nextState = {
        ...prev,
        [actId]: !prev[actId]
      };
      try {
        localStorage.setItem(`collapsed_activities_proj_${id}`, JSON.stringify(nextState));
      } catch (e) {}
      return nextState;
    });
  };

  const handleCollapseAll = () => {
    if (!project?.activities) return;
    const allCollapsed = {};
    project.activities.forEach(a => { allCollapsed[a.id] = true; });
    setCollapsedActivities(allCollapsed);
    try {
      localStorage.setItem(`collapsed_activities_proj_${id}`, JSON.stringify(allCollapsed));
    } catch (e) {}
  };

  const handleExpandAll = () => {
    setCollapsedActivities({});
    try {
      localStorage.removeItem(`collapsed_activities_proj_${id}`);
    } catch (e) {}
  };

  // Activity Plan form states
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [actName, setActName] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actDate, setActDate] = useState('');
  const [actBudget, setActBudget] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  // Progress Tracking form states
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [targetActivity, setTargetActivity] = useState(null);
  const [actActualBudget, setActActualBudget] = useState('');
  const [actSuccess, setActSuccess] = useState(false);
  const [actCompletedCount, setActCompletedCount] = useState('');
  const [actRemark, setActRemark] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [savingProgress, setSavingProgress] = useState(false);

  // Photo Viewer states
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);

  const openPhotoViewer = (imagesList, index) => {
    setViewerImages(imagesList);
    setActiveViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  const handlePrevPhoto = () => {
    if (viewerImages.length === 0) return;
    setActiveViewerIndex(prev => (prev - 1 + viewerImages.length) % viewerImages.length);
  };

  const handleNextPhoto = () => {
    if (viewerImages.length === 0) return;
    setActiveViewerIndex(prev => (prev + 1) % viewerImages.length);
  };

  useEffect(() => {
    if (!photoViewerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      else if (e.key === 'ArrowRight') handleNextPhoto();
      else if (e.key === 'Escape') setPhotoViewerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoViewerOpen, viewerImages]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      const fetched = response.data;
      if (fetched && fetched.activities) {
        fetched.activities.sort((a, b) => {
          const tA = new Date(a.activityDate || a.createdAt).getTime();
          const tB = new Date(b.activityDate || b.createdAt).getTime();
          if (tA !== tB) return tA - tB;
          return (a.id || 0) - (b.id || 0);
        });
      }
      setProject(fetched);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลโครงการได้' });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Automatically activate Activities tab and open Activity form if redirected from project creation
  useEffect(() => {
    if (location.state?.autoOpenAddActivity) {
      setActiveSubTab('activities');
      setActivityFormOpen(true);
      setTimeout(() => {
        const el = document.getElementById('activity-form-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    }
  }, [location.state]);

  // Handle Create Activity Plan
  const handleAddActivity = async (e) => {
    e.preventDefault();
    setAddingActivity(true);
    try {
      const rawBudget = typeof actBudget === 'string' ? actBudget.replace(/,/g, '') : actBudget;
      const payload = {
        projectId: parseInt(id),
        name: actName,
        description: actDesc,
        activityDate: new Date(actDate).toISOString(),
        budget: parseFloat(rawBudget)
      };

      await api.post('/activities', payload);
      Swal.fire({ icon: 'success', title: 'เพิ่มแผนงานกิจกรรมสำเร็จ', showConfirmButton: false, timer: 1500 });
      
      setActName('');
      setActDesc('');
      setActDate('');
      setActBudget('');
      setActivityFormOpen(false);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถสร้างกิจกรรมได้' });
    } finally {
      setAddingActivity(false);
    }
  };

  // Helper for comma formatting in budget inputs
  const formatCommaValue = (val) => {
    if (!val) return '';
    const raw = String(val).replace(/[^0-9.]/g, '');
    if (!raw) return '';
    const parts = raw.split('.');
    parts[0] = Number(parts[0]).toLocaleString('en-US');
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  // Open modal for recording actual progress
  const openProgressModal = (act) => {
    setTargetActivity(act);
    const initialVal = act.actualBudget ? act.actualBudget : act.budget;
    setActActualBudget(initialVal ? parseFloat(initialVal).toLocaleString('en-US') : '');
    setActSuccess(act.success || false);
    setActCompletedCount(act.completedCount ? act.completedCount.toString() : '');
    setActRemark(act.remark || '');
    setSelectedFiles([]);
    setPreviews([]);
    setProgressModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Save Activity Actual Progress
  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!targetActivity) return;
    setSavingProgress(true);

    try {
      const rawActualBudget = typeof actActualBudget === 'string' ? actActualBudget.replace(/,/g, '') : actActualBudget;
      const formData = new FormData();
      formData.append('actualBudget', rawActualBudget);
      formData.append('success', actSuccess.toString());
      if (actCompletedCount) formData.append('completedCount', actCompletedCount);
      if (actRemark) formData.append('remark', actRemark);

      const compressedFiles = await Promise.all(
        selectedFiles.map(file => compressImage(file))
      );

      compressedFiles.forEach(file => {
        formData.append('images', file);
      });

      await api.put(`/activities/${targetActivity.id}/progress`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire({ icon: 'success', title: 'บันทึกความก้าวหน้ากิจกรรมสำเร็จ', showConfirmButton: false, timer: 1500 });
      setProgressModalOpen(false);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถบันทึกความก้าวหน้าได้' });
    } finally {
      setSavingProgress(false);
    }
  };

  // Delete uploaded photo from activity
  const handleDeleteImage = async (imageId) => {
    Swal.fire({
      title: 'ลบรูปภาพนี้?',
      text: 'รูปภาพที่ถูกลบจะไม่สามารถกู้คืนกลับมาได้!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ลบรูปภาพ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/activities/images/${imageId}`);
          Swal.fire({ icon: 'success', title: 'ลบรูปภาพเรียบร้อย', showConfirmButton: false, timer: 1200 });
          fetchProjectDetails();
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบรูปภาพได้' });
        }
      }
    });
  };

  // Delete Activity Plan
  const handleDeleteActivity = async (activityId) => {
    Swal.fire({
      title: 'ลบกิจกรรมนี้?',
      text: 'ข้อมูลและรูปภาพในกิจกรรมย่อยนี้จะถูกลบทั้งหมด!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ลบกิจกรรม',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/activities/${activityId}`);
          Swal.fire({ icon: 'success', title: 'ลบกิจกรรมสำเร็จ', showConfirmButton: false, timer: 1200 });
          fetchProjectDetails();
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถลบกิจกรรมได้' });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-soft">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
        <p className="text-xs font-bold text-slate-500">กำลังโหลดรายละเอียดโครงการ...</p>
      </div>
    );
  }

  // Calculate project aggregates
  const totalPlannedBudget = project.activities.reduce((sum, a) => sum + parseFloat(a.budget), 0);
  const totalActualBudget = project.activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
  const totalImages = project.activities.reduce((sum, a) => sum + a.images.length, 0);

  const isCoordinatingTeacher = user?.role === 'ADMIN' || (user?.role === 'TEACHER' && 
    (project.creatorId === user?.id || project.users.some(u => u.userId === user?.id)));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back button & Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            to="/projects"
            className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs cursor-pointer"
            title="ย้อนกลับไปรายการโครงการ"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                ปีงบประมาณ พ.ศ. {project.fiscalYear?.year}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                หน่วยงาน: {project.department?.name || 'ส่วนกลาง'}
              </span>
              {project.progress >= 100 ? (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>เสร็จสมบูรณ์ 100%</span>
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <FiClock className="w-3 h-3 text-amber-600" />
                  <span>กำลังดำเนินการ</span>
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">{project.name}</h1>
          </div>
        </div>
      </div>

      {/* Welcoming banner if redirected from new project creation */}
      {location.state?.isNewProject && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-emerald-900 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-sm shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950">บันทึกข้อมูลโครงการสำเร็จเรียบร้อย! 🎉</h4>
              <p className="text-xs text-emerald-700/90 font-medium mt-0.5">ระบบนำท่านมายังหน้าจัดการกิจกรรมของโครงการนี้แล้ว สามารถเริ่มวางแผนและบันทึกกิจกรรมย่อยได้ทันที</p>
            </div>
          </div>
          {isCoordinatingTeacher && (
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('activities');
                setActivityFormOpen(true);
                const el = document.getElementById('activity-form-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm cursor-pointer transition-all shrink-0"
            >
              <FiPlus className="w-4 h-4" />
              <span>เริ่มวางแผนกิจกรรม</span>
            </button>
          )}
        </div>
      )}

      {/* Executive Directive Banners (Separated for DEAN and PRESIDENT) */}
      {(project.deanDirective || project.presidentDirective || project.executiveDirective) && (
        <div className="space-y-4">
          {/* 1. Dean Directive Banner */}
          {project.deanDirective && (
            <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-2 border border-purple-400/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider">
                  <FiAlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span>ข้อสั่งการจากคณบดี (Dean Directive)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40 text-[10px] uppercase font-bold">
                    ฝ่ายบริหารระดับคณะ
                  </span>
                </div>
                {project.deanDirectiveUpdatedAt && (
                  <span className="text-[10px] text-purple-200/70 font-semibold">
                    สั่งการเมื่อ: {new Date(project.deanDirectiveUpdatedAt).toLocaleString('th-TH')}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-white pl-6 leading-relaxed">
                "{project.deanDirective}"
              </div>
              {project.deanDirectiveIssuerName && (
                <div className="text-[11px] font-bold text-amber-200/90 pl-6 pt-1">
                  ผู้สั่งการ: {project.deanDirectiveIssuerName} (คณบดี)
                </div>
              )}
            </div>
          )}

          {/* 2. President Directive Banner */}
          {project.presidentDirective && (
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-2 border border-blue-400/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-sky-300 uppercase tracking-wider">
                  <FiAlertTriangle className="w-4.5 h-4.5 text-sky-400 shrink-0" />
                  <span>ข้อสั่งการจากอธิการบดี (President Directive)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-200 border border-blue-400/40 text-[10px] uppercase font-bold">
                    ฝ่ายบริหารระดับสถาบัน
                  </span>
                </div>
                {project.presidentDirectiveUpdatedAt && (
                  <span className="text-[10px] text-blue-200/70 font-semibold">
                    สั่งการเมื่อ: {new Date(project.presidentDirectiveUpdatedAt).toLocaleString('th-TH')}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-white pl-6 leading-relaxed">
                "{project.presidentDirective}"
              </div>
              {project.presidentDirectiveIssuerName && (
                <div className="text-[11px] font-bold text-sky-200/90 pl-6 pt-1">
                  ผู้สั่งการ: {project.presidentDirectiveIssuerName} (อธิการบดี)
                </div>
              )}
            </div>
          )}

          {/* 3. Fallback for legacy directive */}
          {!project.deanDirective && !project.presidentDirective && project.executiveDirective && (
            <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-2 border border-purple-400/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider">
                  <FiAlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span>ข้อสั่งการ/แนวนโยบายเร่งรัดจากผู้บริหาร (Executive Directive)</span>
                </div>
                {project.directiveUpdatedAt && (
                  <span className="text-[10px] text-purple-200/70 font-semibold">
                    สั่งการเมื่อ: {new Date(project.directiveUpdatedAt).toLocaleString('th-TH')}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-white pl-6 leading-relaxed">
                "{project.executiveDirective}"
              </div>
              {project.directiveIssuerName && (
                <div className="text-[11px] font-bold text-amber-200/90 pl-6 pt-1">
                  ผู้สั่งการ: {project.directiveIssuerName} ({project.directiveIssuerRole === 'PRESIDENT' ? 'อธิการบดี' : project.directiveIssuerRole === 'DEAN' ? 'คณบดี' : 'ผู้บริหาร'})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress & Financial Summary Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Progress */}
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ความก้าวหน้าเป้าหมาย</div>
            <div className="text-xl font-black text-primary mt-0.5">{project.progress}%</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
              เสร็จแล้ว <span className="text-emerald-600">{project.completedCount}</span> จาก {project.targetCount} {project.unit}
            </div>
          </div>
        </div>

        {/* Card 2: Allocated Budget */}
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">งบประมาณโครงการ</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{parseFloat(project.totalBudget).toLocaleString()} ฿</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">งบตามแผนกิจกรรม: {totalPlannedBudget.toLocaleString()} ฿</div>
          </div>
        </div>

        {/* Card 3: Actual Spent */}
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">เบิกจ่ายจริงแล้ว</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{totalActualBudget.toLocaleString()} ฿</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">คงเหลืองบประมาณ: {Math.max(0, parseFloat(project.totalBudget) - totalActualBudget).toLocaleString()} ฿</div>
          </div>
        </div>

        {/* Card 4: Project Team */}
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
            <FiUsers className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ผู้รับผิดชอบหลัก</div>
            <div className="text-sm font-extrabold text-slate-800 truncate mt-0.5" title={project.creator?.name}>{project.creator?.name || 'อาจารย์ในระบบ'}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">ทีมงานร่วม {project.users.length} ท่าน</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl p-1.5 shadow-soft border border-slate-100 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('activities')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'activities' 
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FiActivity className="w-4 h-4" />
          <span>กิจกรรมและขั้นตอนดำเนินงาน ({project.activities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'summary' 
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FiFileText className="w-4 h-4" />
          <span>รายละเอียดโครงการ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gallery')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'gallery' 
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FiImage className="w-4 h-4" />
          <span>คลังภาพกิจกรรม ({totalImages})</span>
        </button>
      </div>

      {/* TAB 1: Activities & Steps List */}
      {activeSubTab === 'activities' && (
        <div className="space-y-6">
          {/* Add Activity Button & Form Card */}
          {isCoordinatingTeacher && (
            <div id="activity-form-section" className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/40 rounded-3xl shadow-soft border border-indigo-100/80 p-5 sm:p-6 space-y-5 scroll-mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-2xl shadow-md shadow-primary/20 shrink-0">
                    <FiLayers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">แผนงานและขั้นตอนกิจกรรมโครงการ</h3>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {project.activities.length} ขั้นตอน
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      กำหนดขั้นตอนดำเนินงาน วันที่จัด และจัดสรรกรอบงบประมาณกิจกรรม (งบโครงการรวม {parseFloat(project.totalBudget).toLocaleString()} ฿)
                    </p>
                  </div>
                </div>

                {!activityFormOpen ? (
                  <button
                    type="button"
                    onClick={() => setActivityFormOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-xl shadow-md shadow-primary/25 hover:shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <FiPlus className="w-4 h-4 stroke-[3]" />
                    <span>วางแผนกิจกรรมใหม่</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActivityFormOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    <FiChevronUp className="w-4 h-4" />
                    <span>ซ่อนแบบฟอร์ม</span>
                  </button>
                )}
              </div>

              {/* Form Content */}
              {activityFormOpen && (
                <form onSubmit={handleAddActivity} className="bg-white rounded-2xl p-5 sm:p-6 border border-indigo-100 shadow-sm space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <FiActivity className="w-4 h-4 text-primary" />
                      <span>กรอกรายละเอียดแผนงานกิจกรรมใหม่</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      งบประมาณคงเหลือจัดสรรได้: <strong className="text-emerald-600 font-black">{Math.max(0, parseFloat(project.totalBudget) - totalPlannedBudget).toLocaleString()} ฿</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Activity Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                        ชื่อกิจกรรมย่อย <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <FiActivity className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="เช่น จัดประชุมเชิงปฏิบัติการครั้งที่ 1"
                          value={actName}
                          onChange={(e) => setActName(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Activity Date */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                        วันที่จัดกิจกรรม <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <FiCalendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="date"
                          value={actDate}
                          onChange={(e) => setActDate(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Activity Budget */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                        งบประมาณตามแผน <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-black text-primary">฿</span>
                        <input
                          type="text"
                          placeholder="0"
                          value={actBudget}
                          onChange={(e) => setActBudget(formatCommaValue(e.target.value))}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-bold text-slate-800 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activity Description */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      รายละเอียดกิจกรรมและวัตถุประสงค์โดยย่อ <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                    </label>
                    <div className="relative">
                      <FiFileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea
                        placeholder="ระบุวัตถุประสงค์ กลุ่มเป้าหมาย หรือผลผลิตที่คาดว่าจะได้รับจากกิจกรรมนี้..."
                        rows="2"
                        value={actDesc}
                        onChange={(e) => setActDesc(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-medium text-slate-800 transition-all outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <FiLock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>เมื่อบันทึกแล้ว แผนงานจะถูกล็อกและพร้อมสำหรับการบันทึกความก้าวหน้า</span>
                    </p>
                    <div className="flex gap-2.5 justify-end text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setActivityFormOpen(false)}
                        className="px-4 py-2.5 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={addingActivity}
                        className="inline-flex items-center gap-2 px-6 py-2.5 font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {addingActivity ? (
                          <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4" />
                            <span>บันทึกและล็อกแผนกิจกรรม</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Master Collapse / Expand Control Bar */}
          {project.activities.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pb-1">
              <span className="text-xs font-extrabold text-slate-700">
                รายการกิจกรรมทั้งหมด ({project.activities.length} ขั้นตอน)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 transition-all cursor-pointer shadow-xs"
                >
                  ย่อรายละเอียดทุกกิจกรรม
                </button>
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 transition-all cursor-pointer shadow-xs"
                >
                  ขยายรายละเอียดทุกกิจกรรม
                </button>
              </div>
            </div>
          )}

          {/* Activities List Cards */}
          <div className="space-y-4">
            {project.activities.length > 0 ? (
              project.activities.map((act, index) => {
                const budgetNum = parseFloat(act.budget) || 0;
                const actualNum = parseFloat(act.actualBudget) || 0;
                const isOverBudget = actualNum > budgetNum;
                // Expanded by default (isCollapsed = false) unless explicitly collapsed by user
                const isCollapsed = Boolean(collapsedActivities[act.id]);

                return (
                  <div key={act.id} className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                    {/* Left Color Indicator Bar */}
                    <div className={`w-full md:w-2.5 h-2 md:h-auto shrink-0 ${act.success ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                    {/* Main Content Body */}
                    <div className="p-4 md:p-5 flex-1 space-y-3">
                      {/* Header Row (Clickable to Toggle Collapse) */}
                      <div 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                        onClick={() => toggleCollapseActivity(act.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap">
                              กิจกรรมที่ {index + 1}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1">
                              <FiLock className="w-3 h-3 text-rose-500" />
                              <span>(ล็อกแผนแล้ว)</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <FiCalendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(act.activityDate).toLocaleDateString('th-TH')}</span>
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-800">{act.name}</h3>
                        </div>

                        {/* Status Badge & Toggle Button */}
                        <div className="flex items-center gap-2.5 self-start sm:self-center">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                            act.success 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {act.success ? (
                              <>
                                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>เสร็จสมบูรณ์</span>
                              </>
                            ) : (
                              <>
                                <FiClock className="w-3.5 h-3.5 text-amber-600" />
                                <span>กำหนดแผนงานอยู่</span>
                              </>
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollapseActivity(act.id);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold shrink-0 border border-slate-200/60"
                            title={isCollapsed ? "ขยายรายละเอียดกิจกรรม" : "ย่อรายละเอียดกิจกรรม"}
                          >
                            <span className="hidden sm:inline">{isCollapsed ? "ขยาย" : "ย่อ"}</span>
                            {isCollapsed ? <FiChevronDown className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Details Body */}
                      {!isCollapsed && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
                          {/* Description */}
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            {act.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับกิจกรรมนี้'}
                          </p>

                          {/* Dates and Financial Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">วันที่จัดกิจกรรม</div>
                              <div className="font-extrabold text-slate-700 mt-0.5 flex items-center gap-1.5">
                                <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{new Date(act.activityDate).toLocaleDateString('th-TH')}</span>
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">งบตามแผนงาน</div>
                              <div className="font-extrabold text-primary mt-0.5">{budgetNum.toLocaleString()} ฿</div>
                            </div>

                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เบิกจ่ายจริง</div>
                              <div className="font-extrabold mt-0.5 flex items-center gap-1.5">
                                {act.actualBudget ? (
                                  <div className="flex flex-col">
                                    <span className={isOverBudget ? 'text-rose-600 font-black' : 'text-emerald-700 font-extrabold'}>
                                      {actualNum.toLocaleString()} ฿
                                    </span>
                                    {isOverBudget && (
                                      <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded mt-0.5">
                                        (เบิกเกินแผน {(actualNum - budgetNum).toLocaleString()} ฿)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-normal">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Remark text */}
                          {act.remark && (
                            <div className="text-xs text-slate-600 bg-purple-50/60 p-3 rounded-2xl border border-purple-100 font-medium">
                              <span className="font-extrabold text-purple-700">หมายเหตุ / ปัญหาอุปสรรค:</span> {act.remark}
                            </div>
                          )}

                          {/* Photo Thumbnails */}
                          {act.images.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รูปภาพบันทึกความก้าวหน้า ({act.images.length} รูป)</div>
                              <div className="flex flex-wrap gap-2">
                                {act.images.map((img, idx) => (
                                  <div 
                                    key={img.id} 
                                    className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                                    onClick={() => openPhotoViewer(act.images.map(i => ({ filePath: i.filePath, projectName: project.name, activityName: act.name })), idx)}
                                  >
                                    <img src={getImageUrl(img.filePath)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="thumbnail" />
                                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPhotoViewer(act.images.map(i => ({ filePath: i.filePath, projectName: project.name, activityName: act.name })), idx);
                                        }}
                                        className="p-1 hover:bg-white/20 rounded-md"
                                        title="ดูรูปภาพ"
                                      >
                                        <FiEye className="w-3.5 h-3.5 text-white" />
                                      </button>
                                      {isCoordinatingTeacher && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(img.id);
                                          }}
                                          className="p-1 hover:bg-rose-500/30 text-rose-300 rounded-md"
                                          title="ลบรูปภาพ"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2.5 items-center justify-end pt-3 border-t border-slate-100">
                            {isCoordinatingTeacher && (
                              <button
                                type="button"
                                onClick={() => openProgressModal(act)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200/90 rounded-xl transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                              >
                                <FiUploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>บันทึกความก้าวหน้า (รูปภาพ & งบจริง)</span>
                              </button>
                            )}
                            
                            {(user?.role === 'ADMIN' || project.creatorId === user?.id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteActivity(act.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-xl transition-all active:scale-95 cursor-pointer"
                                title="ลบกิจกรรมย่อยนี้ออกจากระบบ"
                              >
                                <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>ลบกิจกรรม</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl shadow-soft border border-slate-100 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <FiActivity className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">ยังไม่มีแผนกิจกรรมในโครงการนี้</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
                    เริ่มต้นวางแผนขั้นตอนการดำเนินงานและกำหนดงบประมาณย่อย เพื่อให้สามารถติดตามความก้าวหน้าและบันทึกหลักฐานผลงานได้
                  </p>
                </div>
                {isCoordinatingTeacher && !activityFormOpen && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActivityFormOpen(true);
                        const el = document.getElementById('activity-form-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-xl shadow-md shadow-primary/25 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <FiPlus className="w-4 h-4 stroke-[3]" />
                      <span>วางแผนกิจกรรมแรกของโครงการ</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Project Summary Details */}
      {activeSubTab === 'summary' && (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-800">รายละเอียดโครงการและข้อมูลยุทธศาสตร์</h3>
            <p className="text-xs text-slate-400">ข้อมูลการลงทะเบียนโครงการและเป้าหมายที่กำหนดไว้ในแผนยุทธศาสตร์</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">คำอธิบายโครงการ</label>
                <p className="text-slate-700 leading-relaxed mt-1 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {project.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ช่วงเวลาดำเนินงาน</label>
                <p className="text-slate-800 font-bold mt-1 flex items-center gap-1.5">
                  <FiCalendar className="w-4 h-4 text-primary" />
                  <span>{new Date(project.startDate).toLocaleDateString('th-TH')} ถึง {new Date(project.endDate).toLocaleDateString('th-TH')}</span>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">เป้าหมายตามแผนงาน</label>
                <p className="text-slate-800 font-bold mt-1 text-sm">
                  {project.targetCount} {project.unit} (ทำสำเร็จแล้ว {project.completedCount} {project.unit})
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {project.subStrategy?.strategy?.localIssue && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. ประเด็นการพัฒนาท้องถิ่น</label>
                  <p className="text-slate-800 font-bold mt-1 leading-relaxed break-words text-sm">
                    {project.subStrategy.strategy.localIssue.code ? `${project.subStrategy.strategy.localIssue.code}: ` : ''}
                    {project.subStrategy.strategy.localIssue.name}
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. แผนงานหลัก</label>
                <p className="text-slate-800 font-bold mt-1 leading-relaxed break-words text-sm">
                  {project.subStrategy?.strategy?.code ? `${project.subStrategy.strategy.code}: ` : ''}
                  {project.subStrategy?.strategy?.name || 'ไม่ระบุ'}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. แผนงานย่อย</label>
                <p className="text-slate-800 font-bold mt-1 leading-relaxed break-words text-sm">
                  {project.subStrategy?.code ? `${project.subStrategy.code}: ` : ''}
                  {project.subStrategy?.name || 'ไม่ระบุ'}
                </p>
              </div>

              {project.indicator && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. โครงการหลัก</label>
                  <p className="text-slate-800 font-bold mt-1 leading-relaxed break-words text-sm">
                    {project.indicator?.code ? `${project.indicator.code}: ` : ''}
                    {project.indicator?.name || 'ไม่ระบุ'}
                  </p>
                </div>
              )}

              {project.budgetSource && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">แหล่งงบประมาณ</label>
                  <p className="text-slate-800 font-bold mt-1 leading-relaxed break-words text-sm">{project.budgetSource?.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Project Photo Gallery */}
      {activeSubTab === 'gallery' && (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-800">คลังภาพกิจกรรมในโครงการนี้</h3>
            <p className="text-xs text-slate-400">รูปภาพบันทึกบรรยากาศและความสำเร็จทั้งหมดจากทุกกิจกรรมย่อย ({totalImages} รูปภาพ)</p>
          </div>

          {totalImages > 0 ? (
            <div className="space-y-6">
              {project.activities.filter(a => a.images && a.images.length > 0).map(act => (
                <div key={act.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span>{act.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">({act.images.length} รูป)</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500">{new Date(act.activityDate).toLocaleDateString('th-TH')}</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {act.images.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => openPhotoViewer(act.images.map(i => ({ filePath: i.filePath, projectName: project.name, activityName: act.name })), idx)}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200/80 border border-slate-200/80 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <img src={getImageUrl(img.filePath)} alt="photo" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <FiEye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs font-semibold">
              ยังไม่มีการอัปโหลดรูปภาพกิจกรรมในโครงการนี้
            </div>
          )}
        </div>
      )}

      {/* Progress Recording Modal */}
      {progressModalOpen && targetActivity && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setProgressModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary via-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between relative overflow-hidden">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                  อัปเดตผลการดำเนินงาน
                </span>
                <h3 className="text-base font-extrabold text-white truncate max-w-md">{targetActivity.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setProgressModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 rounded-2xl backdrop-blur-md transition-all border border-white/20 shadow-sm shrink-0 cursor-pointer"
              >
                <FiX className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProgress} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  งบประมาณที่เบิกจ่ายจริง (บาท) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-black text-emerald-600">฿</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={actActualBudget}
                    onChange={(e) => setActActualBudget(formatCommaValue(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl font-extrabold text-slate-800 text-sm outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Status Selector: กำลังดำเนินการ / เสร็จสิ้น */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  สถานะการดำเนินงานกิจกรรม <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActSuccess(false);
                      setActCompletedCount('0');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !actSuccess
                        ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <FiClock className={`w-4 h-4 ${!actSuccess ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>กำลังดำเนินการ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActSuccess(true);
                      setActCompletedCount('1');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      actSuccess
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm ring-2 ring-emerald-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <FiCheckCircle className={`w-4 h-4 ${actSuccess ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>เสร็จสิ้น</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">หมายเหตุ / ปัญหาอุปสรรค</label>
                <textarea
                  placeholder="บันทึกข้อความสรุปผล หรือปัญหาอุปสรรคที่พบ..."
                  rows="2"
                  value={actRemark}
                  onChange={(e) => setActRemark(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Upload photos section */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">แนบรูปภาพภาพบรรยากาศ / ผลงาน</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/60 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FiUploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">คลิก หรือลากไฟล์รูปภาพมาวางที่นี่</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">รองรับไฟล์ JPG, PNG (สามารถเลือกได้หลายรูป)</p>
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={src} className="w-full h-full object-cover" alt="preview" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProgressModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingProgress}
                  className="px-5 py-2 font-extrabold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {savingProgress ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Photo Viewer */}
      {photoViewerOpen && viewerImages.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 cursor-pointer select-none"
          onClick={() => setPhotoViewerOpen(false)}
        >
          <button
            onClick={() => setPhotoViewerOpen(false)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg border border-white/10 cursor-pointer"
            title="ปิด (Esc)"
          >
            <FiX className="w-6 h-6 stroke-[2.5]" />
          </button>

          {viewerImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 cursor-pointer"
              title="ก่อนหน้า"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            className="w-full h-full max-w-6xl max-h-[90vh] flex flex-col items-center justify-center cursor-default p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Top Header Bar with 5px gap to Image */}
            {(viewerImages[activeViewerIndex]?.projectName || viewerImages[activeViewerIndex]?.activityName) && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-[5px] text-center max-w-4xl z-40">
                {viewerImages[activeViewerIndex]?.projectName && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider shrink-0">โครงการ:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{viewerImages[activeViewerIndex].projectName}</span>
                  </div>
                )}

                {viewerImages[activeViewerIndex]?.activityName && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span className="text-indigo-300 text-[10px] uppercase font-black tracking-wider shrink-0">กิจกรรม:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{viewerImages[activeViewerIndex].activityName}</span>
                  </div>
                )}
              </div>
            )}

            <img
              src={getImageUrl(viewerImages[activeViewerIndex]?.filePath || viewerImages[activeViewerIndex]?.url)}
              alt="Activity Photo"
              className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl transition-all duration-200"
            />
            <div className="mt-[5px] text-xs text-white/90 font-medium text-center bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 shadow-lg">
              ภาพที่ {activeViewerIndex + 1} จาก {viewerImages.length}
            </div>
          </div>

          {viewerImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 cursor-pointer"
              title="ถัดไป"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectDetails;
