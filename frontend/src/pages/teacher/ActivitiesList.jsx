import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import {
  FiActivity,
  FiSearch,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiBriefcase,
  FiImage,
  FiFolder,
  FiPlusCircle,
  FiInfo,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiLayers,
  FiFilter,
  FiEye,
  FiTarget,
  FiPieChart
} from 'react-icons/fi';
import CustomSelect from '../../components/CustomSelect';

const ActivitiesList = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);

  // Fetch fiscal years
  useEffect(() => {
    const fetchFiscalYears = async () => {
      try {
        const res = await api.get('/master/fiscal-years');
        setFiscalYears(res.data || []);
      } catch (err) {
        console.error('Failed to load fiscal years:', err);
      }
    };
    fetchFiscalYears();
  }, []);

  const fetchActivitiesData = async () => {
    setLoading(true);
    try {
      // Fetch projects for current user including their activities, filtered by fiscalYear if selected
      const params = {
        limit: 100,
        fiscalYearId: fiscalYearId || undefined
      };
      const response = await api.get('/projects', { params });
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to load activities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivitiesData();
  }, [fiscalYearId]);

  // Calculate comprehensive KPI stats
  let totalProjectsCount = projects.length;
  let totalActivitiesCount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  let totalAllocatedBudget = 0;
  let totalActualSpent = 0;

  projects.forEach(p => {
    (p.activities || []).forEach(a => {
      totalActivitiesCount++;
      if (a.success) completedCount++;
      else pendingCount++;

      const b = parseFloat(a.budget) || 0;
      const ab = parseFloat(a.actualBudget) || 0;
      totalAllocatedBudget += b;
      totalActualSpent += ab;
    });
  });

  const completionRate = totalActivitiesCount > 0 
    ? Math.round((completedCount / totalActivitiesCount) * 100) 
    : 0;

  // Filter projects & activities based on search and statusFilter
  const filteredProjects = projects.map(proj => {
    let acts = proj.activities || [];

    if (statusFilter === 'completed') {
      acts = acts.filter(a => a.success);
    } else if (statusFilter === 'pending') {
      acts = acts.filter(a => !a.success);
    }

    if (search) {
      const q = search.toLowerCase();
      const projMatch = proj.name.toLowerCase().includes(q);
      if (!projMatch) {
        acts = acts.filter(a => 
          a.name.toLowerCase().includes(q) || 
          (a.description && a.description.toLowerCase().includes(q))
        );
      }
    }

    return {
      ...proj,
      filteredActivities: acts,
      matchesSearch: search ? (proj.name.toLowerCase().includes(search.toLowerCase()) || acts.length > 0) : true
    };
  }).filter(proj => proj.matchesSearch);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Hero Card with KPI Metrics */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-200">
              <FiActivity className="w-3.5 h-3.5 text-emerald-400" />
              <span>รายการกิจกรรมโครงการ</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              ตารางกิจกรรมย่อย
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              ติดตามสถานะกิจกรรมย่อย ยอดงบเบิกจ่ายจริง และรูปภาพกิจกรรม
            </p>
          </div>

          {/* Overall Progress Widget */}
          <div className="w-full lg:w-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-white">{completionRate}%</span>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">ความก้าวหน้ากิจกรรมรวม</div>
              <div className="text-sm font-black text-white mt-0.5">{completedCount} จาก {totalActivitiesCount} กิจกรรม</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                <span>เสร็จสมบูรณ์แล้ว {completionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          {/* Card 1: Projects Count */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">โครงการทั้งหมด</span>
              <FiFolder className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="text-lg font-black text-white mt-1">{totalProjectsCount} โครงการ</div>
          </div>

          {/* Card 2: Activities Count */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">กิจกรรมทั้งหมด</span>
              <FiActivity className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-black text-white mt-1">{totalActivitiesCount} รายการ</div>
          </div>

          {/* Card 3: Budget Allocated */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">งบตามแผนรวม</span>
              <FiDollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-lg font-black text-sky-300 mt-1">{totalAllocatedBudget.toLocaleString()} ฿</div>
          </div>

          {/* Card 4: Actual Budget Spent */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider">เบิกจ่ายจริงรวม</span>
              <FiTrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-300 mt-1">{totalActualSpent.toLocaleString()} ฿</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs, Fiscal Year & Search Bar */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 space-y-4">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>ทั้งหมด ({totalActivitiesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                statusFilter === 'pending' 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <FiClock className="w-3.5 h-3.5" />
              <span>กำลังดำเนินการ ({pendingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                statusFilter === 'completed' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>เสร็จสมบูรณ์ ({completedCount})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 justify-end">
            {/* Fiscal Year Filter Dropdown */}
            <div className="w-full sm:w-60 shrink-0">
              <CustomSelect
                value={fiscalYearId}
                onChange={(val) => setFiscalYearId(val)}
                icon={<FiCalendar className="w-4 h-4 text-primary" />}
                placeholder="ทุกปีงบประมาณ (พ.ศ.)"
                options={[
                  { value: '', label: 'ทุกปีงบประมาณ (พ.ศ.)' },
                  ...fiscalYears.map(fy => ({
                    value: String(fy.id),
                    label: `ปีงบประมาณ ${fy.year}${fy.active ? ' (ปัจจุบัน)' : ''}`
                  }))
                ]}
              />
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="ค้นหากิจกรรม หรือชื่อโครงการ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-soft">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-xs font-bold text-slate-500">กำลังโหลดข้อมูลรายการกิจกรรม...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="space-y-6">
          {filteredProjects.map((project) => {
            const actList = project.filteredActivities || [];
            const projBudgetSum = actList.reduce((acc, a) => acc + (parseFloat(a.budget) || 0), 0);
            const projActualSum = actList.reduce((acc, a) => acc + (parseFloat(a.actualBudget) || 0), 0);
            const projCompletedCount = actList.filter(a => a.success).length;

            return (
              <div key={project.id} className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                {/* Project Header Bar */}
                <div className="p-5 bg-slate-50/70 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {/* Tags & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          ปีงบประมาณ {project.fiscalYear?.year}
                        </span>

                        {project.startDate && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1">
                            <FiCalendar className="w-3 h-3 text-blue-600" />
                            <span>{new Date(project.startDate).toLocaleDateString('th-TH')} - {project.endDate ? new Date(project.endDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
                          </span>
                        )}

                        {project.subStrategy?.strategy?.name && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-200/60 text-slate-700">
                            ยุทธศาสตร์: {project.subStrategy.strategy.name}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                          <FiFolder className="w-3 h-3 text-slate-400" />
                          {project.department?.name || 'ส่วนกลาง'}
                        </span>
                      </div>

                      {/* Project Title */}
                      <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
                        <span>โครงการ: {project.name}</span>
                      </h2>
                    </div>

                    {/* Right Info & Quick Action Link */}
                    <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                      <div className="hidden sm:flex flex-col items-end text-right pr-2">
                        <div className="text-[10px] font-bold text-slate-400">สถานะกิจกรรมโครงการ</div>
                        <div className="text-xs font-extrabold text-slate-700 mt-0.5">
                          เสร็จแล้ว <span className="text-emerald-600">{projCompletedCount}</span> / {actList.length} กิจกรรม
                        </div>
                      </div>

                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs group"
                      >
                        <FiEye className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                        <span>ดูรายละเอียดโครงการ</span>
                        <FiArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Table of Activities */}
                {actList.length > 0 ? (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-100/60 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                          <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                          <th className="py-3 px-4">ชื่อกิจกรรมย่อย</th>
                          <th className="py-3 px-4 w-36">วันที่จัดกิจกรรม</th>
                          <th className="py-3 px-4 w-32 text-right">งบตามแผน</th>
                          <th className="py-3 px-4 w-36 text-right">เบิกจ่ายจริง</th>
                          <th className="py-3 px-4 w-32 text-center">สถานะ</th>
                          <th className="py-3 px-4 w-20 text-center">คลังภาพ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {actList.map((act, idx) => {
                          const budgetNum = parseFloat(act.budget) || 0;
                          const actualNum = parseFloat(act.actualBudget) || 0;
                          const isOverBudget = actualNum > budgetNum;

                          return (
                            <tr key={act.id} className="hover:bg-slate-50/70 transition-colors group">
                              <td className="py-3.5 px-4 text-center font-extrabold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800 group-hover:text-primary transition-colors">{act.name}</div>
                                {act.description && (
                                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">{act.description}</div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  <FiCalendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{new Date(act.activityDate).toLocaleDateString('th-TH')}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right font-extrabold text-slate-700">
                                {budgetNum.toLocaleString()} ฿
                              </td>
                              <td className="py-3.5 px-4 text-right font-extrabold">
                                {act.actualBudget ? (
                                  <div className="flex flex-col items-end">
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
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs ${
                                  act.success 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {act.success ? (
                                    <>
                                      <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                                      <span>เสร็จสมบูรณ์</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiClock className="w-3 h-3 text-amber-600" />
                                      <span>กำลังดำเนินการ</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {act.images && act.images.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
                                    <FiImage className="w-3.5 h-3.5" />
                                    <span>{act.images.length}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[10px] font-normal">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Table Summary Footer */}
                      <tfoot>
                        <tr className="bg-slate-50/90 border-t border-slate-200 text-xs font-black text-slate-800">
                          <td colSpan={3} className="py-3 px-4 text-right text-slate-500 uppercase tracking-wider text-[10px]">
                            สถิติรวมของโครงการนี้:
                          </td>
                          <td className="py-3 px-4 text-right text-primary font-black">
                            {projBudgetSum.toLocaleString()} ฿
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-black">
                            {projActualSum.toLocaleString()} ฿
                          </td>
                          <td colSpan={2} className="py-3 px-4 text-center text-[10px] text-slate-400 font-semibold">
                            {projCompletedCount} จาก {actList.length} กิจกรรมเรียบร้อยแล้ว
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* Empty state placeholder */
                  <div className="p-10 text-center bg-slate-50/40 border-t border-slate-100 flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                      <FiInfo className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">ยังไม่มีรายการกิจกรรมย่อยในโครงการนี้</p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      คุณสามารถเข้าไปเพิ่มกิจกรรมย่อย อัปเดตงบประมาณเบิกจ่ายจริง และอัปโหลดภาพกิจกรรมได้ที่หน้ารายละเอียดโครงการ
                    </p>
                    <Link
                      to={`/projects/${project.id}`}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/25 active:scale-95"
                    >
                      <FiPlusCircle className="w-4 h-4" />
                      <span>จัดการกิจกรรมในโครงการนี้</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Overall Empty State */
        <div className="text-center py-24 bg-white rounded-3xl shadow-soft border border-slate-100 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
            <FiActivity className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">ไม่พบรายการกิจกรรมที่ตรงตามเงื่อนไข</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะเป็น "ทั้งหมด" เพื่อดูรายการกิจกรรมทั้งหมด
          </p>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivitiesList;
