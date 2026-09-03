import React, { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import ExecutiveProjectModal from '../../components/ExecutiveProjectModal';
import Swal from 'sweetalert2';
import CustomSelect from '../../components/CustomSelect';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  FiGrid,
  FiCheckCircle,
  FiTrendingUp,
  FiAlertTriangle,
  FiEye,
  FiChevronRight,
  FiChevronLeft,
  FiX,
  FiFilter,
  FiPrinter,
  FiUser,
  FiBriefcase,
  FiLayers,
  FiBarChart2,
  FiPieChart,
  FiMaximize2,
  FiImage,
  FiSend
} from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DeanDashboard = ({ isAdminView = false, selectedFacultyId = '' }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedBudgetSource, setSelectedBudgetSource] = useState('');
  const [budgetSources, setBudgetSources] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // ALL, RED, YELLOW, GREEN

  // Drill-down Modal state
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [deptProjects, setDeptProjects] = useState(null);
  const [loadingDeptProjects, setLoadingDeptProjects] = useState(false);

  const recentPhotos = data?.recentPhotos || [];
  const visiblePhotos = recentPhotos.slice(0, 4);

  const getProjectRAG = (p) => {
    const target = p.targetCount || 1;
    const completed = p.completedCount || 0;
    const progressPct = target > 0 ? (completed / target) * 100 : 0;
    
    const budget = parseFloat(p.totalBudget || 0);
    const activities = p.activities || [];
    const actualSpent = activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
    const burnRatePct = budget > 0 ? (actualSpent / budget) * 100 : 0;

    const overBudgetItem = activities.find(a => parseFloat(a.actualBudget || 0) > parseFloat(a.budget || 0));

    if (progressPct < 40 || (burnRatePct > 90 && progressPct < 50) || overBudgetItem) {
      return { status: 'RED', label: 'วิกฤต/ช้ากว่าแผนมาก', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' };
    } else if (progressPct < 75 || Math.abs(burnRatePct - progressPct) > 25) {
      return { status: 'YELLOW', label: 'เฝ้าระวัง/ช้าเล็กน้อย', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { status: 'GREEN', label: 'ปกติ/เป็นไปตามแผน', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const handleDepartmentClick = async (departmentId, departmentName) => {
    try {
      setLoadingDeptProjects(true);
      setSelectedDeptName(departmentName);
      setDeptProjects([]);
      const response = await api.get('/projects', { 
        params: { 
          departmentId, 
          limit: 150, 
          fiscalYearId: selectedFiscalYear || undefined 
        } 
      });
      setDeptProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to load department projects:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเรียกดูข้อมูลโครงการของสาขา/ภาควิชานี้ได้'
      });
    } finally {
      setLoadingDeptProjects(false);
    }
  };

  const handleOpenDetailModal = (p) => {
    const target = p.targetCount || 1;
    const completed = p.completedCount || 0;
    const progressPct = target > 0 ? parseFloat(((completed / target) * 100).toFixed(2)) : 0;
    
    const budget = parseFloat(p.totalBudget || 0);
    const activities = p.activities || [];
    const totalSpent = activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
    const burnRatePct = budget > 0 ? parseFloat(((totalSpent / budget) * 100).toFixed(2)) : 0;
    
    const rag = getProjectRAG(p);
    
    const enrichedProject = {
      ...p,
      totalSpent,
      progressPct,
      burnRatePct,
      rag
    };
    
    setSelectedProjectModal(enrichedProject);
    setSelectedDeptName('');
    setDeptProjects(null);
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex === null || !recentPhotos.length) return;
    const len = recentPhotos.length;
    setActivePhotoIndex((prev) => (prev - 1 + len) % len);
  };

  const handleNextPhoto = () => {
    if (activePhotoIndex === null || !recentPhotos.length) return;
    const len = recentPhotos.length;
    setActivePhotoIndex((prev) => (prev + 1) % len);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'Escape') setActivePhotoIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, recentPhotos]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [fyRes, bsRes] = await Promise.all([
          api.get('/master/fiscal-years'),
          api.get('/master/budget-sources')
        ]);
        const years = fyRes.data || [];
        setFiscalYears(years);
        setBudgetSources(bsRes.data || []);

        // Pre-select active fiscal year by default on first load
        const activeYear = years.find(y => y.active) || years[0];
        if (activeYear) {
          setSelectedFiscalYear(String(activeYear.id));
        }
      } catch (err) {
        console.error('Failed to load master filters for Dean:', err);
      }
    };
    fetchMasterData();
  }, []);

  const fetchDeanData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedFiscalYear) params.fiscalYearId = selectedFiscalYear;
      if (selectedBudgetSource) params.budgetSourceId = selectedBudgetSource;
      if (isAdminView && selectedFacultyId) {
        params.facultyId = selectedFacultyId;
      }
      const response = await api.get('/dashboard/dean', { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load Dean dashboard:', err);
      setError('ไม่สามารถโหลดข้อมูลสถิติมุมมองคณบดีได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminView || selectedFacultyId) {
      fetchDeanData();
    } else {
      setLoading(false);
      setData(null);
    }
  }, [selectedFiscalYear, selectedBudgetSource, selectedFacultyId, isAdminView]);

  if (isAdminView && !selectedFacultyId) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <div className="text-sm font-extrabold text-slate-700">กรุณาเลือกคณะที่ต้องการดูข้อมูล</div>
        <div className="text-xs text-slate-400 mt-1">โปรดเลือกคณะจากตัวเลือกด้านบนเพื่อแสดงแดชบอร์ดภาพรวมของคณบดีประจำคณะนั้น</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 font-bold text-xs">
        {error}
      </div>
    );
  }

  const {
    facultyName = '',
    healthCheck = { overallProgress: 0, overallBurnRate: 0, totalSpent: 0, totalBudget: 0, redCount: 0, greenCount: 0, yellowCount: 0, totalProjects: 0 },
    localIssues = [],
    strategicPillars = [],
    redFlagProjects = [],
    departmentPerformance = [],
    allProjects = []
  } = data || {};

  const filteredProjectsList = allProjects.filter(p => {
    if (selectedStatusFilter === 'RED') return p.rag.status === 'RED';
    if (selectedStatusFilter === 'YELLOW') return p.rag.status === 'YELLOW';
    if (selectedStatusFilter === 'GREEN') return p.rag.status === 'GREEN';
    return true;
  });

  return (
    <div className="pb-12 animate-fadeIn">
      {/* 🖨️ Dedicated Official Print Stylesheet for Dean Faculty Report */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 8mm 8mm 8mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Prompt', sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, nav, header, .no-print, button, input {
            display: none !important;
          }
          .screen-only {
            display: none !important;
          }
          .official-print-document {
            display: block !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 5px 7px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            color: #1e293b !important;
          }
        }
        @media screen {
          .official-print-document {
            display: none !important;
          }
        }
      `}</style>

      {/* 🖥️ 1. Screen Interactive Dashboard UI */}
      <div className="screen-only space-y-6">
        {/* 1. Header Banner & Executive Controls */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-purple-500/20">
          <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-violet-200 border border-white/15">
                <FiGrid className="w-3.5 h-3.5 text-violet-400" />
                <span>การบริหารจัดการยุทธศาสตร์ระดับคณะ (Faculty Strategic Performance)</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {facultyName?.startsWith('คณะ') ? facultyName : `คณะ${facultyName || ''}`}
              </h1>
              <p className="text-xs md:text-sm text-violet-200/80 font-medium max-w-2xl">
                กำกับติดตามผลความก้าวหน้ายุทธศาสตร์ สถิติงบประมาณ และสรุปโครงการเร่งด่วนระดับคณะ
              </p>
            </div>

            {/* Controls: Fiscal Year, Budget Source & Export */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Fiscal Year Filter */}
              <div className="flex items-center gap-2">
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white flex items-center justify-center shrink-0">
                  <FiFilter className="w-4 h-4 text-violet-300" />
                </div>
                <CustomSelect
                  value={selectedFiscalYear}
                  onChange={(val) => setSelectedFiscalYear(val)}
                  options={[
                    { value: '', label: 'ทุกปีงบประมาณ' },
                    ...fiscalYears.map(fy => ({ 
                      value: String(fy.id), 
                      label: fy.active ? `ปีงบประมาณ พ.ศ. ${fy.year} (ปีปัจจุบัน)` : `ปีงบประมาณ พ.ศ. ${fy.year}` 
                    }))
                  ]}
                  dark={true}
                  triggerClassName="bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 text-xs font-extrabold text-white flex items-center justify-between gap-2 focus:outline-none transition-all cursor-pointer min-w-[155px]"
                  optionsClassName="absolute right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto w-full md:w-max md:min-w-[175px] text-white animate-fadeIn"
                />
              </div>

              {/* Budget Source Filter */}
              <CustomSelect
                value={selectedBudgetSource}
                onChange={(val) => setSelectedBudgetSource(val)}
                options={[
                  { value: '', label: 'ทุกแหล่งเงินทุน' },
                  ...budgetSources.map(bs => ({ value: String(bs.id), label: bs.name }))
                ]}
                dark={true}
                triggerClassName="bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 text-xs font-extrabold text-white flex items-center justify-between gap-2 focus:outline-none transition-all cursor-pointer min-w-[155px]"
                optionsClassName="absolute right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto w-full md:w-max md:min-w-[175px] text-white animate-fadeIn"
              />

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-900 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                title="พิมพ์หรือบันทึกเป็น PDF สรุปภาพรวมยุทธศาสตร์ระดับคณะ"
              >
                <FiPrinter className="w-4 h-4 text-primary" />
                <span>พิมพ์รายงานสรุปคณะ</span>
              </button>
            </div>
          </div>

        {/* Executive KPI Gauge Progress */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">ความก้าวหน้ายุทธศาสตร์คณะ</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{healthCheck.overallProgress}%</span>
                <span className="text-xs text-emerald-400 font-bold">ของเป้าหมายรวม</span>
              </div>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-400 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, healthCheck.overallProgress)}%` }} />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">งบประมาณเบิกจ่ายสะสม (Burn Rate)</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{healthCheck.overallBurnRate}%</span>
                <span className="text-xs text-sky-300 font-bold">{healthCheck.totalSpent.toLocaleString()} ฿</span>
              </div>
            </div>
            <div className="text-[10px] text-violet-300/70 mt-2 truncate">จากงบประมาณรวม {healthCheck.totalBudget.toLocaleString()} ฿</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">โครงการวิกฤต (Red Flags)</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-400">{healthCheck.redCount}</span>
                <span className="text-xs text-rose-300 font-bold">โครงการที่ต้องเร่งรัด</span>
              </div>
            </div>
            <div className="text-[10px] text-rose-200/80 mt-2">ช้ากว่าแผน หรือใช้เกินงบ</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">สถานะโครงการทั้งหมด</div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-extrabold">
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {healthCheck.greenCount} ปกติ</span>
              <span className="text-amber-300 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> {healthCheck.yellowCount} เฝ้าระวัง</span>
              <span className="text-rose-400 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> {healthCheck.redCount} วิกฤต</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Dean Visual Analytics (Chart.js Section) ── */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Department Budget vs Actual (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiBarChart2 className="w-4 h-4 text-primary shrink-0" />
                  <span>งบประมาณจัดสรร vs เบิกจ่ายจริง รายภาควิชา/หน่วยงาน</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">เปรียบเทียบงบประมาณตามแผนและยอดเบิกจ่ายจริงของแต่ละภาควิชาในสังกัด</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#DDD6FE]"></span>
                  <span>ตามแผน</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6C3BFF]"></span>
                  <span>จ่ายจริง</span>
                </span>
              </div>
            </div>
            <div className="h-72 w-full">
              <Bar
                data={{
                  labels: (departmentPerformance || []).map(d => d.name || ''),
                  datasets: [
                    {
                      label: 'งบประมาณตามแผน',
                      data: (departmentPerformance || []).map(d => d.totalBudget || 0),
                      backgroundColor: '#DDD6FE',
                      borderRadius: 6,
                      barThickness: 16
                    },
                    {
                      label: 'งบประมาณเบิกจ่ายจริง',
                      data: (departmentPerformance || []).map(d => d.totalSpent || 0),
                      backgroundColor: '#6C3BFF',
                      borderRadius: 6,
                      barThickness: 16
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1E1B4B',
                      padding: 12,
                      cornerRadius: 12,
                      callbacks: {
                        title: (items) => items[0]?.label || '',
                        label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw || 0).toLocaleString('th-TH')} บาท`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { 
                        font: { size: 10, weight: 'bold' }, 
                        color: '#64748B',
                        autoSkip: false,
                        maxRotation: 30,
                        minRotation: 0
                      }
                    },
                    y: {
                      grid: { color: '#F1F5F9' },
                      border: { dash: [4, 4] },
                      ticks: {
                        font: { size: 10 },
                        color: '#94A3B8',
                        callback: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Summary Badges Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">รวมงบประมาณคณะ:</span>
                <span className="font-extrabold text-slate-800">{healthCheck.totalBudget?.toLocaleString('th-TH')} ฿</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">เบิกจ่ายสะสม:</span>
                <span className="font-extrabold text-emerald-600">{healthCheck.totalSpent?.toLocaleString('th-TH')} ฿ ({healthCheck.overallBurnRate}%)</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Project Health Status Distribution (Donut - 1 col) */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiPieChart className="w-4 h-4 text-violet-600 shrink-0" />
                <span>สถานะสุขภาพโครงการในคณะ</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">สัดส่วนสุขภาพโครงการ (RAG Health Status)</p>
            </div>
            <div className="h-[230px] w-full relative flex items-center justify-center my-auto">
              <Doughnut
                data={{
                  labels: ['ปกติ/ตามแผน', 'เฝ้าระวัง', 'วิกฤต/เร่งด่วน'],
                  datasets: [
                    {
                      data: [healthCheck.greenCount || 0, healthCheck.yellowCount || 0, healthCheck.redCount || 0],
                      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                      borderWidth: 3,
                      borderColor: '#ffffff',
                      hoverOffset: 6
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1E1B4B',
                      padding: 12,
                      cornerRadius: 12,
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.raw} โครงการ`
                      }
                    }
                  },
                  cutout: '72%'
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">โครงการในคณะ</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{healthCheck.totalProjects}</span>
                <span className="text-[10px] font-bold text-slate-500">โครงการ</span>
              </div>
            </div>

            {/* Status Legend Badges Footer */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/50 text-[11px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700">ปกติ:</span>
                  <span className="text-emerald-700">{healthCheck.greenCount} โครงการ</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/50 text-[11px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-700">เฝ้าระวัง:</span>
                  <span className="text-amber-700">{healthCheck.yellowCount} โครงการ</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200/50 text-[11px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-700">วิกฤต:</span>
                  <span className="text-rose-700">{healthCheck.redCount} โครงการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Department Progress Ranking Horizontal Bar */}
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>จัดอันดับความก้าวหน้า (% Progress) รายภาควิชา</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">เรียงลำดับผลการดำเนินงานตามเป้าหมายสะสมของภาควิชาในคณะ</p>
            </div>
          </div>
          <div className="w-full" style={{ minHeight: `${Math.max(260, (departmentPerformance?.length || 0) * 44)}px` }}>
            {(() => {
              const sorted = [...(departmentPerformance || [])].sort((a, b) => b.progressPct - a.progressPct);
              return (
                <Bar
                  data={{
                    labels: sorted.map(d => d.name || 'ภาควิชา'),
                    datasets: [
                      {
                        label: '% ความก้าวหน้ารวม',
                        data: sorted.map(d => d.progressPct || 0),
                        backgroundColor: sorted.map(d => 
                          d.progressPct >= 75 ? '#10B981' : d.progressPct >= 40 ? '#F59E0B' : '#EF4444'
                        ),
                        borderRadius: 8,
                        barThickness: 16
                      }
                    ]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#1E1B4B',
                        padding: 12,
                        cornerRadius: 12,
                        callbacks: {
                          title: (items) => items[0]?.label || '',
                          label: (ctx) => ` ความก้าวหน้าเฉลี่ย: ${ctx.raw}%`
                        }
                      }
                    },
                    scales: {
                      x: {
                        max: 100,
                        grid: { color: '#F1F5F9' },
                        ticks: {
                          font: { family: "'Prompt', sans-serif", size: 10 },
                          callback: (v) => `${v}%`
                        }
                      },
                      y: {
                        grid: { display: false },
                        ticks: { 
                          font: { family: "'Prompt', sans-serif", size: 11, weight: 'bold' },
                          autoSkip: false
                        }
                      }
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>

        {/* 2.5 4-Tier Strategic Accomplishment Panel (4 ประเด็นยุทธศาสตร์ตามข้อมูลหลัก) */}
        {strategicPillars && strategicPillars.length > 0 && (
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiLayers className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>ผลสัมฤทธิ์ตาม {strategicPillars.length} แผนงานยุทธศาสตร์ระดับคณะ (Faculty Strategic Alignment)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">การติดตามผลสัมฤทธิ์และการเบิกจ่ายงบประมาณจำแนกตามแผนงานยุทธศาสตร์หลัก (S1 - S{strategicPillars.length})</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200 self-start sm:self-auto">
                {strategicPillars.length} แผนงานหลัก
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {strategicPillars.map((sp, idx) => {
                const colors = [
                  { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-200/80', badge: 'bg-violet-100 text-violet-800', bar: 'bg-violet-600' },
                  { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-200/80', badge: 'bg-purple-100 text-purple-800', bar: 'bg-purple-600' },
                  { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-200/80', badge: 'bg-blue-100 text-blue-800', bar: 'bg-blue-600' },
                  { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-200/80', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-600' },
                  { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-200/80', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-600' },
                  { bg: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-200/80', badge: 'bg-rose-100 text-rose-800', bar: 'bg-rose-600' }
                ];
                const c = colors[idx % colors.length];

                return (
                  <div
                    key={sp.strategyId || idx}
                    className={`bg-gradient-to-br ${c.bg} p-4 rounded-2xl border ${c.border} space-y-3 flex flex-col justify-between`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${c.badge}`}>
                          {sp.strategyCode || `S${idx + 1}`}
                        </span>
                        {sp.localIssueCode && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-slate-600 border border-slate-200/60 shadow-3xs">
                            {sp.localIssueCode}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2" title={sp.strategyName}>
                        {sp.strategyName}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/50 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600 font-bold">
                        <span>จำนวนโครงการ</span>
                        <span className="text-slate-900 font-black">{sp.totalProjects} โครงการ</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 font-bold">
                        <span>งบประมาณคณะ</span>
                        <span className="text-slate-900 font-black">{parseFloat(sp.totalBudget || 0).toLocaleString()} ฿</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black">
                          <span className="text-slate-500">ความก้าวหน้ารวม</span>
                          <span className="text-emerald-700">{sp.progressPct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                          <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(sp.progressPct, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Management by Exception: Red Flags & Critical Bottlenecks Panel */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>โครงการวิกฤตเร่งด่วนประจำคณะ (Faculty Critical Bottlenecks)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">ชี้เป้าโครงการที่มีความก้าวหน้าล่าช้ากว่ากำหนด หรือมีการเบิกจ่ายงบประมาณเกินแผนเพื่อการแก้ไขตรงจุด</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedStatusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ทั้งหมด ({healthCheck.totalProjects})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('RED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedStatusFilter === 'RED' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
            >
              🔴 วิกฤต ({healthCheck.redCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('YELLOW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedStatusFilter === 'YELLOW' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            >
              🟡 เฝ้าระวัง ({healthCheck.yellowCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('GREEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedStatusFilter === 'GREEN' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              🟢 ปกติ ({healthCheck.greenCount})
            </button>
          </div>
        </div>

        {/* Red Flags Table */}
        {filteredProjectsList.length > 0 ? (
          <div className="w-full rounded-2xl border border-slate-100 shadow-2xs overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-3 text-center whitespace-nowrap w-[10%]">สถานะ</th>
                  <th className="py-3 px-3 w-[38%]">ชื่อโครงการวิกฤต</th>
                  <th className="py-3 px-3 w-[22%]">ผู้รับผิดชอบ & ภาควิชา</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap w-[14%]">งบประมาณ / เบิกจ่าย</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-[8%]">ความก้าวหน้า</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-[8%]">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredProjectsList.map((p) => {
                  const budgetNum = parseFloat(p.totalBudget || 0);
                  const spentNum = p.totalSpent || 0;
                  const isCritical = p.rag.status === 'RED' || p.rag.status === 'YELLOW';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group align-middle">
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-3xs inline-flex items-center gap-1 ${p.rag.badgeColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.rag.status === 'RED' ? 'bg-rose-500 animate-pulse' : p.rag.status === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span>{p.rag.status === 'RED' ? 'วิกฤต' : p.rag.status === 'YELLOW' ? 'เฝ้าระวัง' : 'ปกติ'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-start gap-2">
                          <div className={`p-1 rounded-md shrink-0 mt-0.5 border ${p.rag.status === 'RED' ? 'bg-rose-50 text-rose-500 border-rose-100' : p.rag.status === 'YELLOW' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            <FiBriefcase className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-snug">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              ปีงบประมาณ พ.ศ. {p.fiscalYear?.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          {/* 1. ผู้รับผิดชอบหลัก */}
                          <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 leading-tight">
                            <FiUser className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.creator?.name ? p.creator.name.replace(/\s*\([^)]*\)/g, '').trim() : 'ไม่ระบุผู้รับผิดชอบ'}</span>
                          </div>
                          {/* 2. ภาควิชา (ลำดับสุดท้าย) */}
                          {p.department?.name && (
                            <div className="pt-0.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200/60 inline-block leading-none">
                                {p.department.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-black text-slate-900">{budgetNum.toLocaleString()} ฿</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          จ่าย {spentNum.toLocaleString()} ฿ <span className="text-emerald-600 font-bold">({p.burnRatePct}%)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="font-black text-slate-800">{p.progressPct}%</div>
                        <div className="w-14 bg-slate-100 h-1.5 rounded-full mx-auto mt-0.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${p.progressPct < 40 ? 'bg-rose-500' : p.progressPct < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, p.progressPct)}%` }} />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          {isCritical ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProjectModal(p)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm shadow-rose-600/20 active:scale-95 cursor-pointer"
                              title="ออกข้อสั่งการเร่งรัดและติดตามผลการดำเนินงาน"
                            >
                              <FiSend className="w-3 h-3 shrink-0" />
                              <span>สั่งการ</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedProjectModal(p)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-violet-50 hover:bg-primary hover:text-white text-primary rounded-xl font-bold text-xs transition-all border border-violet-200/70 shadow-3xs active:scale-95 cursor-pointer"
                              title="ดูรายละเอียดโครงการ"
                            >
                              <FiEye className="w-3 h-3 shrink-0" />
                              <span>ดูข้อมูล</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-extrabold text-slate-700">ไม่มีโครงการติดสถานะวิกฤตตามเงื่อนไขที่เลือก</div>
            <div className="text-xs text-slate-400 mt-0.5">การดำเนินงานโครงการของคณะเป็นไปตามเป้าหมายและแผนงบประมาณที่กำหนด</div>
          </div>
        )}
      </div>

      {/* 2.5 Cross-Department Strategic Heatmap Matrix */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FiGrid className="w-5 h-5 text-primary shrink-0" />
              <span>ตารางเปรียบเทียบผลงานตามสาขา/ภาควิชา (Cross-Department Strategic Heatmap)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">ตารางประเมินเปรียบเทียบ % ความก้าวหน้ายุทธศาสตร์ % การใช้จ่ายงบประมาณ และจำนวนจุดวิกฤตจำแนกรายสาขา/ภาควิชาภายในคณะ</p>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3.5 px-4 min-w-[220px]">สาขา / ภาควิชา</th>
                <th className="py-3.5 px-4 w-28 text-center">จำนวนโครงการ</th>
                <th className="py-3.5 px-4 w-36 text-right">งบประมาณจัดสรร</th>
                <th className="py-3.5 px-4 w-36 text-right">เบิกจ่ายจริง</th>
                <th className="py-3.5 px-4 w-32 text-center">% ความก้าวหน้า</th>
                <th className="py-3.5 px-4 w-32 text-center">% Burn Rate</th>
                <th className="py-3.5 px-4 w-44 text-center">การกระจายสถานะ (🟢/🟡/🔴)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentPerformance.map((dept) => {
                return (
                  <tr 
                    key={dept.id} 
                    onClick={() => handleDepartmentClick(dept.id, dept.name)}
                    className="hover:bg-slate-50 hover:shadow-3xs cursor-pointer transition-colors group align-middle"
                    title={`คลิกเพื่อดูรายการโครงการของ ${dept.name}`}
                  >
                    <td className="py-3.5 px-4 font-extrabold text-slate-800 group-hover:text-primary transition-colors flex items-center gap-2 whitespace-nowrap">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dept.overallStatus === 'RED' ? 'bg-rose-500' : dept.overallStatus === 'YELLOW' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      <span>{dept.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                      {dept.projectCount} โครงการ
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 whitespace-nowrap">
                      {dept.totalBudget.toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                      {dept.totalSpent.toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="font-extrabold text-slate-800">{dept.progressPct}%</div>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${dept.progressPct < 40 ? 'bg-rose-500' : dept.progressPct < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, dept.progressPct)}%` }} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-700 whitespace-nowrap">
                      {dept.burnRatePct}%
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">🟢 {dept.greenCount} ปกติ</span>
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">🟡 {dept.yellowCount} เฝ้าระวัง</span>
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">🔴 {dept.redCount} วิกฤต</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      {/* 3.5 Recent Faculty Activity Photos (Evidence-based Executive Gallery) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span>คลังภาพกิจกรรมความสำเร็จของคณะล่าสุด (Recent Faculty Activity Photos)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">ภาพถ่ายผลงานเชิงประจักษ์ของการจัดโครงการและกิจกรรมต่าง ๆ ภายในคณะสังกัด</p>
          </div>

          {recentPhotos && recentPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setActivePhotoIndex(0)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl font-extrabold text-xs transition-all border border-slate-200/80 shadow-3xs cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
            >
              <FiMaximize2 className="w-3.5 h-3.5 text-primary" />
              <span>ดูภาพทั้งหมด ({recentPhotos.length} ภาพ)</span>
            </button>
          )}
        </div>

        {recentPhotos && recentPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
            {recentPhotos.map((photo, index) => (
              <div 
                key={photo.id || index} 
                onClick={() => setActivePhotoIndex(index)}
                className="bg-white rounded-3xl border border-slate-100 hover:border-violet-200 shadow-soft hover:shadow-xl transition-all duration-300 active:scale-[0.98] overflow-hidden flex flex-col justify-between cursor-pointer group h-full"
              >
                {/* 1. Unobstructed Pure Photo Container (Fixed 16:10 Ratio) */}
                <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-slate-900">
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.activityName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {/* Floating Zoom Hint on Hover */}
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-slate-950/75 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <FiMaximize2 className="w-3.5 h-3.5" />
                      <span>คลิกขยายดูภาพ</span>
                    </span>
                  </div>
                </div>

                {/* 2. Structured Information Body (Locked Heights for 100% Equal Size) */}
                <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2.5 bg-white">
                  <div className="space-y-1.5">
                    {/* Department Badge Tag (Fixed h-6) */}
                    <div className="h-6 flex items-center">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100/80 shadow-3xs truncate max-w-[95%] inline-block" title={photo.departmentName}>
                        🏢 {photo.departmentName || 'ภาควิชา'}
                      </span>
                    </div>

                    {/* Activity Title (Fixed h-10 for 2-line consistency) */}
                    <div className="h-10 flex items-start overflow-hidden">
                      <h4 className="font-extrabold text-slate-800 text-xs group-hover:text-primary transition-colors leading-snug line-clamp-2" title={photo.activityName}>
                        {photo.activityName}
                      </h4>
                    </div>
                  </div>

                  {/* Project / Action at Bottom (Fixed h-7) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] h-7 shrink-0">
                    <span className="font-semibold text-slate-500 truncate max-w-[85%]" title={photo.projectName}>
                      {photo.projectName || 'โครงการ'}
                    </span>
                    <span className="text-slate-400 group-hover:text-primary transition-colors text-xs shrink-0">
                      <FiEye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="text-sm font-extrabold text-slate-700">ยังไม่มีภาพกิจกรรมบันทึกเข้าระบบภายในคณะนี้</div>
            <div className="text-xs text-slate-400 mt-0.5">ภาพถ่ายที่อัปโหลดโดยผู้ดำเนินกิจกรรมจะแสดงผลที่นี่โดยอัตโนมัติ</div>
          </div>
        )}
      </div>

      {/* Lightbox Modal (Full Gallery View - Preserves 100% Original Photo Dimensions) */}
      {activePhotoIndex !== null && recentPhotos[activePhotoIndex] && (() => {
        const activePhoto = recentPhotos[activePhotoIndex];
        return createPortal(
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
              onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 rounded-full text-white cursor-pointer transition-all z-[70] shadow-lg backdrop-blur-xs"
              title="ภาพก่อนหน้า (ลูกศรซ้าย)"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Arrow Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 rounded-full text-white cursor-pointer transition-all z-[70] shadow-lg backdrop-blur-xs"
              title="ภาพถัดไป (ลูกศรขวา)"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>

            <div 
              className="max-w-[92vw] w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row relative z-[65] md:h-[84vh] h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preserved Full Original Image Container */}
              <div className="md:w-3/5 bg-black/95 flex flex-col items-center justify-center p-4 md:p-6 md:h-full justify-between relative">
                <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
                  <img 
                    src={activePhoto.imageUrl} 
                    alt={activePhoto.activityName} 
                    className="max-w-full max-h-[66vh] object-contain rounded-xl shadow-2xl animate-fadeIn select-none" 
                  />
                </div>
                
                {/* Thumbnails list at the bottom of image container */}
                {recentPhotos.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 max-w-full overflow-x-auto py-1 px-2 select-none z-50">
                    {recentPhotos.map((img, idx) => {
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
                    <span className="text-[10px] font-black bg-primary/30 text-violet-200 px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wider">{activePhoto.departmentName}</span>
                    <h3 className="text-lg font-black text-white mt-4 leading-snug">{activePhoto.activityName}</h3>
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">โครงการต้นสังกัด</h4>
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed">{activePhoto.projectName}</p>
                  </div>
                  {activePhoto.description && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">รายละเอียดผลงาน</h4>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2 scrollbar-thin">{activePhoto.description}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-800 pt-5 flex items-center justify-between text-slate-400 text-[10px] font-black tracking-wide">
                  <span>{activePhoto.departmentName}</span>
                  <span>{new Date(activePhoto.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      </div>
      {/* ── End of Screen Interactive Dashboard UI ── */}

      {/* 📄 2. Official Executive Faculty Strategic Report Document (Official A4 PDF / Print Format) */}
      <div className="official-print-document font-prompt text-slate-900 bg-white space-y-2.5 mt-0 pt-0">
        {/* Official Document Header */}
        <div className="border-b-2 border-slate-900 pb-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base tracking-wider shrink-0">
                BRU
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">มหาวิทยาลัยราชภัฏบุรีรัมย์</h1>
                <h2 className="text-[11px] font-bold text-slate-700">
                  รายงานสรุปผลการดำเนินงานและการใช้จ่ายงบประมาณตามแผนยุทธศาสตร์ {facultyName?.startsWith('คณะ') ? facultyName : `คณะ${facultyName || ''}`}
                </h2>
                <div className="text-[9px] text-slate-500 font-medium">ระบบติดตามและประเมินผลเชิงยุทธศาสตร์มหาวิทยาลัย (BRU Strategic Tracking System)</div>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-700 space-y-0.5 font-medium border-l border-slate-300 pl-2.5">
              <div><span className="font-bold">ปีงบประมาณ:</span> {selectedFiscalYear ? `พ.ศ. ${fiscalYears.find(f => String(f.id) === selectedFiscalYear)?.year || selectedFiscalYear}` : 'ทุกปีงบประมาณ'}</div>
              <div><span className="font-bold">แหล่งงบประมาณ:</span> {selectedBudgetSource ? budgetSources.find(b => String(b.id) === selectedBudgetSource)?.name : 'ทุกแหล่งเงินทุน'}</div>
              <div><span className="font-bold">วันที่ออกเอกสาร:</span> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</div>
              <div><span className="font-bold">ผู้ออกรายงาน:</span> {user?.name || 'คณบดี'} ({facultyName?.startsWith('คณะ') ? facultyName : `คณะ${facultyName || ''}`})</div>
            </div>
          </div>
        </div>

        {/* Section 1: สรุปภาพรวมสถานะยุทธศาสตร์คณะ (Executive Summary KPI Box) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            1. สรุปภาพรวมตัวชี้วัดยุทธศาสตร์และการเงินประจำคณะ (Faculty Health Summary)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">ความก้าวหน้ายุทธศาสตร์คณะ</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{healthCheck.overallProgress}% <span className="text-[9px] font-normal text-slate-500">(ของเป้าหมายรวม)</span></td>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">งบประมาณจัดสรรรวมทั้งคณะ</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{parseFloat(healthCheck.totalBudget || 0).toLocaleString()} <span className="text-[10px] font-normal">บาท</span></td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">การเบิกจ่ายจริงสะสม (Burn Rate)</td>
                <td className="font-bold text-slate-900 py-1 px-2">{parseFloat(healthCheck.totalSpent || 0).toLocaleString()} บาท <span className="text-emerald-700 font-black">({healthCheck.overallBurnRate}%)</span></td>
                <td className="bg-slate-50 font-bold py-1 px-2">งบประมาณคงเหลือสุทธิ</td>
                <td className="font-bold text-slate-900 py-1 px-2">{parseFloat((healthCheck.totalBudget || 0) - (healthCheck.totalSpent || 0)).toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">สถานะสุขภาพโครงการในคณะ</td>
                <td colSpan="3" className="py-1 px-2">
                  <div className="flex items-center gap-3 font-bold text-[10px]">
                    <span>รวมทั้งหมด <strong className="text-slate-900 font-black">{healthCheck.totalProjects}</strong> โครงการ</span>
                    <span className="text-emerald-700">🟢 ปกติ/ตามแผน: {healthCheck.greenCount}</span>
                    <span className="text-amber-700">🟡 เฝ้าระวัง: {healthCheck.yellowCount}</span>
                    <span className="text-rose-700">🔴 วิกฤต/ช้ากว่าแผน: {healthCheck.redCount}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: ผลการดำเนินงานรายภาควิชา/สาขาวิชา (Cross-Department Matrix) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            2. ผลการดำเนินงานและการใช้จ่ายงบประมาณจำแนกรายภาควิชา / สาขาวิชา (Cross-Department Matrix)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-10 text-center py-1 px-2">ลำดับ</th>
                <th className="text-left py-1 px-2">ภาควิชา / สาขาวิชา</th>
                <th className="w-24 text-center py-1 px-2">จำนวนโครงการ</th>
                <th className="w-28 text-right py-1 px-2">งบประมาณจัดสรร (บาท)</th>
                <th className="w-28 text-right py-1 px-2">เบิกจ่ายจริง (บาท)</th>
                <th className="w-20 text-center py-1 px-2">% ก้าวหน้า</th>
                <th className="w-20 text-center py-1 px-2">% Burn Rate</th>
                <th className="w-24 text-center py-1 px-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {departmentPerformance && departmentPerformance.length > 0 ? (
                departmentPerformance.map((dept, idx) => (
                  <tr key={dept.id || idx}>
                    <td className="text-center font-bold py-1 px-2">{idx + 1}</td>
                    <td className="font-semibold text-slate-800 text-left py-1 px-2">{dept.name}</td>
                    <td className="text-center font-bold py-1 px-2">{dept.projectCount}</td>
                    <td className="text-right font-medium py-1 px-2">{parseFloat(dept.totalBudget || 0).toLocaleString()}</td>
                    <td className="text-right font-medium py-1 px-2">{parseFloat(dept.totalSpent || 0).toLocaleString()}</td>
                    <td className="text-center font-bold py-1 px-2">{dept.progressPct || 0}%</td>
                    <td className="text-center font-bold py-1 px-2">{dept.burnRatePct || 0}%</td>
                    <td className="text-center font-bold text-[9px] py-1 px-2">
                      <span className="text-emerald-700">🟢{dept.greenCount || 0} </span>
                      <span className="text-amber-700">🟡{dept.yellowCount || 0} </span>
                      <span className="text-rose-700">🔴{dept.redCount || 0}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-1.5 text-slate-400 italic">ไม่พบข้อมูลภาควิชาในคณะ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: รายการโครงการวิกฤตและข้อสั่งการ (Critical Bottlenecks & Directives) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            3. รายการโครงการสำคัญระดับคณะที่ต้องได้รับการเร่งรัดและแก้ไข (Critical Bottlenecks & Directives)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-8 text-center py-1 px-1.5">ลำดับ</th>
                <th className="text-left py-1 px-2">ชื่อโครงการวิกฤต</th>
                <th className="w-28 text-left py-1 px-1.5">ภาควิชา / สาขา</th>
                <th className="w-24 text-left py-1 px-1.5">ผู้รับผิดชอบ</th>
                <th className="w-22 text-right py-1 px-1.5">งบประมาณ (บาท)</th>
                <th className="w-16 text-center py-1 px-1.5">% ก้าวหน้า</th>
                <th className="w-40 text-left py-1 px-2">ข้อสั่งการคณบดี / ผู้บริหาร</th>
              </tr>
            </thead>
            <tbody>
              {redFlagProjects && redFlagProjects.length > 0 ? (
                redFlagProjects.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td className="text-center font-bold py-1 px-1.5">{idx + 1}</td>
                    <td className="font-semibold text-slate-800 text-left py-1 px-2">
                      <div>{p.name}</div>
                      <div className="text-[8px] text-slate-400 font-normal">ปีงบประมาณ พ.ศ. {p.fiscalYear?.year}</div>
                    </td>
                    <td className="text-left py-1 px-1.5">
                      <div className="font-medium text-slate-800">{p.department?.name || 'ไม่ระบุ'}</div>
                    </td>
                    <td className="font-medium text-slate-700 text-left py-1 px-1.5">{p.creator?.name || 'ไม่ระบุ'}</td>
                    <td className="text-right font-medium py-1 px-1.5">{parseFloat(p.totalBudget || 0).toLocaleString()}</td>
                    <td className="text-center font-black text-rose-700 py-1 px-1.5">{p.progressPct || 0}%</td>
                    <td className="text-slate-800 font-medium text-[9px] text-left py-1 px-2">
                      {p.deanDirective || p.presidentDirective || p.executiveDirective ? (
                        <span className="text-violet-900 font-semibold">"{p.deanDirective || p.presidentDirective || p.executiveDirective}"</span>
                      ) : (
                        <span className="text-slate-400 italic">อยู่ระหว่างติดตามและประสานงาน</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-1.5 text-slate-400 italic">ไม่มีโครงการสำคัญระดับคณะติดสถานะวิกฤต</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Document Clean Footer */}
        <div className="text-right text-[8px] text-slate-400 pt-1.5 border-t border-slate-200">
          เอกสารนี้สร้างขึ้นโดยระบบติดตามการทำงานโครงการยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategic Tracking System)
        </div>
      </div>

      {/* 4. Layer 2: Interactive Quick View & Directives Modal */}
      {selectedProjectModal && (
        <ExecutiveProjectModal
          project={selectedProjectModal}
          onClose={() => setSelectedProjectModal(null)}
          onProjectUpdated={() => fetchDeanData()}
        />
      )}

      {/* Department Projects Modal */}
      {selectedDeptName && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 cursor-pointer select-none"
          onClick={() => { setSelectedDeptName(''); setDeptProjects(null); }}
        >
          <div 
            className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <FiLayers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800">
                      รายการโครงการยุทธศาสตร์ของ {selectedDeptName}
                    </h3>
                    {deptProjects && (
                      <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-extrabold border border-violet-200">
                        {deptProjects.length} โครงการ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ปีงบประมาณ พ.ศ. {selectedFiscalYear ? fiscalYears.find(y => String(y.id) === String(selectedFiscalYear))?.year : 'ทั้งหมด'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedDeptName(''); setDeptProjects(null); }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDeptProjects ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : deptProjects && deptProjects.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse min-w-[780px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                        <th className="py-3 px-4 text-center w-36 whitespace-nowrap">สถานะ</th>
                        <th className="py-3 px-4 min-w-[280px]">ชื่อโครงการ</th>
                        <th className="py-3 px-4 w-48 whitespace-nowrap">ภาควิชา/หน่วยงาน</th>
                        <th className="py-3 px-4 w-32 text-right whitespace-nowrap">งบประมาณ</th>
                        <th className="py-3 px-4 w-28 text-center whitespace-nowrap">ความก้าวหน้า</th>
                        <th className="py-3 px-4 w-24 text-center whitespace-nowrap">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-semibold">
                      {deptProjects.map((p) => {
                        const rag = getProjectRAG(p);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors align-middle">
                            <td className="py-3.5 px-4 text-center whitespace-nowrap w-36">
                              <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-3 py-1 rounded-full border whitespace-nowrap shadow-3xs ${
                                rag.status === 'RED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                rag.status === 'YELLOW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                                  rag.status === 'RED' ? 'bg-rose-500 animate-pulse' :
                                  rag.status === 'YELLOW' ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`} />
                                <span>{rag.label}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 leading-snug">
                              {p.name}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                              {p.department?.name || 'ส่วนกลาง'}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap w-32">
                              {parseFloat(p.totalBudget || 0).toLocaleString()} ฿
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap w-28">
                              <div className="font-extrabold text-slate-800">{p.progress}%</div>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${
                                  p.progress < 40 ? 'bg-rose-500' : p.progress < 75 ? 'bg-amber-400' : 'bg-emerald-500'
                                }`} style={{ width: `${Math.min(100, p.progress)}%` }} />
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap w-24">
                              <button
                                type="button"
                                onClick={() => handleOpenDetailModal(p)}
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-violet-50 hover:bg-primary hover:text-white text-primary rounded-xl font-bold text-xs transition-all border border-violet-200/60 shadow-3xs cursor-pointer active:scale-95"
                              >
                                <span>ดูข้อมูล</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FiCheckCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <div className="text-sm font-extrabold text-slate-700">ไม่มีข้อมูลโครงการ</div>
                  <div className="text-xs text-slate-400 mt-0.5">ไม่พบรายชื่อโครงการของสาขา/ภาควิชานี้ตามปีงบประมาณที่กำหนด</div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DeanDashboard;
