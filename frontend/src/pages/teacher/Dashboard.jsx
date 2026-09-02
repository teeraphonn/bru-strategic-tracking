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
  FiPieChart,
  FiTrendingUp,
  FiTarget,
  FiPlus,
  FiChevronRight,
  FiEye,
  FiChevronLeft,
  FiBarChart2,
  FiUser
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Register Chart.js components
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

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('ไม่สามารถเรียกข้อมูลสถิติแดชบอร์ดได้');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold text-xs">
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

  const totalPieCount = pieList.reduce((sum, c) => sum + (c.count || 0), 0) || summary.totalProjects || 0;

  // Chart configuration: Doughnut (Progress Categories)
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

  // Chart configuration: Bar Chart (Budget vs Spent by Unit)
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

  // Chart configuration: Line Chart (Spent Timeline)
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
      {/* 1. Executive Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-violet-200 border border-white/15">
              <FiUser className="w-3.5 h-3.5 text-violet-400" />
              <span>พื้นที่การทำงานสำหรับอาจารย์และผู้รับผิดชอบโครงการ (Project Manager Workspace)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              ระบบติดตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์
            </h1>
            <p className="text-xs md:text-sm text-violet-200/80 font-medium max-w-2xl">
              ยินดีต้อนรับคุณ <span className="font-extrabold text-white">{user?.name}</span> | {user?.department?.name || 'หน่วยงาน'} {user?.department?.faculty?.name ? `คณะ${user.department.faculty.name}` : ''}
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-slate-900 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <FiPlus className="w-4 h-4 text-primary stroke-[2.5]" />
              <span>เพิ่มโครงการใหม่</span>
            </Link>
          </div>
        </div>

        {/* 4-Gauge Strip in Hero Banner */}
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
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">โครงการที่รับผิดชอบ</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{summary.totalProjects || 0}</span>
                <span className="text-xs text-violet-300 font-bold">โครงการของฉัน</span>
              </div>
            </div>
            <div className="text-[10px] text-violet-300/80 mt-2 truncate flex items-center justify-between">
              <span>กำลังดำเนินงาน {summary.inProgressProjects || 0} โครงการ</span>
              <span>เสร็จ {summary.completedProjects || 0}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">สถานะกิจกรรม & การดำเนินงาน</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">{summary.completedActivities || 0}</span>
                <span className="text-xs text-slate-200 font-bold">กิจกรรมเสร็จสิ้น</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold mt-2 truncate">
              {summary.remainingActivities > 0 ? (
                <span className="text-amber-300">🟡 {summary.remainingActivities} กิจกรรมกำลังดำเนินการ</span>
              ) : (summary.inProgressProjects || 0) > 0 ? (
                <span className="text-sky-300">⏳ โครงการอยู่ระหว่างดำเนินการ ({summary.inProgressProjects} โครงการ)</span>
              ) : (
                <span className="text-emerald-300">🟢 เสร็จสิ้นครบตามแผน 100%</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Bar Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiBarChart2 className="w-4 h-4 text-primary shrink-0" />
                <span>งบประมาณและผลการใช้จ่าย แยกตามโครงการ</span>
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
                      ticks: { font: { size: 10, weight: 'bold' }, color: '#64748B', autoSkip: false, maxRotation: 25 }
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">โครงการของฉัน</span>
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

      {/* 3. 6-Month Real Expenditure Trend Line Chart */}
      <div className="p-6 bg-white rounded-3xl shadow-soft border border-slate-100 space-y-4">
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

      {/* 4. Operations: Recent Projects & Activity Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Projects (5 cols) */}
        <div className="lg:col-span-5 p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiFolder className="w-4 h-4 text-primary" />
                <span>โครงการล่าสุดของฉัน</span>
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
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">ปีงบประมาณ {proj.fiscalYear?.year}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-primary-light text-primary">
                        {proj.progress}%
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">ไม่มีข้อมูลโครงการ</div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Photos Gallery (7 cols) */}
        <div className="lg:col-span-7 p-6 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <FiEye className="w-4 h-4 text-primary" />
              <span>ภาพถ่ายหลักฐานกิจกรรมล่าสุด</span>
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

export default TeacherDashboard;
