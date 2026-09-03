import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';
import CustomSelect from '../../components/CustomSelect';
import { 
  FiSearch, 
  FiCalendar, 
  FiArrowRight,
  FiBriefcase
} from 'react-icons/fi';

const DeanProjects = () => {
  // Projects list state
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Dropdown lists
  const [fiscalYears, setFiscalYears] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Load initial dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [years, depts] = await Promise.all([
          api.get('/master/fiscal-years'),
          api.get('/master/departments')
        ]);
        setFiscalYears(years.data);
        setDepartments(depts.data);

        // Pre-select active fiscal year if any
        const activeYear = years.data.find(y => y.active);
        if (activeYear) setFiscalYearId(activeYear.id);
      } catch (err) {
        console.error('Failed to load filter option dropdowns:', err);
      }
    };
    fetchFilters();
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
        departmentId: departmentId || undefined
      };
      
      const response = await api.get('/projects', { params });
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถดึงรายการโครงการได้' });
    } finally {
      setLoading(false);
    }
  };

  const getDeptCode = (dept) => {
    if (!dept) return '';
    const facId = dept.facultyId || 0;
    const siblingDepts = departments
      .filter(d => (d.facultyId || 0) === facId)
      .sort((a, b) => a.id - b.id);
    const index = siblingDepts.findIndex(d => d.id === dept.id);
    const seq = String(index !== -1 ? index + 1 : 1).padStart(2, '0');
    const facCode = facId ? String(facId).padStart(2, '0') : '00';
    return `${facCode}${seq}`;
  };

  useEffect(() => {
    fetchProjects(1);
  }, [search, fiscalYearId, departmentId]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-300 border border-white/10 flex items-center gap-1.5">
                <FiBriefcase className="w-3.5 h-3.5" />
                <span>การติดตามระดับคณะ</span>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">โครงการตามแผนยุทธศาสตร์ในคณะ</h1>
            <p className="text-xs md:text-sm text-indigo-200/80 mt-1 font-medium max-w-2xl">
              บริหารจัดการ กำกับดูแล และติดตามความก้าวหน้าโครงการของหน่วยงานย่อยทุกภาควิชาในสังกัด
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อโครงการ / คำอธิบาย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProjects(1)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Fiscal Year Filter */}
          <div>
            <CustomSelect
              value={fiscalYearId}
              onChange={(val) => setFiscalYearId(val)}
              options={[
                { value: '', label: 'ทุกปีงบประมาณ' },
                ...fiscalYears.map(fy => ({ value: String(fy.id), label: `ปีงบประมาณ พ.ศ. ${fy.year} ${fy.active ? '(ปัจจุบัน)' : ''}` }))
              ]}
              className="w-full"
            />
          </div>

          {/* Department Filter */}
          <div>
            <CustomSelect
              value={departmentId}
              onChange={(val) => setDepartmentId(val)}
              options={[
                { value: '', label: 'ทุกภาควิชา / หน่วยงาน' },
                ...departments.map(d => ({ value: String(d.id), label: d.name }))
              ]}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 3. Projects Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : projects.length > 0 ? (
        <div className="flex flex-col space-y-4">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="group bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden hover:shadow-lg transition-all flex flex-col lg:flex-row items-stretch"
            >
              {/* Main Left Card Body */}
              <div className="p-6 md:p-7 flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      ปีงบประมาณ พ.ศ. {project.fiscalYear?.year}
                    </span>
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/60">
                      สังกัด: {project.department?.name || 'ส่วนกลาง'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(project.startDate).toLocaleDateString('th-TH')} - {new Date(project.endDate).toLocaleDateString('th-TH')}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {project.name}
                  </h3>
                  <p className="text-[13px] text-slate-500 font-normal line-clamp-2 mt-1.5 leading-relaxed">
                    {project.description || 'ไม่มีคำอธิบายรายละเอียดเพิ่มเติมสำหรับโครงการนี้'}
                  </p>
                </div>

                {/* Strategic paths container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50/90 p-3 rounded-2xl border border-slate-100 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-extrabold text-violet-600 uppercase tracking-wider">1. ประเด็นการพัฒนา</span>
                    <span className="font-bold text-slate-800 line-clamp-1" title={project.subStrategy?.strategy?.localIssue?.name}>
                      {project.subStrategy?.strategy?.localIssue ? `${project.subStrategy.strategy.localIssue.code}: ${project.subStrategy.strategy.localIssue.name}` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-extrabold text-purple-600 uppercase tracking-wider">2. แผนงานหลัก</span>
                    <span className="font-bold text-slate-800 line-clamp-1" title={project.subStrategy?.strategy?.name}>
                      {project.subStrategy?.strategy ? `${project.subStrategy.strategy.code}: ${project.subStrategy.strategy.name}` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-extrabold text-blue-600 uppercase tracking-wider">3. แผนงานย่อย</span>
                    <span className="font-bold text-slate-800 line-clamp-1" title={project.subStrategy?.name}>
                      {project.subStrategy ? `${project.subStrategy.code}: ${project.subStrategy.name}` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-extrabold text-emerald-600 uppercase tracking-wider">4. โครงการหลัก</span>
                    <span className="font-bold text-slate-800 line-clamp-1" title={project.indicator?.name}>
                      {project.indicator ? `${project.indicator.code}: ${project.indicator.name}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side Stats & Action Bar */}
              <div className="lg:w-[350px] bg-slate-50/60 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 md:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">งบประมาณจัดสรร</span>
                    <span className="font-black text-slate-900 text-sm">{parseFloat(project.totalBudget).toLocaleString()} ฿</span>
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60">
                  <Link
                    to={`/executive-projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-black text-white bg-slate-900 hover:bg-primary rounded-xl transition-all shadow-md shadow-slate-950/20 active:scale-95 cursor-pointer"
                  >
                    <span>ดูรายงานยุทธศาสตร์ฉบับเต็ม</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl shadow-soft border border-slate-100 space-y-2">
          <FiBriefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">ไม่พบข้อมูลโครงการ</div>
          <p className="text-xs text-slate-400">ไม่พบรายการโครงการที่ตรงกับเงื่อนไขการค้นหาในขณะนี้</p>
        </div>
      )}

      {/* 4. Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => fetchProjects(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 disabled:opacity-50 transition-all cursor-pointer"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs text-slate-500 font-extrabold px-3">หน้า {pagination.page} จาก {pagination.totalPages}</span>
          <button
            onClick={() => fetchProjects(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 disabled:opacity-50 transition-all cursor-pointer"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
};

export default DeanProjects;
