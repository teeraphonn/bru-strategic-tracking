import React, { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
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
  FiFolder, 
  FiActivity, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign, 
  FiTrendingUp, 
  FiTarget,
  FiChevronRight,
  FiEye,
  FiChevronLeft,
  FiGrid,
  FiShield,
  FiServer,
  FiRefreshCw,
  FiDownload,
  FiUsers,
  FiDatabase,
  FiBookmark,
  FiLayers,
  FiAlertTriangle,
  FiPieChart,
  FiBarChart2,
  FiPlus,
  FiPlusCircle,
  FiFilter,
  FiExternalLink,
  FiAlertCircle,
  FiCheck,
  FiInbox,
  FiPrinter
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import CustomSelect from '../../components/CustomSelect';
import PresidentDashboard from '../president/Dashboard';
import DeanDashboard from '../dean/Dashboard';

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

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('system'); // system, president, dean
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [systemHealth, setSystemHealth] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);

  // Filters
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedBudgetSource, setSelectedBudgetSource] = useState('');
  const [budgetSources, setBudgetSources] = useState([]);
  const [pendingIssues, setPendingIssues] = useState([]);

  const fetchSystemHealth = async () => {
    try {
      const res = await api.get('/master/system/health');
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  const fetchPendingIssues = async () => {
    try {
      const res = await api.get('/issues', { params: { status: 'PENDING' } });
      setPendingIssues((res.data?.data || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load pending issues:', err);
    }
  };

  useEffect(() => {
    const fetchMasterFilters = async () => {
      try {
        const [facRes, fyRes, bsRes] = await Promise.all([
          api.get('/master/faculties'),
          api.get('/master/fiscal-years'),
          api.get('/master/budget-sources')
        ]);
        setFaculties(facRes.data || []);
        setFiscalYears(fyRes.data || []);
        setBudgetSources(bsRes.data || []);
      } catch (err) {
        console.error('Failed to load master filters for Admin:', err);
      }
    };
    fetchMasterFilters();
    fetchSystemHealth();
    fetchPendingIssues();
  }, []);

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      const res = await api.post('/master/system/clear-cache');
      Swal.fire({
        icon: 'success',
        title: 'ล้างแคชระบบสำเร็จ',
        text: res.data?.message || 'รีเฟรชข้อมูลและสถานะการเชื่อมต่อล่าสุดเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
      fetchSystemHealth();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถล้างแคชได้' });
    } finally {
      setClearingCache(false);
    }
  };

  const handleExportDashboardReport = async () => {
    try {
      const response = await api.get('/reports/export/pdf?type=university', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Admin_System_Performance_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถสร้างรายงาน PDF ได้' });
    }
  };

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedFiscalYear) params.fiscalYearId = selectedFiscalYear;
      if (selectedBudgetSource) params.budgetSourceId = selectedBudgetSource;
      const response = await api.get('/dashboard', { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('ไม่สามารถเรียกข้อมูลสถิติแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedFiscalYear, selectedBudgetSource]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
        {error}
      </div>
    );
  }

  const { 
    summary = {}, 
    recentProjects = [], 
    recentActivities = [], 
    latestImages = [], 
    charts = { bar: [], pie: [], line: [] } 
  } = data || {};

  const pieList = Array.isArray(charts?.pie) ? charts.pie : [];
  const barList = Array.isArray(charts?.bar) ? charts.bar : [];
  const lineList = Array.isArray(charts?.line) ? charts.line : [];

  const doughnutData = {
    labels: pieList.map(c => c.status),
    datasets: [{
      data: pieList.map(c => c.count),
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 6
    }]
  };

  const totalPieCount = pieList.reduce((sum, c) => sum + (c.count || 0), 0) || summary.totalProjects || 0;

  const barData = {
    labels: barList.map(b => b.unit),
    datasets: [
      {
        label: 'งบประมาณตามแผน',
        data: barList.map(b => b.budget),
        backgroundColor: '#DDD6FE',
        borderRadius: 6,
        barThickness: 16
      },
      {
        label: 'งบประมาณใช้จ่ายจริง',
        data: barList.map(b => b.actual),
        backgroundColor: '#6C3BFF',
        borderRadius: 6,
        barThickness: 16
      }
    ]
  };

  const lineData = {
    labels: lineList.map(l => l.period),
    datasets: [{
      label: 'งบประมาณที่จ่ายจริง (บาท)',
      data: lineList.map(l => l.spent),
      borderColor: '#6C3BFF',
      backgroundColor: 'rgba(108, 59, 255, 0.08)',
      tension: 0.35,
      fill: true,
      pointBackgroundColor: '#6C3BFF',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Dashboard View Switcher (Top-level Navigation) */}
      <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCurrentTab('system')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'system' 
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FiGrid className="w-4 h-4" />
            <span>ศูนย์ควบคุมระบบ (Admin Hub)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('president')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'president' 
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-indigo-600/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FiTrendingUp className="w-4 h-4" />
            <span>มุมมองอธิการบดี (University View)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('dean')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'dean' 
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FiFolder className="w-4 h-4" />
            <span>มุมมองคณบดี (Faculty View)</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-400 px-3 py-1 bg-slate-50 rounded-xl">
          สิทธิ์ผู้ดูแลระบบสูงสุด (Super Admin)
        </div>
      </div>

      {/* Conditionally Render Views */}
      {currentTab === 'president' ? (
        <PresidentDashboard />
      ) : currentTab === 'dean' ? (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">เลือกคณะที่ต้องการตรวจสอบ</h4>
              <p className="text-[10px] text-slate-400 font-semibold">แสดงผลสถิติและสรุปงานในมุมมองคณบดีประจำคณะนั้น</p>
            </div>
            <div className="min-w-[220px]">
              <CustomSelect
                value={selectedFacultyId}
                onChange={(val) => setSelectedFacultyId(val)}
                options={[
                  { value: '', label: 'กรุณาเลือกคณะ...' },
                  ...faculties.map(f => ({ value: String(f.id), label: f.name }))
                ]}
                className="w-full"
              />
            </div>
          </div>
          <DeanDashboard isAdminView={true} selectedFacultyId={selectedFacultyId} />
        </div>
      ) : (
        /* SYSTEM ADMIN VIEW (CLEAN & NON-REDUNDANT) */
        <div className="space-y-6">
          {/* 0. Executive Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-purple-500/20">
            <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-violet-200 border border-white/15">
                  <FiShield className="w-3.5 h-3.5 text-violet-400" />
                  <span>ศูนย์ควบคุมและบริหารจัดการระบบ (Admin Strategic Control Hub)</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  <span>ระบบติดตามยุทธศาสตร์</span>
                  <span className="block mt-1 text-violet-200">มหาวิทยาลัยราชภัฏบุรีรัมย์</span>
                </h1>
                <p className="text-xs md:text-sm text-violet-200/80 font-medium">
                  ศูนย์กลางควบคุมข้อมูลหลัก ตรวจสอบสถานะระบบ และกำกับติดตามผลสัมฤทธิ์ยุทธศาสตร์
                </p>
              </div>

              {/* Quick Actions & Telemetry Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Fiscal Year Filter */}
                <div className="w-full sm:w-auto min-w-[150px]">
                  <CustomSelect
                    value={selectedFiscalYear}
                    onChange={(val) => setSelectedFiscalYear(val)}
                    options={[
                      { value: '', label: 'ทุกปีงบประมาณ' },
                      ...fiscalYears.map(fy => ({ value: String(fy.id), label: `ปีงบประมาณ พ.ศ. ${fy.year}` }))
                    ]}
                    dark={true}
                    triggerClassName="bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 text-xs font-extrabold text-white flex items-center justify-between gap-2 focus:outline-none transition-all cursor-pointer w-full"
                    optionsClassName="absolute right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto w-full md:w-max md:min-w-[170px] text-white animate-fadeIn"
                  />
                </div>

                {/* Budget Source Filter */}
                <div className="w-full sm:w-auto min-w-[145px]">
                  <CustomSelect
                    value={selectedBudgetSource}
                    onChange={(val) => setSelectedBudgetSource(val)}
                    options={[
                      { value: '', label: 'ทุกแหล่งเงินทุน' },
                      ...budgetSources.map(bs => ({ value: String(bs.id), label: bs.name }))
                    ]}
                    dark={true}
                    triggerClassName="bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 text-xs font-extrabold text-white flex items-center justify-between gap-2 focus:outline-none transition-all cursor-pointer w-full"
                    optionsClassName="absolute right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto w-full md:w-max md:min-w-[165px] text-white animate-fadeIn"
                  />
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-emerald-300">DB: {systemHealth?.database || 'CONNECTED'}</span>
                </div>

                <button
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="ล้างแคชระบบและรีเฟรชการเชื่อมต่อ"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${clearingCache ? 'animate-spin' : ''}`} />
                  <span>{clearingCache ? 'กำลังล้างแคช...' : 'ล้างแคช'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-slate-900 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                  title="พิมพ์รายงานสรุปผลงานภาพรวมเป็นเอกสาร PDF"
                >
                  <FiPrinter className="w-4 h-4 text-primary" />
                  <span>พิมพ์รายงานสรุป</span>
                </button>
              </div>
            </div>

            {/* Top Gauges Strip */}
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">ความก้าวหน้าเป้าหมายตัวชี้วัด</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{summary.targetProgressPercentage}%</span>
                    <span className="text-xs text-emerald-400 font-bold">ของเป้าหมายรวม</span>
                  </div>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-400 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, summary.targetProgressPercentage)}%` }} />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">งบประมาณเบิกจ่ายจริง (Burn Rate)</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{summary.budgetPercentage}%</span>
                    <span className="text-xs text-sky-300 font-bold">{summary.totalActualBudget?.toLocaleString('th-TH')} ฿</span>
                  </div>
                </div>
                <div className="text-[10px] text-violet-300/70 mt-2 truncate">จากงบประมาณรวม {summary.totalBudget?.toLocaleString('th-TH')} ฿</div>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">จำนวนโครงการทั้งหมด</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{summary.totalProjects}</span>
                    <span className="text-xs text-violet-300 font-bold">โครงการในระบบ</span>
                  </div>
                </div>
                <div className="text-[10px] text-violet-300/70 mt-2 truncate">
                  กิจกรรมเสร็จสิ้น {summary.completedActivities} / {summary.totalActivities} ({summary.successActivityPercentage}%)
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">สถานะโครงสร้างข้อมูลหลัก</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{systemHealth?.counts?.users || 0}</span>
                    <span className="text-xs text-amber-300 font-bold">ผู้ใช้งาน ({systemHealth?.counts?.faculties || 0} คณะ)</span>
                  </div>
                </div>
                <div className="text-[10px] text-violet-300/70 mt-2 truncate">
                  {systemHealth?.counts?.departments || 0} ภาควิชา | {pendingIssues.length} คำร้องรอดำเนินการ
                </div>
              </div>
            </div>
          </div>
          {/* Master Data Quick Status Cards */}
          <div className="screen-only grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Users */}
            <Link
              to="/master-data?tab=user"
              className="p-5 bg-white rounded-3xl shadow-soft border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <FiUsers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full flex items-center gap-1">
                  <span>จัดการ</span>
                  <FiChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">บัญชีผู้ใช้งานในระบบ</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{systemHealth?.counts?.users || 0} <span className="text-xs font-semibold text-slate-400">บัญชี</span></div>
            </Link>

            {/* Faculties */}
            <Link
              to="/master-data?tab=faculty"
              className="p-5 bg-white rounded-3xl shadow-soft border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <FiBookmark className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-violet-50 text-violet-600 rounded-full flex items-center gap-1">
                  <span>ดูรายชื่อ</span>
                  <FiChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">คณะและหน่วยงานหลัก</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{systemHealth?.counts?.faculties || 0} <span className="text-xs font-semibold text-slate-400">คณะ</span></div>
            </Link>

            {/* Departments */}
            <Link
              to="/master-data?tab=department"
              className="p-5 bg-white rounded-3xl shadow-soft border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <FiLayers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full flex items-center gap-1">
                  <span>ข้อมูล</span>
                  <FiChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ภาควิชาและสาขาวิชา</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{systemHealth?.counts?.departments || 0} <span className="text-xs font-semibold text-slate-400">หน่วยงาน</span></div>
            </Link>

            {/* System Issues */}
            <Link
              to="/admin/issues"
              className="p-5 bg-white rounded-3xl shadow-soft border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <FiAlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full flex items-center gap-1">
                  <span>ตรวจสอบ</span>
                  <FiChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">เรื่องแจ้งปัญหาระบบ</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{systemHealth?.counts?.issues || 0} <span className="text-xs font-semibold text-slate-400">รายการ</span></div>
            </Link>
          </div>

          {/* Pending System Issues Alert Widget */}
          {pendingIssues.length > 0 ? (
            <div className="screen-only p-6 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/50 rounded-3xl border border-rose-200/80 shadow-soft space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-sm animate-pulse">
                    <FiAlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>เรื่องแจ้งปัญหาระบบที่รอดำเนินการ (Pending Issues)</span>
                      <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black">{pendingIssues.length} รายการ</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">มีผู้ใช้งานส่งรายงานปัญหาระบบหรือข้อขัดข้องเข้ามา โปรดตรวจสอบและปรับสถานะการแก้ไข</p>
                  </div>
                </div>
                <Link
                  to="/admin/issues"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  <span>จัดการปัญหาทั้งหมด</span>
                  <FiChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {pendingIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 bg-white rounded-2xl border border-rose-100 hover:border-rose-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {issue.category || 'ทั่วไป'}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          issue.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                          issue.priority === 'LOW' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {issue.priority === 'HIGH' ? 'ด่วนมาก' : issue.priority === 'LOW' ? 'ต่ำ' : 'ปานกลาง'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{issue.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{issue.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span className="truncate max-w-[120px]">โดย {issue.user?.name || 'ผู้ใช้งาน'}</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="screen-only p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 flex items-center justify-between gap-4 text-xs font-bold text-emerald-800 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <FiCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>ศูนย์รับแจ้งปัญหา: ไม่มีคำร้องปัญหาระบบค้างอยู่ (ระบบทำงานปกติ 100%)</span>
              </div>
              <Link to="/admin/issues" className="text-emerald-700 hover:text-emerald-900 underline text-[11px] shrink-0">
                ดูประวัติคำร้อง
              </Link>
            </div>
          )}

          {/* Charts Section - Executive Style */}
          <div className="screen-only grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Bar Chart (2 cols) */}
            <div className="lg:col-span-2 p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <FiBarChart2 className="w-4 h-4 text-primary shrink-0" />
                    <span>งบประมาณและผลการใช้จ่าย แยกตามหน่วยงาน</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">เปรียบเทียบงบประมาณตามแผนและงบประมาณที่เบิกจ่ายจริง</p>
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

              <div className="h-[290px] w-full flex items-center justify-center">
                {barList.length > 0 ? (
                  <Bar 
                    data={barData} 
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
                            label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw || 0).toLocaleString('th-TH')} บาท`
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 11, weight: 'bold' }, color: '#64748B' }
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
                ) : (
                  <span className="text-xs text-slate-400">ไม่มีข้อมูลเปรียบเทียบงบประมาณ</span>
                )}
              </div>

              {/* Summary Badges Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">รวมงบประมาณตามแผน:</span>
                  <span className="font-extrabold text-slate-800">{summary.totalBudget?.toLocaleString('th-TH')} ฿</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">ใช้จ่ายจริงรวม:</span>
                  <span className="font-extrabold text-emerald-600">{summary.totalActualBudget?.toLocaleString('th-TH')} ฿ ({summary.budgetPercentage}%)</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Doughnut Chart (1 col) */}
            <div className="p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiPieChart className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>สัดส่วนระดับความสำเร็จโครงการ</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">การกระจายตัวของระดับความก้าวหน้าโครงการ (%)</p>
              </div>

              <div className="h-[230px] w-full relative flex items-center justify-center my-auto">
                {pieList.some(c => c.count > 0) ? (
                  <>
                    <Doughnut 
                      data={doughnutData} 
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
                              label: (ctx) => {
                                const total = totalPieCount || 1;
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return ` จำนวน: ${ctx.raw} โครงการ (${pct}%)`;
                              }
                            }
                          }
                        },
                        cutout: '72%'
                      }} 
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">โครงการทั้งหมด</span>
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{summary.totalProjects}</span>
                      <span className="text-[10px] font-bold text-slate-500">โครงการ</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">ไม่มีข้อมูลสัดส่วนโครงการ</span>
                )}
              </div>

              {/* Status Legend Badges Footer */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                  {pieList.map((c, idx) => {
                    const colors = [
                      { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                      { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                      { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                      { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
                      { dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' }
                    ];
                    const clr = colors[idx % colors.length];
                    const total = totalPieCount || 1;
                    const pct = ((c.count / total) * 100).toFixed(0);
                    return (
                      <div 
                        key={c.status || idx} 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${clr.bg} border border-slate-200/50 text-[11px] font-extrabold`}
                      >
                        <span className={`w-2 h-2 rounded-full ${clr.dot}`} />
                        <span className="text-slate-700">{c.status}:</span>
                        <span className={clr.text}>{c.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: 6-Month Real Expenditure Trend Line Chart */}
          <div className="screen-only p-6 bg-white rounded-3xl shadow-soft border border-slate-100 space-y-4">
            <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>แนวโน้มงบประมาณใช้จ่ายจริง ย้อนหลัง 6 เดือน</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">สถิติการเบิกจ่ายงบประมาณสะสมรายช่วงเวลา</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-black">
                <span>ยอดจ่ายสะสมล่าสุด: {summary.totalActualBudget?.toLocaleString('th-TH')} บาท</span>
              </div>
            </div>

            <div className="h-[250px] w-full flex items-center justify-center">
              <Line 
                data={lineData} 
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
                        label: (ctx) => ` เบิกจ่ายจริง: ${Number(ctx.raw || 0).toLocaleString('th-TH')} บาท`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 11, weight: 'bold' }, color: '#64748B' }
                    },
                    y: {
                      grid: { color: '#F8FAFC' },
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
          </div>

          {/* Operations: Recent Projects & Activity Photos */}
          <div className="screen-only grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Projects (5 cols) */}
            <div className="lg:col-span-5 p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <FiFolder className="w-4 h-4 text-primary" />
                    <span>โครงการล่าสุดในระบบ</span>
                  </h3>
                  <Link to="/projects" className="text-xs text-primary font-bold hover:text-primary-dark transition-colors flex items-center gap-0.5 group">
                    <span>ดูทั้งหมด</span>
                    <FiChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentProjects.length > 0 ? (
                    recentProjects.map(proj => (
                      <Link 
                        key={proj.id} 
                        to={`/projects/${proj.id}`}
                        className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:shadow-soft hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                      >
                        <div className="max-w-[70%]">
                          <div className="text-xs font-bold text-slate-800 truncate">{proj.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-medium">โดย {proj.creator?.name} | ปีงบประมาณ {proj.fiscalYear?.year}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-primary-light text-primary">
                            {proj.progress}%
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-8">ไม่มีข้อมูลโครงการใหม่</div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Photos Gallery (7 cols) */}
            <div className="lg:col-span-7 p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                  <FiEye className="w-4 h-4 text-primary" />
                  <span>ภาพความสำเร็จและภาพถ่ายกิจกรรมล่าสุด</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {latestImages.length > 0 ? (
                    (() => {
                      const allImages = latestImages.map(img => ({
                        id: img.id,
                        url: `http://localhost:5000${img.filePath}`,
                        title: img.activity?.name || 'รูปกิจกรรม',
                        subtitle: img.activity?.project?.name || ''
                      }));
                      return allImages.slice(0, 6).map((img, idx) => (
                        <div 
                          key={img.id} 
                          className="group relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-[4/3] bg-slate-50 cursor-pointer"
                          onClick={() => openPhotoViewer(allImages, idx)}
                        >
                          <img 
                            src={img.url} 
                            alt="activity log" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2.5 transition-all duration-300 backdrop-blur-[1px]">
                            <div className="text-[9px] font-bold text-white truncate">{img.title}</div>
                            <div className="text-[8px] text-slate-300 truncate mt-0.5 mb-1.5">{img.subtitle}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPhotoViewer(allImages, idx);
                              }}
                              className="px-2 py-0.5 bg-white/20 hover:bg-white/35 text-white rounded text-[8px] font-bold flex items-center gap-1 self-start transition-colors"
                              title="ขยายรูปภาพ"
                            >
                              <FiEye className="w-3 h-3" />
                              <span>ขยายรูป</span>
                            </button>
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="col-span-full text-center text-xs text-slate-400 py-8">ไม่มีการอัปโหลดไฟล์ภาพล่าสุด</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 Official Executive Admin Strategic Performance Report Document (Official A4 PDF / Print Format) */}
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
                  รายงานสรุปผลการบริหารจัดการระบบและสุขภาพยุทธศาสตร์ภาพรวม (Admin Strategic & System Performance Report)
                </h2>
                <div className="text-[9px] text-slate-500 font-medium">ระบบติดตามและประเมินผลเชิงยุทธศาสตร์มหาวิทยาลัย (BRU Strategic Tracking System)</div>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-700 space-y-0.5 font-medium border-l border-slate-300 pl-2.5">
              <div><span className="font-bold">ปีงบประมาณ:</span> {selectedFiscalYear ? `พ.ศ. ${fiscalYears.find(f => String(f.id) === selectedFiscalYear)?.year || selectedFiscalYear}` : 'ทุกปีงบประมาณ'}</div>
              <div><span className="font-bold">แหล่งงบประมาณ:</span> {selectedBudgetSource ? budgetSources.find(b => String(b.id) === selectedBudgetSource)?.name : 'ทุกแหล่งเงินทุน'}</div>
              <div><span className="font-bold">วันที่ออกเอกสาร:</span> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</div>
              <div><span className="font-bold">ผู้ออกรายงาน:</span> {user?.name || 'ผู้ดูแลระบบ (Admin)'}</div>
            </div>
          </div>
        </div>

        {/* Section 1: สรุปภาพรวมตัวชี้วัดยุทธศาสตร์และการเงิน (Institutional Health & Financial Summary) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            1. สรุปภาพรวมเป้าหมายยุทธศาสตร์และการเบิกจ่ายงบประมาณ (Strategic KPI & Burn Rate Summary)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">ความก้าวหน้าเป้าหมายตัวชี้วัด</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{summary.targetProgressPercentage}% <span className="text-[9px] font-normal text-slate-500">(ของเป้าหมายรวม)</span></td>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">งบประมาณจัดสรรตามแผนรวม</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{parseFloat(summary.totalBudget || 0).toLocaleString()} <span className="text-[10px] font-normal">บาท</span></td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">การเบิกจ่ายจริงสะสม (Burn Rate)</td>
                <td className="font-bold text-slate-900 py-1 px-2">{parseFloat(summary.totalActualBudget || 0).toLocaleString()} บาท <span className="text-emerald-700 font-black">({summary.budgetPercentage}%)</span></td>
                <td className="bg-slate-50 font-bold py-1 px-2">งบประมาณคงเหลือสุทธิ</td>
                <td className="font-bold text-slate-900 py-1 px-2">{parseFloat((summary.totalBudget || 0) - (summary.totalActualBudget || 0)).toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">สรุปจำนวนโครงการและกิจกรรม</td>
                <td colSpan="3" className="py-1 px-2">
                  <div className="flex items-center gap-3 font-bold text-[10px]">
                    <span>รวมโครงการทั้งหมด: <strong className="text-slate-900 font-black">{summary.totalProjects}</strong> โครงการ</span>
                    <span className="text-indigo-700">กิจกรรมเสร็จสิ้น: {summary.completedActivities} / {summary.totalActivities} ({summary.successActivityPercentage}%)</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: สถานะข้อมูลหลักและโครงสร้างระบบ (Master Data & System Health) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            2. สถานะโครงสร้างข้อมูลหลักและทรัพยากรระบบ (Master Data & Infrastructure Status)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">สถานะฐานข้อมูล (Database)</td>
                <td className="w-1/4 font-black text-emerald-700 py-1 px-2">{systemHealth?.database || 'CONNECTED'}</td>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">จำนวนบัญชีผู้ใช้งานในระบบ</td>
                <td className="w-1/4 font-black text-slate-900 py-1 px-2">{systemHealth?.counts?.users || 0} บัญชี</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">โครงสร้างคณะและหน่วยงาน</td>
                <td className="font-bold text-slate-900 py-1 px-2">{systemHealth?.counts?.faculties || 0} คณะ</td>
                <td className="bg-slate-50 font-bold py-1 px-2">โครงสร้างภาควิชา/สาขาวิชา</td>
                <td className="font-bold text-slate-900 py-1 px-2">{systemHealth?.counts?.departments || 0} ภาควิชา</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">ศูนย์รับแจ้งปัญหาระบบ</td>
                <td colSpan="3" className="font-bold text-slate-900 py-1 px-2">
                  <span>คำร้องทั้งหมด: {systemHealth?.counts?.issues || 0} รายการ</span>
                  <span className="text-rose-700 ml-3">รอดำเนินการ (Pending): {pendingIssues.length} รายการ</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: สถิติงบประมาณและการใช้จ่ายแยกตามหน่วยงาน (Cross-Unit Budget Distribution) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            3. สรุปงบประมาณตามแผนและการเบิกจ่ายจริง จำแนกตามหน่วยงาน (Cross-Unit Budget Distribution)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-10 text-center py-1 px-2">ลำดับ</th>
                <th className="text-left py-1 px-2">ชื่อหน่วยงาน / คณะ</th>
                <th className="w-36 text-right py-1 px-2">งบประมาณตามแผน (บาท)</th>
                <th className="w-36 text-right py-1 px-2">งบประมาณเบิกจ่ายจริง (บาท)</th>
                <th className="w-24 text-center py-1 px-2">% Burn Rate</th>
              </tr>
            </thead>
            <tbody>
              {barList && barList.length > 0 ? (
                barList.map((b, idx) => {
                  const bRate = b.budget > 0 ? ((b.actual / b.budget) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={b.unit || idx}>
                      <td className="text-center font-bold py-1 px-2">{idx + 1}</td>
                      <td className="font-semibold text-slate-800 text-left py-1 px-2">{b.unit}</td>
                      <td className="text-right font-medium py-1 px-2">{parseFloat(b.budget || 0).toLocaleString()}</td>
                      <td className="text-right font-medium text-emerald-700 py-1 px-2">{parseFloat(b.actual || 0).toLocaleString()}</td>
                      <td className="text-center font-black py-1 px-2">{bRate}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-1.5 text-slate-400 italic">ไม่พบข้อมูลเปรียบเทียบงบประมาณ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: สรุปสถานะโครงการล่าสุด (Recent Projects Record) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            4. สรุปรายการโครงการล่าสุดในระบบ (Recent Projects Record)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-10 text-center py-1 px-2">ลำดับ</th>
                <th className="text-left py-1 px-2">ชื่อโครงการ</th>
                <th className="w-40 text-left py-1 px-2">ผู้รับผิดชอบ / หน่วยงาน</th>
                <th className="w-24 text-center py-1 px-2">ปีงบประมาณ</th>
                <th className="w-24 text-center py-1 px-2">% ความก้าวหน้า</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects && recentProjects.length > 0 ? (
                recentProjects.map((proj, idx) => (
                  <tr key={proj.id || idx}>
                    <td className="text-center font-bold py-1 px-2">{idx + 1}</td>
                    <td className="font-semibold text-slate-800 text-left py-1 px-2">{proj.name}</td>
                    <td className="font-medium text-slate-700 text-left py-1 px-2">{proj.creator?.name || 'ไม่ระบุ'}</td>
                    <td className="text-center font-medium py-1 px-2">{proj.fiscalYear?.year || '-'}</td>
                    <td className="text-center font-black text-indigo-700 py-1 px-2">{proj.progress}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-1.5 text-slate-400 italic">ไม่มีข้อมูลโครงการใหม่</td>
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

      {/* Reusable Photo Viewer Full-Screen Modal */}
      {photoViewerOpen && viewerImages.length > 0 && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 bg-black backdrop-blur-md cursor-pointer select-none"
          onClick={() => setPhotoViewerOpen(false)}
        >
          {/* Close button icon */}
          <button 
            className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg border border-white/10 z-50"
            onClick={() => setPhotoViewerOpen(false)}
            title="ปิด (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Left Arrow Button */}
          {viewerImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 z-50"
              title="ก่อนหน้า (ลูกศรซ้าย)"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Right Arrow Button */}
          {viewerImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 z-50"
              title="ถัดไป (ลูกศรขวา)"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Expanded Image container */}
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center p-2 cursor-default z-40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Top Header Bar with 5px gap to Image */}
            {(viewerImages[activeViewerIndex]?.subtitle || viewerImages[activeViewerIndex]?.title) && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-[5px] text-center max-w-4xl z-40">
                {viewerImages[activeViewerIndex]?.subtitle && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider shrink-0">โครงการ:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{viewerImages[activeViewerIndex].subtitle}</span>
                  </div>
                )}

                {viewerImages[activeViewerIndex]?.title && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span className="text-indigo-300 text-[10px] uppercase font-black tracking-wider shrink-0">กิจกรรม:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{viewerImages[activeViewerIndex].title}</span>
                  </div>
                )}
              </div>
            )}

            <img 
              src={viewerImages[activeViewerIndex].url} 
              alt="enlarged log" 
              className="max-w-full max-h-[68vh] rounded-xl shadow-2xl border border-white/10 object-contain transition-all duration-300"
            />

            <div className="text-[10px] text-white/90 font-medium bg-white/10 border border-white/10 px-3 py-1 rounded-full inline-block mt-[5px]">
              รูปที่ {activeViewerIndex + 1} จาก {viewerImages.length}
            </div>

            {/* Thumbnails list at the bottom of image container */}
            {viewerImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 max-w-full overflow-x-auto py-1 px-2 select-none z-50">
                {viewerImages.map((img, idx) => {
                  const isActive = idx === activeViewerIndex;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveViewerIndex(idx);
                      }}
                      className={`relative w-12 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer active:scale-95 ${
                        isActive ? 'border-primary scale-105 shadow-md shadow-primary/40' : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                      }`}
                    >
                      <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
