import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import CustomSelect from '../../components/CustomSelect';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiArrowRight,
  FiBriefcase,
  FiActivity,
  FiCheckCircle,
  FiDollarSign,
  FiAlertTriangle,
  FiFolder,
  FiTrendingUp,
  FiLayers,
  FiPieChart,
  FiClock,
  FiTarget,
  FiFilter,
  FiEye,
  FiDownload
} from 'react-icons/fi';

const TeacherProjects = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Projects list state
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stats summary state
  const [stats, setStats] = useState(null);

  // Dropdown lists
  const [fiscalYears, setFiscalYears] = useState([]);

  // Load initial dropdowns and personal stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const years = await api.get('/master/fiscal-years');
        setFiscalYears(years.data);

        // Pre-select active fiscal year if any
        const activeYear = years.data.find(y => y.active);
        if (activeYear) setFiscalYearId(activeYear.id);
      } catch (err) {
        console.error('Failed to load filter option dropdowns:', err);
      }
    };
    fetchFilters();
    fetchStats();
  }, []);

  // Fetch projects list matching filters
  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        fiscalYearId: fiscalYearId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await api.get('/projects', { params });
      setProjects(response.data.projects || []);
      setPagination(response.data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถดึงรายการโครงการได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, [search, fiscalYearId, statusFilter]);

  // Handle Delete Project / Send Deletion Request
  const handleDelete = async (e, projectItem) => {
    e.preventDefault();
    e.stopPropagation();

    // If project is unlocked, user can delete directly
    if (!projectItem.isLocked) {
      const confirmDelete = await Swal.fire({
        title: 'โครงการนี้ถูกปลดล็อกแล้ว ต้องการลบใช่หรือไม่?',
        text: `โครงการ "${projectItem.name}" ได้รับการปลดล็อกแผนงานจาก Admin แล้ว คุณต้องการลบโครงการนี้ออกจากระบบใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ยืนยันลบโครงการ',
        cancelButtonText: 'ยกเลิก'
      });

      if (confirmDelete.isConfirmed) {
        try {
          await api.delete(`/projects/${projectItem.id}`);
          Swal.fire({ icon: 'success', title: 'ลบโครงการสำเร็จ', showConfirmButton: false, timer: 1200 });
          fetchProjects(pagination.page);
          fetchStats();
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบโครงการ' });
        }
      }
      return;
    }

    // If project is locked, prompt to send deletion request to Admin
    const result = await Swal.fire({
      title: 'ยื่นคำร้องขอลบโครงการ',
      text: `เพื่อความปลอดภัยของข้อมูลโครงการ "${projectItem.name}" การลบโครงการจำเป็นต้องยื่นคำร้องให้ผู้ดูแลระบบ (Admin) พิจารณาปลดล็อกก่อนลบ`,
      icon: 'info',
      input: 'textarea',
      inputPlaceholder: 'กรอกเหตุผลความจำเป็นในการขอลบโครงการ...',
      inputValidator: (value) => {
        if (!value) {
          return 'กรุณากรอกเหตุผลความจำเป็น!';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'ส่งคำร้องขอลบโครงการ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await api.post('/issues', {
          title: `[คำร้องขอปลดล็อกและลบโครงการ] ${projectItem.name}`,
          description: `ผู้ใช้งานขออนุมัติปลดล็อกและลบโครงการ ID: ${projectItem.id} (${projectItem.name})\nเหตุผล: ${result.value}`,
          category: 'คำร้องขอลบโครงการ',
          priority: 'HIGH'
        });

        Swal.fire({
          icon: 'success',
          title: 'ส่งคำร้องขอลบเรียบร้อยแล้ว',
          text: 'คำร้องของคุณถูกส่งไปยัง Admin เมื่อ Admin ทำการปลดล็อกโครงการแล้ว คุณจะสามารถกดลบโครงการได้ทันที',
          confirmButtonColor: '#6C3BFF'
        });
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: err.response?.data?.message || 'ไม่สามารถส่งคำร้องขอลบโครงการได้'
        });
      }
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/reports/export/pdf?type=project', {
        params: {
          fiscalYearId: fiscalYearId || undefined,
          statusFilter: statusFilter || undefined
        },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Teacher_Projects_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถสร้างรายงาน PDF ได้' });
    }
  };

  const isNearDeadline = (project) => {
    if (project.progress >= 100) return false;
    const endDate = new Date(project.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // 30 days or less
  };

  const getDeadlineText = (project) => {
    const endDate = new Date(project.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return `เกินกำหนดส่งผลงาน ${Math.abs(diffDays)} วัน`;
    }
    return `ใกล้ครบกำหนดในอีก ${diffDays} วัน`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-200">
              <FiBriefcase className="w-3.5 h-3.5 text-indigo-300" />
              <span>ระบบติดตามโครงการ</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              โครงการตามแผนยุทธศาสตร์
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              ติดตามความก้าวหน้า อัปเดตกิจกรรม และจัดการงบประมาณโครงการ
            </p>
          </div>

          <Link
            to="/projects/new"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>สร้างโครงการใหม่</span>
          </Link>
        </div>

        {/* Personal Summary Cards inside Hero */}
        {stats?.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
            {/* Card 1: Projects */}
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[10px] font-bold uppercase tracking-wider">โครงการทั้งหมด</span>
                <FiBriefcase className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="text-lg font-black text-white mt-1">{stats.summary.totalProjects || 0} โครงการ</div>
            </div>

            {/* Card 2: Activities */}
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[10px] font-bold uppercase tracking-wider">กิจกรรมย่อย</span>
                <FiActivity className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg font-black text-white mt-1">
                {stats.summary.completedActivities || 0} / {stats.summary.totalActivities || 0} รายการ
              </div>
            </div>

            {/* Card 3: Target Progress */}
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[10px] font-bold uppercase tracking-wider">ความก้าวหน้าเป้าหมาย</span>
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-black text-emerald-300 mt-1">{stats.summary.targetProgressPercentage || 0}%</div>
            </div>

            {/* Card 4: Budget Spend */}
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl min-w-0">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[10px] font-bold uppercase tracking-wider">งบเบิกจ่ายจริง</span>
                <FiDollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base md:text-lg font-black text-amber-300 mt-1 whitespace-nowrap truncate" title={`${(stats.summary.totalActualBudget || 0).toLocaleString()} / ${(stats.summary.totalBudget || 0).toLocaleString()} บาท`}>
                {(stats.summary.totalActualBudget || 0).toLocaleString()} ฿
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Options */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 space-y-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>ทั้งหมด ({stats?.summary?.totalProjects || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('inprogress')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                statusFilter === 'inprogress'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <FiClock className="w-3.5 h-3.5" />
              <span>กำลังดำเนินการ</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>เสร็จสมบูรณ์ (100%)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={projects.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="พิมพ์รายงานสรุปโครงการเป็นเอกสาร PDF"
          >
            <FiDownload className="w-4 h-4 text-rose-600" />
            <span>พิมพ์รายงาน PDF</span>
          </button>
        </div>

        {/* Search & Fiscal Year Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="พิมพ์ชื่อโครงการ หรือรายละเอียด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ล้างคำค้น
              </button>
            )}
          </div>

          {/* Fiscal Year Filter */}
          <div>
            <CustomSelect
              value={fiscalYearId}
              onChange={(val) => setFiscalYearId(val)}
              icon={<FiCalendar className="w-4 h-4 text-primary" />}
              placeholder="ปีงบประมาณ (ทั้งหมด)"
              options={[
                { value: '', label: 'ปีงบประมาณ (ทั้งหมด)' },
                ...fiscalYears.map(fy => ({
                  value: fy.id,
                  label: `ปีงบประมาณ พ.ศ. ${fy.year}${fy.active ? ' (ปีงบปัจจุบัน)' : ''}`
                }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Projects Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-soft">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-xs font-bold text-slate-500">กำลังโหลดรายการโครงการ...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="flex flex-col space-y-4">
          {projects.map(project => {
            const hasAuthEdit = project.creatorId === user?.id || project.users?.some(u => u.userId === user?.id);

            return (
              <div
                key={project.id}
                className="group bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden hover:shadow-lg transition-all flex flex-col lg:flex-row items-stretch"
              >
                {/* Main Left Card Body */}
                <div className="p-6 md:p-7 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 shadow-2xs">
                        <FiCalendar className="w-3.5 h-3.5 text-primary" />
                        <span>ปีงบประมาณ {project.fiscalYear?.year}</span>
                      </span>

                      {project.progress >= 100 ? (
                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>เสร็จสมบูรณ์</span>
                        </span>
                      ) : (
                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <FiClock className="w-3.5 h-3.5 text-amber-600" />
                          <span>กำลังดำเนินการ</span>
                        </span>
                      )}

                      <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/60">
                        สังกัด: {project.department?.name || 'ส่วนกลาง'}
                      </span>
                    </div>

                    {isNearDeadline(project) ? (
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-rose-50 text-rose-600 flex items-center gap-1 border border-rose-200 animate-pulse">
                        <FiAlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>{getDeadlineText(project)}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {new Date(project.startDate).toLocaleDateString('th-TH')} - {new Date(project.endDate).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 group-hover:text-primary transition-colors tracking-tight leading-snug">
                      {project.name}
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed font-normal">
                      {project.description || 'ไม่มีคำอธิบายเพิ่มเติมเกี่ยวกับโครงการนี้'}
                    </p>
                  </div>

                  {/* Strategic paths container */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50/90 p-3 rounded-2xl border border-slate-100 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-extrabold text-violet-600 uppercase tracking-wider">1. ประเด็นการพัฒนา</span>
                      <span 
                        className="font-bold text-slate-800 line-clamp-2 hover:line-clamp-none transition-all break-words cursor-help" 
                        title={project.subStrategy?.strategy?.localIssue ? `${project.subStrategy.strategy.localIssue.code}: ${project.subStrategy.strategy.localIssue.name}` : ''}
                      >
                        {project.subStrategy?.strategy?.localIssue ? `${project.subStrategy.strategy.localIssue.code}: ${project.subStrategy.strategy.localIssue.name}` : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-extrabold text-purple-600 uppercase tracking-wider">2. แผนงานหลัก</span>
                      <span 
                        className="font-bold text-slate-800 line-clamp-2 hover:line-clamp-none transition-all break-words cursor-help" 
                        title={project.subStrategy?.strategy ? `${project.subStrategy.strategy.code}: ${project.subStrategy.strategy.name}` : ''}
                      >
                        {project.subStrategy?.strategy ? `${project.subStrategy.strategy.code}: ${project.subStrategy.strategy.name}` : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-extrabold text-blue-600 uppercase tracking-wider">3. แผนงานย่อย</span>
                      <span 
                        className="font-bold text-slate-800 line-clamp-2 hover:line-clamp-none transition-all break-words cursor-help" 
                        title={project.subStrategy ? `${project.subStrategy.code}: ${project.subStrategy.name}` : ''}
                      >
                        {project.subStrategy ? `${project.subStrategy.code}: ${project.subStrategy.name}` : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-extrabold text-emerald-600 uppercase tracking-wider">4. โครงการหลัก</span>
                      <span 
                        className="font-bold text-slate-800 line-clamp-2 hover:line-clamp-none transition-all break-words cursor-help" 
                        title={project.indicator ? `${project.indicator.code}: ${project.indicator.name}` : ''}
                      >
                        {project.indicator ? `${project.indicator.code}: ${project.indicator.name}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Stats & Action Bar */}
                <div className="lg:w-[350px] shrink-0 bg-slate-50/60 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 md:p-7 flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider shrink-0">งบประมาณตั้งต้น</span>
                      <span className="font-black text-slate-900 text-sm whitespace-nowrap">{parseFloat(project.totalBudget).toLocaleString()} ฿</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">เป้าหมายสะสม</span>
                      <div className="font-black text-sm flex items-center gap-1">
                        <span className={project.completedCount >= project.targetCount ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                          {project.completedCount}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-700">{project.targetCount}</span>
                        <span className="text-slate-500 font-normal ml-0.5">{project.unit}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-bold">ความก้าวหน้าโครงการ</span>
                        <span className="font-black text-primary text-sm">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary via-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(project.progress, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60">
                    {hasAuthEdit && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/projects/${project.id}/edit`);
                          }}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                          title="แก้ไขรายละเอียดโครงการ"
                        >
                          <FiEdit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, project)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                          title="ยื่นคำร้องขอลบโครงการ"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </>
                    )}
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-black text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-md shadow-primary/20 active:scale-95"
                    >
                      <FiEye className="w-4 h-4" />
                      <span>รายละเอียด</span>
                      <FiArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Overall Empty State */
        <div className="text-center py-24 bg-white rounded-3xl shadow-soft border border-slate-100 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
            <FiFolder className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">ไม่พบโครงการที่สอดคล้องตามเงื่อนไข</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองปีงบประมาณและสถานะเป็น "ทั้งหมด" เพื่อดูรายการโครงการทั้งหมด
          </p>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter('all'); setFiscalYearId(''); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => fetchProjects(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs text-slate-500 font-bold px-3">หน้า {pagination.page} จาก {pagination.totalPages}</span>
          <button
            type="button"
            onClick={() => fetchProjects(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherProjects;
