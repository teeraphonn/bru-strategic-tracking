import React, { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import ExecutiveProjectModal from '../../components/ExecutiveProjectModal';
import Swal from 'sweetalert2';
import CustomSelect from '../../components/CustomSelect';
import { getImageUrl } from '../../utils/imageUrl';
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  FiGrid,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiAlertTriangle,
  FiEye,
  FiX,
  FiFilter,
  FiPrinter,
  FiBookmark,
  FiBriefcase,
  FiLayers,
  FiUser,
  FiChevronRight,
  FiChevronLeft,
  FiPieChart,
  FiBarChart2,
  FiMaximize2,
  FiImage,
  FiDollarSign,
  FiSend,
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiTarget
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

const PresidentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedBudgetSource, setSelectedBudgetSource] = useState('');
  const [budgetSources, setBudgetSources] = useState([]);
  const [facultiesList, setFacultiesList] = useState([]);
  const [selectedPhotoFaculty, setSelectedPhotoFaculty] = useState('');

  // Drill-down Modal state
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [selectedFacultyName, setSelectedFacultyName] = useState('');
  const [facultyProjects, setFacultyProjects] = useState(null);
  const [loadingFacultyProjects, setLoadingFacultyProjects] = useState(false);
  const [showAllFaculties, setShowAllFaculties] = useState(false);
  const [bottlenecksViewMode, setBottlenecksViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [expandedMainProjectId, setExpandedMainProjectId] = useState(null);
  const [mpFilter, setMpFilter] = useState('ALL'); // 'ALL' | 'GREEN' | 'YELLOW' | 'RED'

  const allPhotos = data?.recentPhotos || [];
  const filteredPhotos = selectedPhotoFaculty
    ? allPhotos.filter(p => String(p.facultyId) === String(selectedPhotoFaculty))
    : allPhotos;

  const handleFacultyClick = async (facultyId, facultyName) => {
    try {
      setLoadingFacultyProjects(true);
      setSelectedFacultyName(facultyName);
      setFacultyProjects([]); // clear old projects
      const response = await api.get('/projects', { 
        params: { 
          facultyId, 
          limit: 150, 
          fiscalYearId: selectedFiscalYear || undefined,
          budgetSourceId: selectedBudgetSource || undefined
        } 
      });
      setFacultyProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to load faculty projects:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเรียกดูข้อมูลโครงการของคณะนี้ได้'
      });
    } finally {
      setLoadingFacultyProjects(false);
    }
  };

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
    setSelectedFacultyName('');
    setFacultyProjects(null);
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex === null || !filteredPhotos.length) return;
    const len = filteredPhotos.length;
    setActivePhotoIndex((prev) => (prev - 1 + len) % len);
  };

  const handleNextPhoto = () => {
    if (activePhotoIndex === null || !filteredPhotos.length) return;
    const len = filteredPhotos.length;
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
  }, [activePhotoIndex, filteredPhotos]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [fyRes, bsRes, facRes] = await Promise.all([
          api.get('/master/fiscal-years'),
          api.get('/master/budget-sources'),
          api.get('/master/faculties')
        ]);
        const years = fyRes.data || [];
        setFiscalYears(years);
        setBudgetSources(bsRes.data || []);
        setFacultiesList(facRes.data || []);

        // Pre-select active fiscal year by default on first load
        const activeYear = years.find(y => y.active) || years[0];
        if (activeYear) {
          setSelectedFiscalYear(String(activeYear.id));
        }
      } catch (err) {
        console.error('Failed to load master filters:', err);
      }
    };
    fetchMasterData();
  }, []);

  const fetchPresidentData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedFiscalYear) params.fiscalYearId = selectedFiscalYear;
      if (selectedBudgetSource) params.budgetSourceId = selectedBudgetSource;
      const response = await api.get('/dashboard/president', { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load President dashboard:', err);
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดระดับมหาวิทยาลัยได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresidentData();
  }, [selectedFiscalYear, selectedBudgetSource]);

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
    universityHealth = { totalProjects: 0, totalBudget: 0, totalSpent: 0, overallProgress: 0, overallBurnRate: 0, totalRed: 0, totalYellow: 0, totalGreen: 0 }, 
    crossFacultyMatrix = [], 
    localIssues = [],
    strategicPillars = [], 
    mainProjects = [],
    criticalBottlenecks = [] 
  } = data || {};

  return (
    <div className="pb-12">
      {/* 🖨️ Dedicated Official Print Stylesheet */}
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
            padding: 6px 8px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            color: #1e293b !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
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
        {/* 1. Executive University Hero Health Check Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-violet-200 border border-white/15">
                <FiGrid className="w-3.5 h-3.5 text-violet-400" />
                <span>แดชบอร์ดผู้บริหารระดับสูง</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategy)
              </h1>
              <p className="text-xs md:text-sm text-violet-200/80 font-normal max-w-2xl">
              กำกับติดตามยุทธศาสตร์สถาบัน และชี้เป้าโครงการวิกฤต (Management by Exception)
            </p>
          </div>

          {/* Controls: Fiscal Year, Budget Source & Print */}
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

            {/* Print & Export Report */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-900 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title="พิมพ์หรือบันทึกเป็น PDF สรุปภาพรวมยุทธศาสตร์สถาบัน"
            >
              <FiPrinter className="w-4 h-4 text-primary" />
              <span>พิมพ์รายงานยุทธศาสตร์</span>
            </button>
          </div>
        </div>

        {/* University Executive Gauges (ครบทุกมิติการเงินและยุทธศาสตร์ในแถบเดียว ไม่ซ้ำซ้อน) */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gauge 1: Strategic Progress */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">ความก้าวหน้ายุทธศาสตร์สถาบัน</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{universityHealth.overallProgress}%</span>
                <span className="text-xs text-emerald-400 font-bold">ของเป้าหมายรวม</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-violet-400 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, universityHealth.overallProgress)}%` }} />
              </div>
              <div className="text-[10px] text-violet-300/70 mt-1.5 truncate">ครอบคลุม 4 ประเด็นการพัฒนาท้องถิ่น (6 แผนงานหลัก)</div>
            </div>
          </div>

          {/* Gauge 2: University Total Budget & Actual Disbursed (เต็มช่อง สวยงาม ไม่ถูกบีบ) */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider flex items-center justify-between">
                <span>งบประมาณจัดสรรรวมทั้งสถาบัน</span>
                <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 font-black text-[10px]">
                  Burn Rate {universityHealth.overallBurnRate}%
                </span>
              </div>
              
              {/* Main Total Budget (สีทองอร่าม เต็มความกว้าง) */}
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                  {universityHealth.totalBudget.toLocaleString('th-TH')}
                </span>
                <span className="text-xs font-extrabold text-amber-200">บาท</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-violet-200 text-[11px] font-bold">จ่ายแล้วจริง:</span>
                <span className="text-emerald-300 font-black text-sm">
                  {universityHealth.totalSpent.toLocaleString('th-TH')} <span className="text-[10px] font-bold text-emerald-200">บาท</span>
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, universityHealth.overallBurnRate)}%` }} />
              </div>
            </div>
          </div>

          {/* Gauge 3: Remaining Budget (สภาพคล่องคงเหลือ) */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">งบประมาณคงเหลือพร้อมใช้งาน</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-sky-300 tracking-tight">
                  {(Math.max(0, universityHealth.totalBudget - universityHealth.totalSpent)).toLocaleString('th-TH')}
                </span>
                <span className="text-xs font-extrabold text-sky-200">บาท</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-violet-200 text-[10px] font-bold">
                <span>คงเหลือสุทธิ</span>
                <span className="text-sky-300 font-extrabold">{((100 - universityHealth.overallBurnRate) > 0 ? (100 - universityHealth.overallBurnRate).toFixed(1) : 0)}%</span>
              </div>
              <div className="text-[10px] text-violet-300/70 mt-1 truncate">สภาพคล่องพร้อมเบิกจ่ายในปีงบประมาณ</div>
            </div>
          </div>

          {/* Gauge 4: Red Flags & Health Summary */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">โครงการวิกฤต (Red Flags)</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-400">{universityHealth.totalRed}</span>
                <span className="text-xs text-rose-300 font-bold">โครงการต้องเร่งรัด</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold">
                <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {universityHealth.totalGreen} ปกติ</span>
                <span className="text-amber-300 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {universityHealth.totalYellow} เฝ้าระวัง</span>
                <span className="text-rose-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {universityHealth.totalRed} วิกฤต</span>
              </div>
              <div className="text-[10px] text-violet-300/70 mt-1 truncate">รวม {universityHealth.totalProjects} โครงการใน {crossFacultyMatrix?.length || 9} คณะ</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Executive Visual Analytics (Chart.js Section) ── */}
      <div className="space-y-6">
        {/* Local Issues Summary Row (Level 1: 4 ด้านประเด็นการพัฒนาท้องถิ่น) */}
        {localIssues && localIssues.length > 0 && (
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiLayers className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>ภาพรวม 4 ประเด็นการพัฒนาท้องถิ่น (Local Development Issues)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">การติดตามผลสัมฤทธิ์ตามกรอบประเด็นการพัฒนาท้องถิ่น มหาวิทยาลัยราชภัฏบุรีรัมย์</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200 self-start sm:self-auto">
                4 ประเด็นยุทธศาสตร์หลัก
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {localIssues.map((li, idx) => {
                const colors = [
                  { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-200/80', badge: 'bg-violet-100 text-violet-800', bar: 'bg-violet-600' },
                  { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-200/80', badge: 'bg-purple-100 text-purple-800', bar: 'bg-purple-600' },
                  { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-200/80', badge: 'bg-blue-100 text-blue-800', bar: 'bg-blue-600' },
                  { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-200/80', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-600' }
                ];
                const c = colors[idx % colors.length];

                return (
                  <div 
                    key={li.localIssueId || idx}
                    className={`bg-gradient-to-br ${c.bg} p-4 rounded-2xl border ${c.border} space-y-3 flex flex-col justify-between`}
                  >
                    <div className="space-y-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${c.badge}`}>
                        {li.localIssueCode || `LDI${idx + 1}`}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {li.localIssueName}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/50 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600 font-bold">
                        <span>จำนวนโครงการ</span>
                        <span className="text-slate-900 font-black">{li.totalProjects} โครงการ</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 font-bold">
                        <span>งบประมาณรวม</span>
                        <span className="text-slate-900 font-black">{parseFloat(li.totalBudget || 0).toLocaleString()} ฿</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black">
                          <span className="text-slate-500">ความก้าวหน้ารวม</span>
                          <span className="text-emerald-700">{li.progressPct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                          <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(li.progressPct, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 1: Budget by Strategy (Grouped Bar) & Strategic Proportion (Donut) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Grouped Bar - Budget Allocation vs Actual Spent */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiBarChart2 className="w-4 h-4 text-primary shrink-0" />
                  <span>งบประมาณจัดสรร vs เบิกจ่ายจริง รายยุทธศาสตร์ (Budget Execution)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">เปรียบเทียบงบประมาณตามแผนกับยอดเบิกจ่ายจริงในแต่ละประเด็นยุทธศาสตร์</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#DDD6FE]"></span>
                  <span>จัดสรรตามแผน</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6C3BFF]"></span>
                  <span>เบิกจ่ายจริง</span>
                </span>
              </div>
            </div>
            <div className="h-72 w-full">
              <Bar
                data={{
                  labels: (strategicPillars || []).map((s, idx) => s.strategyCode || `S${idx + 1}`),
                  datasets: [
                    {
                      label: 'งบประมาณจัดสรรตามแผน (฿)',
                      data: (strategicPillars || []).map(s => s.totalBudget || 0),
                      backgroundColor: '#DDD6FE',
                      borderRadius: 8,
                      barPercentage: 0.6,
                      categoryPercentage: 0.7
                    },
                    {
                      label: 'งบประมาณเบิกจ่ายจริง (฿)',
                      data: (strategicPillars || []).map(s => s.totalSpent || 0),
                      backgroundColor: '#6C3BFF',
                      borderRadius: 8,
                      barPercentage: 0.6,
                      categoryPercentage: 0.7
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        font: { family: "'Prompt', sans-serif", size: 11, weight: 'bold' },
                        usePointStyle: true,
                        boxWidth: 8
                      }
                    },
                    tooltip: {
                      backgroundColor: '#1E1B4B',
                      padding: 12,
                      cornerRadius: 10,
                      callbacks: {
                        title: (ctx) => {
                          const idx = ctx[0]?.dataIndex;
                          const pillar = (strategicPillars || [])[idx];
                          return `${pillar?.strategyCode || `S${idx + 1}`}: ${pillar?.strategyName || ''}`;
                        },
                        label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} บาท`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: {
                        font: { family: "'Prompt', sans-serif", size: 11, weight: '700' },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false
                      }
                    },
                    y: {
                      grid: { color: '#F1F5F9' },
                      ticks: {
                        font: { family: "'Prompt', sans-serif", size: 10 },
                        callback: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    }
                  }
                }}
              />
            </div>

            {/* 💡 Strategy Summary Table (Clean, Compact, Non-cluttered) */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FiBookmark className="w-3.5 h-3.5 text-primary" />
                  <span>ตารางสรุปผลสัมฤทธิ์รายยุทธศาสตร์</span>
                </div>
                <span className="text-slate-500 font-semibold">{strategicPillars.length} ประเด็นยุทธศาสตร์</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
                <table className="w-full text-xs text-left border-collapse min-w-[580px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="py-2.5 px-3">ยุทธศาสตร์</th>
                      <th className="py-2.5 px-2.5 text-center">โครงการ</th>
                      <th className="py-2.5 px-3 text-right">งบประมาณจัดสรร</th>
                      <th className="py-2.5 px-3 text-right">เบิกจ่ายจริง</th>
                      <th className="py-2.5 px-3 text-center">ความก้าวหน้า</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(strategicPillars || []).map((s, idx) => {
                      const burnRatePct = s.totalBudget > 0 ? ((s.totalSpent / s.totalBudget) * 100).toFixed(1) : 0;
                      return (
                        <tr key={s.strategyId || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0">
                                {s.strategyCode || `S${idx + 1}`}
                              </span>
                              <span className="font-bold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-[280px]" title={s.strategyName}>
                                {s.strategyName}
                              </span>
                            </div>
                            {s.localIssueName && (
                              <div className="text-[9.5px] text-slate-400 font-semibold mt-0.5 pl-7">
                                🌐 {s.localIssueCode ? `${s.localIssueCode}: ` : ''}{s.localIssueName}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap font-bold text-slate-700">
                            {s.totalProjects} <span className="text-slate-400 font-normal text-[10px]">โครงการ</span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-700">
                            {Number(s.totalBudget || 0).toLocaleString()} ฿
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span className="font-black text-slate-900">{Number(s.totalSpent || 0).toLocaleString()} ฿</span>
                            <span className="ml-1.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                              {burnRatePct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${s.progressPct >= 75 ? 'bg-emerald-500' : s.progressPct >= 40 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                                  style={{ width: `${Math.min(100, s.progressPct)}%` }} 
                                />
                              </div>
                              <span className="font-black text-slate-800 text-[11px] w-8 text-right">
                                {s.progressPct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Chart 2: Strategic Proportion Donut */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 flex flex-col justify-start">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiPieChart className="w-4 h-4 text-violet-600 shrink-0" />
                <span>สัดส่วนโครงการตามยุทธศาสตร์</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">การกระจายตัวของจำนวนโครงการในแต่ละยุทธศาสตร์</p>
            </div>
            
            <div className="pt-3 flex flex-col items-center">
              {/* Donut Circle */}
              <div className="h-56 w-full relative flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: (strategicPillars || []).map((s, idx) => s.strategyCode || `ยุทธศาสตร์ที่ ${idx + 1}`),
                    datasets: [
                      {
                        data: (strategicPillars || []).map(s => s.totalProjects || 0),
                        backgroundColor: ['#6C3BFF', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
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
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: '#1E1B4B',
                        callbacks: {
                          title: (ctx) => {
                            const idx = ctx[0]?.dataIndex;
                            const pillar = (strategicPillars || [])[idx];
                            return `${pillar?.strategyCode || `S${idx + 1}`}: ${pillar?.strategyName || ''}`;
                          },
                          label: (ctx) => {
                            const total = universityHealth.totalProjects || 1;
                            const pct = ((ctx.raw / total) * 100).toFixed(1);
                            return ` สัดส่วน: ${ctx.raw} โครงการ (${pct}%)`;
                          }
                        }
                      }
                    },
                    cutout: '68%'
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">โครงการทั้งหมด</span>
                  <span className="text-3xl font-black text-slate-800 tracking-tight">{universityHealth.totalProjects}</span>
                  <span className="text-[11px] font-bold text-slate-500">โครงการ</span>
                </div>
              </div>

              {/* Clean Legend Badges right below Donut Circle */}
              <div className="w-full mt-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5 text-xs">
                  {(strategicPillars || []).map((s, idx) => {
                    const colors = [
                      { dot: 'bg-[#6C3BFF]', text: 'text-[#6C3BFF]', bg: 'bg-purple-50' },
                      { dot: 'bg-[#3B82F6]', text: 'text-blue-600', bg: 'bg-blue-50' },
                      { dot: 'bg-[#10B981]', text: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { dot: 'bg-[#F59E0B]', text: 'text-amber-600', bg: 'bg-amber-50' },
                      { dot: 'bg-[#EC4899]', text: 'text-pink-600', bg: 'bg-pink-50' },
                      { dot: 'bg-[#8B5CF6]', text: 'text-violet-600', bg: 'bg-violet-50' }
                    ];
                    const c = colors[idx % colors.length];
                    const totalUniv = universityHealth.totalProjects || 1;
                    const pct = ((s.totalProjects / totalUniv) * 100).toFixed(1);

                    return (
                      <div 
                        key={s.strategyId || idx} 
                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg ${c.bg} border border-slate-200/50 shadow-3xs font-extrabold text-[11px]`}
                        title={s.strategyName}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                          <span className="text-slate-700 truncate">ยุทธศาสตร์ {idx + 1}:</span>
                        </div>
                        <span className={`${c.text} ml-1 font-black shrink-0`}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Faculty Performance Ranking (Horizontal Bar) & Quarterly Cumulative Trend (Line) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Horizontal Bar - Faculty Ranking & Budget Summary */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>จัดอันดับความก้าวหน้า (% Progress) & งบประมาณรายคณะ</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">เรียงลำดับผลการดำเนินงานและสถิติการเบิกจ่ายงบประมาณสะสม</p>
              </div>
            </div>
            
            {(() => {
              const sorted = [...(crossFacultyMatrix || [])].sort((a, b) => b.progressPct - a.progressPct);
              return (
                <>
                  <div className="h-72 w-full">
                    <Bar
                      data={{
                        labels: sorted.map(f => f.facultyName?.replace('คณะ', '') || 'ส่วนกลาง'),
                        datasets: [
                          {
                            label: '% ความก้าวหน้ารวม',
                            data: sorted.map(f => f.progressPct || 0),
                            backgroundColor: sorted.map(f => 
                              f.progressPct >= 75 ? '#10B981' : f.progressPct >= 40 ? '#F59E0B' : '#EF4444'
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
                            backgroundColor: '#0F172A',
                            padding: 12,
                            cornerRadius: 12,
                            titleFont: { family: "'Prompt', sans-serif", size: 12, weight: 'bold' },
                            bodyFont: { family: "'Prompt', sans-serif", size: 11 },
                            callbacks: {
                              title: (ctx) => {
                                const idx = ctx[0]?.dataIndex;
                                const f = sorted[idx];
                                return `🏛️ ${f?.facultyName?.startsWith('คณะ') ? f?.facultyName : `คณะ${f?.facultyName || ''}`}`;
                              },
                              afterTitle: (ctx) => {
                                const idx = ctx[0]?.dataIndex;
                                const f = sorted[idx];
                                return [
                                  `รวมงบประมาณคณะ: ${Number(f?.totalBudget || 0).toLocaleString()} ฿`,
                                  `เบิกจ่ายสะสม: ${Number(f?.totalSpent || 0).toLocaleString()} ฿ (${f?.burnRatePct || 0}%)`,
                                  `ความก้าวหน้ายุทธศาสตร์: ${f?.progressPct || 0}%`
                                ];
                              },
                              label: () => ''
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
                            ticks: { font: { family: "'Prompt', sans-serif", size: 11, weight: 'bold' } }
                          }
                        }
                      }}
                    />
                  </div>
                </>
              );
            })()}
          </div>

          {/* Chart 4: Line Chart - Quarterly Cumulative Burn-down Trend */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>แนวโน้มการเบิกจ่ายสะสมรายไตรมาส (Quarterly Burn-down)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">เทียบผลการเบิกจ่ายจริงกับเป้าหมายมาตรฐานของสำนักงบประมาณ</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <Line
                data={{
                  labels: ['ไตรมาส 1 (ต.ค.-ธ.ค.)', 'ไตรมาส 2 (ม.ค.-มี.ค.)', 'ไตรมาส 3 (เม.ย.-มิ.ย.)', 'ไตรมาส 4 (ก.ค.-ก.ย.)'],
                  datasets: [
                    {
                      label: 'เป้าหมายมาตรฐานสำนักงบประมาณ (%)',
                      data: [25, 50, 75, 100],
                      borderColor: '#94A3B8',
                      borderDash: [5, 5],
                      borderWidth: 2,
                      pointRadius: 4,
                      pointBackgroundColor: '#94A3B8',
                      fill: false,
                      tension: 0.2
                    },
                    {
                      label: '% อัตราการเบิกจ่ายจริง (Burn Rate)',
                      data: [
                        Math.min(universityHealth.overallBurnRate, 30),
                        Math.min(universityHealth.overallBurnRate, 60),
                        universityHealth.overallBurnRate,
                        null
                      ],
                      borderColor: '#6C3BFF',
                      backgroundColor: 'rgba(108, 59, 255, 0.08)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.3,
                      pointBackgroundColor: '#6C3BFF',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 6
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        font: { family: "'Prompt', sans-serif", size: 11, weight: 'bold' },
                        usePointStyle: true,
                        boxWidth: 8
                      }
                    },
                    tooltip: {
                      backgroundColor: '#1E1B4B',
                      callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { family: "'Prompt', sans-serif", size: 10 } }
                    },
                    y: {
                      max: 100,
                      grid: { color: '#F1F5F9' },
                      ticks: {
                        font: { family: "'Prompt', sans-serif", size: 10 },
                        callback: (v) => `${v}%`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 10 Main Projects Strategic Tracking & Drill-down */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4 print:border-slate-300 print-break-inside-avoid">
        {/* Header with Title & Quick RAG Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 print:border-slate-300">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-100 text-primary">
                <FiLayers className="w-4 h-4 shrink-0" />
              </span>
              <span>ตารางกำกับติดตาม 10 โครงการหลักระดับมหาวิทยาลัย (10 Main Projects Strategic Tracking)</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              ติดตามความก้าวหน้าและการเบิกจ่ายงบประมาณของ 10 โครงการหลักตามกรอบยุทธศาสตร์
            </p>
          </div>

          {/* Quick RAG Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap no-print">
            <button
              type="button"
              onClick={() => setMpFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mpFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              ทั้งหมด ({(mainProjects || []).length})
            </button>
            <button
              type="button"
              onClick={() => setMpFilter('GREEN')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mpFilter === 'GREEN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>ปกติ ({(mainProjects || []).filter(m => m.overallStatus === 'GREEN').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMpFilter('YELLOW')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mpFilter === 'YELLOW'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>เฝ้าระวัง ({(mainProjects || []).filter(m => m.overallStatus === 'YELLOW').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMpFilter('RED')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mpFilter === 'RED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>วิกฤต ({(mainProjects || []).filter(m => m.overallStatus === 'RED').length})</span>
            </button>
          </div>
        </div>

        {/* Standard Column Header Bar for Desktop */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2 bg-slate-100/80 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider">
          <div className="flex-1 min-w-0 pr-4">รหัส & ชื่อโครงการหลัก (Main Project - MP)</div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-24 text-center">โครงการย่อย</div>
            <div className="w-40 text-right">งบประมาณ / เบิกจ่าย</div>
            <div className="w-24 text-center">% ความก้าวหน้า</div>
            <div className="w-20 text-center">สถานะ RAG</div>
            <div className="w-8 text-center"></div>
          </div>
        </div>

        {/* List of 10 Main Projects */}
        <div className="space-y-2.5">
          {(mainProjects || [])
            .filter(m => {
              if (mpFilter === 'GREEN') return m.overallStatus === 'GREEN';
              if (mpFilter === 'YELLOW') return m.overallStatus === 'YELLOW';
              if (mpFilter === 'RED') return m.overallStatus === 'RED';
              return true;
            })
            .map((mp) => {
              const isExpanded = expandedMainProjectId === mp.id;
              const statusConfig = {
                GREEN: { label: 'ปกติ', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
                YELLOW: { label: 'เฝ้าระวัง', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', border: 'border-l-amber-400' },
                RED: { label: 'วิกฤต', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', border: 'border-l-rose-500' },
                GRAY: { label: 'ยังไม่มีโครงการ', badge: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-400', border: 'border-l-slate-300' }
              }[mp.overallStatus] || { label: 'ปกติ', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', border: 'border-l-emerald-500' };

              return (
                <div 
                  key={mp.id}
                  className={`rounded-xl border border-l-4 ${statusConfig.border} transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'border-t-primary/30 border-r-primary/30 border-b-primary/30 shadow-md bg-white' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-white'
                  }`}
                >
                  {/* Main Project Header Row */}
                  <div 
                    onClick={() => setExpandedMainProjectId(isExpanded ? null : mp.id)}
                    className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none group"
                  >
                    {/* Left: Code, Title, Clean Breadcrumb */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-3xs shrink-0 mt-0.5">
                        {mp.code}
                      </span>
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="font-bold text-[13px] text-slate-800 group-hover:text-primary transition-colors leading-snug break-words">
                          {mp.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
                          <span className="text-slate-600 font-semibold truncate">{mp.localIssueCode ? `${mp.localIssueCode}: ${mp.localIssueName}` : mp.localIssueName}</span>
                          <span className="text-slate-300 font-bold">›</span>
                          <span className="text-purple-600 font-semibold truncate">{mp.subStrategyCode ? `${mp.subStrategyCode}: ${mp.subStrategyName}` : mp.subStrategyName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Uniform Fixed-Width Columns */}
                    <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100">
                      {/* Projects Count */}
                      <div className="w-24 text-left lg:text-center">
                        <div className="text-[9.5px] font-bold text-slate-400 uppercase lg:hidden">โครงการปฏิบัติการ</div>
                        <span className="text-xs font-extrabold text-slate-800">{mp.totalProjects}</span> <span className="text-[10.5px] text-slate-400 font-medium">โครงการ</span>
                      </div>

                      {/* Budget & Spent */}
                      <div className="w-40 text-left lg:text-right">
                        <div className="text-[9.5px] font-bold text-slate-400 uppercase lg:hidden">งบประมาณ / เบิกจ่าย</div>
                        <div className="text-xs font-black text-slate-900">{mp.totalBudget.toLocaleString()} ฿</div>
                        <div className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                          จ่าย <span className="font-bold text-slate-700">{mp.totalSpent.toLocaleString()} ฿</span> <span className={mp.burnRatePct > 90 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>({mp.burnRatePct}%)</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-24 text-center">
                        <div className="flex items-center justify-between text-[9.5px] font-bold mb-0.5">
                          <span className="text-slate-400">ก้าวหน้า</span>
                          <span className="text-primary font-black">{mp.progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${mp.progressPct < 40 ? 'bg-rose-500' : mp.progressPct < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, mp.progressPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="w-20 flex justify-center">
                        <span className={`inline-flex items-center justify-center gap-1 w-full py-0.5 rounded-lg text-[9.5px] font-black border shadow-3xs ${statusConfig.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                          <span className="truncate">{statusConfig.label}</span>
                        </span>
                      </div>

                      {/* Toggle Button */}
                      <div className="w-8 flex justify-center">
                        <div className={`p-1.5 rounded-lg text-slate-400 transition-all duration-200 ${isExpanded ? 'bg-purple-100 text-primary rotate-180' : 'group-hover:bg-slate-100 group-hover:text-slate-700'}`}>
                          <FiChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Inner Projects Table (Drill-down) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                      {mp.projects && mp.projects.length > 0 ? (
                        <div className="rounded-xl border border-slate-200/80 bg-white overflow-x-auto shadow-xs">
                          <table className="w-full text-[11px] text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-50/90 border-b border-slate-100 text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                                <th className="py-2.5 px-3.5">ชื่อโครงการปฏิบัติการย่อย (Operational Project)</th>
                                <th className="py-2.5 px-3 w-44">คณะ / ภาควิชา</th>
                                <th className="py-2.5 px-3 w-36">ผู้รับผิดชอบโครงการ</th>
                                <th className="py-2.5 px-3 w-28 text-right">งบประมาณ</th>
                                <th className="py-2.5 px-3 w-28 text-right">เบิกจ่ายจริง</th>
                                <th className="py-2.5 px-3 w-24 text-center">% ก้าวหน้า</th>
                                <th className="py-2.5 px-3 w-16 text-center">ดูข้อมูล</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {mp.projects.map((subP) => (
                                <tr key={subP.id} className="hover:bg-purple-50/30 transition-colors">
                                  <td className="py-2.5 px-3.5 font-bold text-slate-800 leading-snug break-words">
                                    {subP.name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-700 text-[11px]">{subP.facultyName}</div>
                                    <div className="text-[9.5px] text-slate-400 font-medium">{subP.departmentName}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="text-[10.5px] font-medium text-slate-600 flex items-center gap-1">
                                      <FiUser className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{subP.creatorName}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                    {subP.totalBudget.toLocaleString()} ฿
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                                    {subP.actualSpent.toLocaleString()} ฿
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <div className="font-black text-primary text-[11px]">{subP.progress}%</div>
                                    <div className="w-14 bg-slate-100 h-1.5 rounded-full mx-auto mt-0.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${subP.progress < 40 ? 'bg-rose-500' : subP.progress < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, subP.progress)}%` }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetailModal(subP);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-slate-600 transition-all cursor-pointer shadow-3xs active:scale-95"
                                      title="ดูรายละเอียดโครงการและออกข้อสั่งการ"
                                    >
                                      <FiEye className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-slate-400 text-xs font-medium bg-white rounded-xl border border-dashed border-slate-200">
                          ยังไม่มีคณะใดส่งข้อเสนอโครงการปฏิบัติการภายใต้โครงการหลักนี้
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 3.5. Cross-Faculty Strategic Heatmap Matrix (Comparative Exception Tracker) */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4 print:border-slate-300 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 print:border-slate-300">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FiGrid className="w-5 h-5 text-primary shrink-0" />
              <span>ตารางเปรียบเทียบผลงานตามคณะ/สำนัก (Cross-Faculty Strategic Heatmap)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">ตารางประเมินเปรียบเทียบ % ความก้าวหน้ายุทธศาสตร์ % การใช้จ่ายงบประมาณ และจำนวนจุดวิกฤตจำแนกรายคณะ</p>
          </div>

          {/* Toggle show all faculties / only active */}
          {(crossFacultyMatrix || []).some(f => f.totalProjects === 0) && (
            <button
              type="button"
              onClick={() => setShowAllFaculties(!showAllFaculties)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer shrink-0 self-start sm:self-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-3xs active:scale-95 no-print"
            >
              <FiFilter className="w-3.5 h-3.5 text-primary" />
              <span>{showAllFaculties ? 'แสดงเฉพาะคณะที่มีโครงการ' : `แสดงทุกคณะ (${crossFacultyMatrix.length})`}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto print:overflow-visible scrollbar-thin">
          {(() => {
            const activeFaculties = (crossFacultyMatrix || []).filter(f => f.totalProjects > 0);
            // In print mode, always display all faculties for complete institutional records
            const displayedFaculties = crossFacultyMatrix && crossFacultyMatrix.length > 0 ? crossFacultyMatrix : activeFaculties;

            return (
              <table className="w-full text-xs text-left border-collapse print:text-[11px] min-w-[760px] print:min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] print:bg-slate-100 print:text-slate-800">
                    <th className="py-3 px-3">คณะ / สำนัก</th>
                    <th className="py-3 px-3 w-28 text-center">จำนวนโครงการ</th>
                    <th className="py-3 px-3 w-32 text-right">งบประมาณจัดสรร</th>
                    <th className="py-3 px-3 w-32 text-right">เบิกจ่ายจริง</th>
                    <th className="py-3 px-3 w-28 text-center">% ความก้าวหน้า</th>
                    <th className="py-3 px-3 w-24 text-center">% Burn Rate</th>
                    <th className="py-3 px-3 w-40 text-center">สถานะโครงการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {displayedFaculties.map((fac) => {
                    const facName = fac.facultyName || 'ส่วนกลาง';
                    const formattedFac = (!facName || facName === 'ส่วนกลาง' || facName.startsWith('คณะ')) ? facName : `คณะ${facName}`;

                    return (
                      <tr 
                        key={fac.facultyId} 
                        onClick={() => handleFacultyClick(fac.facultyId, formattedFac)}
                        className="hover:bg-slate-50 hover:shadow-3xs cursor-pointer transition-colors group align-middle"
                        title={`คลิกเพื่อดูรายการโครงการของ ${formattedFac}`}
                      >
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 group-hover:text-primary transition-colors flex items-center gap-2 whitespace-nowrap">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${fac.overallStatus === 'RED' ? 'bg-rose-500' : fac.overallStatus === 'YELLOW' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                          <span>{formattedFac}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                          {fac.totalProjects} โครงการ
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 whitespace-nowrap">
                          {fac.totalBudget.toLocaleString()} ฿
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                          {fac.totalSpent.toLocaleString()} ฿
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="font-extrabold text-slate-800">{fac.progressPct}%</div>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${fac.progressPct < 40 ? 'bg-rose-500' : fac.progressPct < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, fac.progressPct)}%` }} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-700 whitespace-nowrap">
                          {fac.burnRatePct}%
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">🟢 {fac.greenCount} ปกติ</span>
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">🟡 {fac.yellowCount} เฝ้าระวัง</span>
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">🔴 {fac.redCount} วิกฤต</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* 4. Critical Bottleneck Alerts Panel (Top Flagship Red Projects) */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4 print:border-slate-300 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 print:border-slate-300">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-100 text-rose-600">
                <FiAlertTriangle className="w-5 h-5 shrink-0" />
              </span>
              <span>โครงการติดธงแดงวิกฤตที่ต้องเร่งรัด (Critical Red Flag Projects)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              โครงการที่มีความล่าช้ากว่าแผน หรือมีผลการดำเนินงานต่ำกว่าเกณฑ์มาตรฐาน จำเป็นต้องได้รับการสนับสนุนหรือสั่งการแก้ไข
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 no-print">
            <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl shadow-3xs">
              🔴 วิกฤต {(criticalBottlenecks || []).length} โครงการ
            </span>
          </div>
        </div>

        {(criticalBottlenecks && criticalBottlenecks.length > 0) ? (
          <div className="overflow-x-auto print:overflow-visible scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse print:text-[11px] min-w-[700px] print:min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] print:bg-slate-100 print:text-slate-800">
                  <th className="py-3 px-3">ชื่อโครงการ / ผู้รับผิดชอบ</th>
                  <th className="py-3 px-3 w-40">คณะ / ภาควิชา</th>
                  <th className="py-3 px-3 w-28 text-right">งบประมาณ</th>
                  <th className="py-3 px-3 w-28 text-right">เบิกจ่ายจริง</th>
                  <th className="py-3 px-3 w-24 text-center">% ก้าวหน้า</th>
                  <th className="py-3 px-3 w-24 text-center">ข้อสั่งการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {criticalBottlenecks.map((p) => {
                  const hasDirective = !!(p.presidentDirective || p.executiveDirective);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group align-middle">
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-snug">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <FiUser className="w-3 h-3 shrink-0" />
                          <span>{p.creatorName || 'ไม่ระบุผู้รับผิดชอบ'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-700 text-xs">{p.facultyName || 'ส่วนกลาง'}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{p.departmentName || 'ไม่ระบุภาควิชา'}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-800 whitespace-nowrap">
                        {p.totalBudget?.toLocaleString()} ฿
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                        {p.actualSpent?.toLocaleString()} ฿
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="font-black text-rose-600">{p.progressPct}%</div>
                        <div className="w-14 bg-slate-100 h-1.5 rounded-full mx-auto mt-0.5 overflow-hidden print:hidden">
                          <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, p.progressPct)}%` }} />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center print:text-left whitespace-nowrap">
                        {/* Screen Button */}
                        <div className="print:hidden flex justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectModal(p)}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm ${hasDirective ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'}`}
                            title="ดูรายละเอียดและออกข้อสั่งการอธิการบดี"
                          >
                            <FiSend className="w-3 h-3 shrink-0" />
                            <span>{hasDirective ? 'ดูสั่งการ' : 'สั่งการ'}</span>
                          </button>
                        </div>
                        {/* Print Directive Text */}
                        <div className="hidden print:block text-[10px] font-semibold text-slate-800 max-w-[200px] break-words">
                          {hasDirective ? (
                            <span>"{p.presidentDirective || p.executiveDirective}"</span>
                          ) : (
                            <span className="text-slate-400 italic">อยู่ระหว่างติดตามและประสานงาน</span>
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
            <div className="text-sm font-extrabold text-slate-700">ไม่มีโครงการสำคัญระดับมหาวิทยาลัยติดสถานะวิกฤต</div>
            <div className="text-xs text-slate-400 mt-0.5">การดำเนินงานตามแผนยุทธศาสตร์ภาพรวมของมหาวิทยาลัยเป็นไปอย่างราบรื่น</div>
          </div>
        )}
      </div>

      {/* 4.5 Recent Activity Photos (Evidence-based Executive Gallery with Faculty Filter) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-5">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
              <span>คลังภาพกิจกรรมความสำเร็จล่าสุด (Recent Activity Photos)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">ภาพถ่ายหน้างานจริงและหลักฐานเชิงประจักษ์ของการจัดโครงการและกิจกรรมต่าง ๆ ทั่วทั้งมหาวิทยาลัย</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Faculty Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-500 hidden sm:inline">กรองสังกัด:</span>
              <CustomSelect
                value={selectedPhotoFaculty}
                onChange={(val) => {
                  setSelectedPhotoFaculty(val);
                  setActivePhotoIndex(null);
                }}
                options={[
                  { value: '', label: '🏛️ ทุกคณะวิชา (ภาพรวมสถาบัน)' },
                  ...facultiesList.map(f => ({
                    value: String(f.id),
                    label: f.name.startsWith('คณะ') ? f.name : `คณะ${f.name}`
                  }))
                ]}
                triggerClassName="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between gap-2 min-w-[210px] cursor-pointer"
                optionsClassName="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto min-w-[230px]"
              />
            </div>

            {filteredPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePhotoIndex(0)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-50 hover:bg-violet-100 text-primary rounded-xl font-extrabold text-xs transition-all border border-violet-200/70 shadow-3xs cursor-pointer active:scale-95 shrink-0"
                title="เปิดดูสไลด์ภาพทั้งหมดแบบเต็มจอ"
              >
                <FiMaximize2 className="w-3.5 h-3.5" />
                <span>เปิดดูสไลด์ ({filteredPhotos.length} ภาพ)</span>
              </button>
            )}
          </div>
        </div>

        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredPhotos.map((photo, index) => {
              const facName = photo.facultyName || 'ส่วนกลาง';
              const formattedFac = (!facName || facName === 'ส่วนกลาง' || facName.startsWith('คณะ')) ? facName : `คณะ${facName}`;

              return (
                <div 
                  key={photo.id || index} 
                  onClick={() => setActivePhotoIndex(index)}
                  className="bg-white rounded-3xl border border-slate-100 hover:border-violet-200 shadow-soft hover:shadow-xl transition-all duration-300 active:scale-[0.98] overflow-hidden flex flex-col justify-between cursor-pointer group h-full"
                >
                  {/* 1. Unobstructed Pure Photo Container (Fixed 16:10 Ratio) */}
                  <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-slate-900">
                    <img 
                      src={getImageUrl(photo.imageUrl)} 
                      alt={photo.activityName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
                      }}
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
                      {/* Faculty Badge Tag (Fixed h-6) */}
                      <div className="h-6 flex items-center">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100/80 shadow-3xs truncate max-w-[95%] inline-block" title={formattedFac}>
                          🏛️ {formattedFac}
                        </span>
                      </div>

                      {/* Activity Title (Fixed h-10 for 2-line consistency) */}
                      <div className="h-10 flex items-start overflow-hidden">
                        <h4 className="font-extrabold text-slate-800 text-xs group-hover:text-primary transition-colors leading-snug line-clamp-2" title={photo.activityName}>
                          {photo.activityName}
                        </h4>
                      </div>
                    </div>

                    {/* Department Tag at Bottom (Fixed h-7) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] h-7 shrink-0">
                      <span className="font-semibold text-slate-500 truncate max-w-[85%]" title={photo.departmentName}>
                        {photo.departmentName || 'ไม่ระบุภาควิชา'}
                      </span>
                      <span className="text-slate-400 group-hover:text-primary transition-colors text-xs shrink-0">
                        <FiEye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="text-sm font-extrabold text-slate-700">ไม่พบภาพกิจกรรมในคณะที่เลือก</div>
            <div className="text-xs text-slate-400 mt-0.5">ท่านสามารถเลือกคณะอื่น หรือเลือก "ทุกคณะวิชา" เพื่อดูภาพกิจกรรมทั้งหมดของมหาวิทยาลัย</div>
          </div>
        )}
      </div>

      {/* Lightbox Modal (Full Gallery View - Preserves 100% Original Photo Dimensions) */}
      {activePhotoIndex !== null && filteredPhotos[activePhotoIndex] && (() => {
        const activePhoto = filteredPhotos[activePhotoIndex];
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
                    src={getImageUrl(activePhoto.imageUrl)} 
                    alt={activePhoto.activityName} 
                    className="max-w-full max-h-[66vh] object-contain rounded-xl shadow-2xl animate-fadeIn select-none" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>
                
                {/* Thumbnails list at the bottom of image container */}
                {filteredPhotos.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 max-w-full overflow-x-auto py-1 px-2 select-none z-50">
                    {filteredPhotos.map((img, idx) => {
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
                          <img 
                            src={getImageUrl(img.imageUrl)} 
                            alt="thumbnail" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="md:w-2/5 p-8 flex flex-col justify-between text-white space-y-6 md:h-full md:overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black bg-violet-600/40 text-violet-200 px-3 py-1 rounded-full border border-violet-500/30 uppercase tracking-wider">
                        {activePhoto.facultyName || 'มหาวิทยาลัย'}
                      </span>
                      <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 uppercase tracking-wider">
                        {activePhoto.departmentName}
                      </span>
                    </div>
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
                <div className="border-t border-slate-800 pt-5 flex items-center justify-between text-slate-450 text-[10px] font-black tracking-wide">
                  <span>{activePhoto.facultyName}</span>
                  <span>{new Date(activePhoto.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Faculty Projects List Modal */}
      {selectedFacultyName && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => { setSelectedFacultyName(''); setFacultyProjects(null); }}
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
                      รายการโครงการยุทธศาสตร์ของ {selectedFacultyName}
                    </h3>
                    {facultyProjects && (
                      <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-extrabold border border-violet-200">
                        {facultyProjects.length} โครงการ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ปีงบประมาณ พ.ศ. {selectedFiscalYear ? fiscalYears.find(y => String(y.id) === String(selectedFiscalYear))?.year : 'ทั้งหมด'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedFacultyName(''); setFacultyProjects(null); }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingFacultyProjects ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : facultyProjects && facultyProjects.length > 0 ? (
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
                      {facultyProjects.map((p) => {
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
                  <div className="text-xs text-slate-400 mt-0.5">ไม่พบรายชื่อโครงการของคณะนี้ตามปีงบประมาณที่กำหนด</div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Layer 2: Interactive Quick View Modal */}
      {selectedProjectModal && (
        <ExecutiveProjectModal
          project={selectedProjectModal}
          onClose={() => setSelectedProjectModal(null)}
          onProjectUpdated={() => fetchPresidentData()}
        />
      )}
      </div>

      {/* 📄 2. Official Executive Strategic Report Document (Official A4 PDF / Print Format) */}
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
                <h2 className="text-[11px] font-bold text-slate-700">รายงานสรุปผลการดำเนินงานและการใช้จ่ายงบประมาณตามแผนยุทธศาสตร์สถาบัน</h2>
                <div className="text-[9px] text-slate-500 font-medium">ระบบติดตามและประเมินผลเชิงยุทธศาสตร์มหาวิทยาลัย (BRU Strategic Tracking System)</div>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-700 space-y-0.5 font-medium border-l border-slate-300 pl-2.5">
              <div><span className="font-bold">ปีงบประมาณ:</span> {selectedFiscalYear ? `พ.ศ. ${fiscalYears.find(f => String(f.id) === selectedFiscalYear)?.year || selectedFiscalYear}` : 'ทุกปีงบประมาณ'}</div>
              <div><span className="font-bold">แหล่งงบประมาณ:</span> {selectedBudgetSource ? budgetSources.find(b => String(b.id) === selectedBudgetSource)?.name : 'ทุกแหล่งงบประมาณ'}</div>
              <div><span className="font-bold">วันที่ออกเอกสาร:</span> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</div>
              <div><span className="font-bold">ผู้ออกรายงาน:</span> {user?.name || 'อธิการบดี'}</div>
            </div>
          </div>
        </div>

        {/* Section 1: สรุปภาพรวมสถานะยุทธศาสตร์สถาบัน (Executive Summary KPI Box) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            1. สรุปภาพรวมตัวชี้วัดยุทธศาสตร์และการเงิน (Executive Health Summary)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">ความก้าวหน้ายุทธศาสตร์รวม</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{universityHealth.overallProgress}% <span className="text-[9px] font-normal text-slate-500">(ของเป้าหมายสถาบัน)</span></td>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">งบประมาณจัดสรรรวมทั้งสถาบัน</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{parseFloat(universityHealth.totalBudget || 0).toLocaleString()} <span className="text-[10px] font-normal">บาท</span></td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">การเบิกจ่ายจริงสะสม (Burn Rate)</td>
                <td className="font-bold text-slate-900 py-1 px-2">{parseFloat(universityHealth.totalSpent || 0).toLocaleString()} บาท <span className="text-emerald-700 font-black">({universityHealth.overallBurnRate}%)</span></td>
                <td className="bg-slate-50 font-bold py-1 px-2">งบประมาณคงเหลือสุทธิ</td>
                <td className="font-bold text-slate-900 py-1 px-2">{parseFloat((universityHealth.totalBudget || 0) - (universityHealth.totalSpent || 0)).toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">สถานะสุขภาพโครงการรวม</td>
                <td colSpan="3" className="py-1 px-2">
                  <div className="flex items-center gap-3 font-bold text-[10px]">
                    <span>รวมทั้งหมด <strong className="text-slate-900 font-black">{universityHealth.totalProjects}</strong> โครงการ</span>
                    <span className="text-emerald-700">🟢 ปกติ/ตามแผน: {universityHealth.totalGreen}</span>
                    <span className="text-amber-700">🟡 เฝ้าระวัง: {universityHealth.totalYellow}</span>
                    <span className="text-rose-700">🔴 วิกฤต/ช้ากว่าแผน: {universityHealth.totalRed}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: ผลการดำเนินงานรายประเด็นยุทธศาสตร์ (Strategic Pillars Matrix) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            2. ผลการดำเนินงานจำแนกตามประเด็นยุทธศาสตร์สถาบัน (Strategic Pillars Matrix)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-10 text-center py-1 px-2">ลำดับ</th>
                <th className="text-left py-1 px-2">ประเด็นยุทธศาสตร์</th>
                <th className="w-24 text-center py-1 px-2">จำนวนโครงการ</th>
                <th className="w-28 text-right py-1 px-2">งบประมาณจัดสรร (บาท)</th>
                <th className="w-28 text-right py-1 px-2">เบิกจ่ายจริง (บาท)</th>
                <th className="w-20 text-center py-1 px-2">% ก้าวหน้า</th>
              </tr>
            </thead>
            <tbody>
              {strategicPillars && strategicPillars.length > 0 ? (
                strategicPillars.map((sp, idx) => (
                  <tr key={sp.strategyId || sp.id || idx}>
                    <td className="text-center font-bold py-1 px-2">{idx + 1}</td>
                    <td className="font-semibold text-slate-800 text-left py-1 px-2">
                      {sp.strategyName || sp.name || `ยุทธศาสตร์ที่ ${idx + 1}`}
                    </td>
                    <td className="text-center font-bold py-1 px-2">{sp.totalProjects}</td>
                    <td className="text-right font-medium py-1 px-2">{parseFloat(sp.totalBudget || 0).toLocaleString()}</td>
                    <td className="text-right font-medium py-1 px-2">{parseFloat(sp.totalSpent || 0).toLocaleString()}</td>
                    <td className="text-center font-black text-slate-900 py-1 px-2">{sp.progressPct || 0}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-1.5 text-slate-400 italic">ไม่พบข้อมูลประเด็นยุทธศาสตร์</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: ตารางเปรียบเทียบผลงาน 9 คณะ (Cross-Faculty Matrix) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            3. ผลการดำเนินงานและการใช้จ่ายงบประมาณจำแนกรายคณะ / สำนัก (Cross-Faculty Matrix)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-8 text-center py-1 px-1.5">ลำดับ</th>
                <th className="text-left py-1 px-2">คณะ / สำนัก</th>
                <th className="w-16 text-center py-1 px-1.5">โครงการ</th>
                <th className="w-24 text-right py-1 px-1.5">งบจัดสรร (บาท)</th>
                <th className="w-24 text-right py-1 px-1.5">เบิกจ่ายจริง (บาท)</th>
                <th className="w-16 text-center py-1 px-1.5">% ก้าวหน้า</th>
                <th className="w-16 text-center py-1 px-1.5">% เบิกจ่าย</th>
                <th className="w-24 text-center py-1 px-1.5">สถานะโครงการ</th>
              </tr>
            </thead>
            <tbody>
              {crossFacultyMatrix && crossFacultyMatrix.length > 0 ? (
                crossFacultyMatrix.map((fac, idx) => {
                  const facName = fac.facultyName || 'ส่วนกลาง';
                  const formattedFac = (!facName || facName === 'ส่วนกลาง' || facName.startsWith('คณะ')) ? facName : `คณะ${facName}`;
                  return (
                    <tr key={fac.facultyId || idx}>
                      <td className="text-center font-bold py-1 px-1.5">{idx + 1}</td>
                      <td className="font-semibold text-slate-800 text-left py-1 px-2">{formattedFac}</td>
                      <td className="text-center py-1 px-1.5">{fac.totalProjects}</td>
                      <td className="text-right font-medium py-1 px-1.5">{parseFloat(fac.allocatedBudget || 0).toLocaleString()}</td>
                      <td className="text-right font-medium py-1 px-1.5">{parseFloat(fac.spentBudget || 0).toLocaleString()}</td>
                      <td className="text-center font-bold py-1 px-1.5">{fac.avgProgressPct || 0}%</td>
                      <td className="text-center font-bold py-1 px-1.5">{fac.burnRatePct || 0}%</td>
                      <td className="text-center font-bold text-[9px] py-1 px-1.5">
                        <span className="text-emerald-700">🟢{fac.greenCount || 0} </span>
                        <span className="text-amber-700">🟡{fac.yellowCount || 0} </span>
                        <span className="text-rose-700">🔴{fac.redCount || 0}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-1.5 text-slate-400 italic">ไม่พบข้อมูลจำแนกรายคณะ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: ตารางโครงการสำคัญที่ต้องได้รับการแก้ไขด่วน (Critical Bottlenecks & Directives) */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            4. รายการโครงการสำคัญระดับมหาวิทยาลัยที่ต้องได้รับการแก้ไขด่วน (Critical Bottlenecks & Directives)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-8 text-center py-1 px-1.5">ลำดับ</th>
                <th className="text-left py-1 px-2">ชื่อโครงการวิกฤต</th>
                <th className="w-28 text-left py-1 px-1.5">คณะ / ภาควิชา</th>
                <th className="w-24 text-left py-1 px-1.5">ผู้รับผิดชอบ</th>
                <th className="w-22 text-right py-1 px-1.5">งบประมาณ (บาท)</th>
                <th className="w-16 text-center py-1 px-1.5">% ก้าวหน้า</th>
                <th className="w-40 text-left py-1 px-2">ข้อสั่งการอธิการบดี</th>
              </tr>
            </thead>
            <tbody>
              {criticalBottlenecks && criticalBottlenecks.length > 0 ? (
                criticalBottlenecks.map((p, idx) => {
                  const facName = p.faculty?.name || 'ส่วนกลาง';
                  const formattedFac = (!facName || facName === 'ส่วนกลาง' || facName.startsWith('คณะ')) ? facName : `คณะ${facName}`;
                  return (
                    <tr key={p.id || idx}>
                      <td className="text-center font-bold py-1 px-1.5">{idx + 1}</td>
                      <td className="font-semibold text-slate-800 text-left py-1 px-2">
                        <div>{p.name}</div>
                        <div className="text-[8px] text-slate-400 font-normal">ปีงบประมาณ พ.ศ. {p.fiscalYear?.year}</div>
                      </td>
                      <td className="text-left py-1 px-1.5">
                        <div className="font-medium text-slate-800">{formattedFac}</div>
                        <div className="text-[8px] text-slate-400">{p.department?.name || ''}</div>
                      </td>
                      <td className="font-medium text-slate-700 text-left py-1 px-1.5">{p.creator?.name || 'ไม่ระบุ'}</td>
                      <td className="text-right font-medium py-1 px-1.5">{parseFloat(p.totalBudget || 0).toLocaleString()}</td>
                      <td className="text-center font-black text-rose-700 py-1 px-1.5">{p.progressPct || 0}%</td>
                      <td className="text-slate-800 font-medium text-[9px] text-left py-1 px-2">
                        {p.presidentDirective || p.executiveDirective ? (
                          <span className="text-violet-900 font-semibold">"{p.presidentDirective || p.executiveDirective}"</span>
                        ) : (
                          <span className="text-slate-400 italic">อยู่ระหว่างติดตามและประสานงาน</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-1.5 text-slate-400 italic">ไม่มีโครงการสำคัญระดับมหาวิทยาลัยติดสถานะวิกฤต</td>
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
    </div>
  );
};

export default PresidentDashboard;
