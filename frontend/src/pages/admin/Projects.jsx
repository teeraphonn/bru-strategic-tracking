import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  FiCheckCircle, 
  FiClock, 
  FiArrowRight,
  FiBriefcase,
  FiLock,
  FiUnlock,
  FiEye
} from 'react-icons/fi';

const AdminProjects = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [facultyId, setFacultyId] = useState(searchParams.get('facultyId') || '');

  const [fiscalYears, setFiscalYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [years, depts, facs] = await Promise.all([
          api.get('/master/fiscal-years'),
          api.get('/master/departments'),
          api.get('/master/faculties')
        ]);
        setFiscalYears(years.data);
        setDepartments(depts.data);
        setFaculties(facs.data);

        const activeYear = years.data.find(y => y.active);
        if (activeYear) setFiscalYearId(activeYear.id);
      } catch (err) {
        console.error('Failed to load filter option dropdowns:', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        fiscalYearId: fiscalYearId || undefined,
        departmentId: departmentId || undefined,
        facultyId: facultyId || undefined
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

  const getFacultyCode = (fac) => {
    if (!fac) return '0000';
    if (fac.name === 'ส่วนกลาง') return '0000';
    const nonCentral = faculties
      .filter(f => f.name !== 'ส่วนกลาง')
      .sort((a, b) => a.id - b.id);
    const idx = nonCentral.findIndex(f => f.id === fac.id);
    const seq = idx !== -1 ? idx + 1 : fac.id;
    return String(seq).padStart(4, '0');
  };

  const getDeptCode = (dept) => {
    if (!dept) return '';
    const facId = dept.facultyId || 0;
    const fac = faculties.find(f => f.id === facId);
    const facCode = getFacultyCode(fac);
    
    const siblingDepts = departments
      .filter(d => (d.facultyId || 0) === facId)
      .sort((a, b) => a.id - b.id);
    const index = siblingDepts.findIndex(d => d.id === dept.id);
    const seq = String(index !== -1 ? index + 1 : 1).padStart(2, '0');
    return `${facCode}${seq}`;
  };

  useEffect(() => {
    fetchProjects(1);
  }, [search, fiscalYearId, departmentId, facultyId]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    Swal.fire({
      title: 'ต้องการลบโครงการนี้?',
      text: "กิจกรรมและรูปภาพความสำเร็จทั้งหมดในโครงการนี้จะถูกลบออกด้วย!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6C3BFF',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'ลบโครงการ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/projects/${id}`);
          Swal.fire({ icon: 'success', title: 'ลบโครงการสำเร็จ', showConfirmButton: false, timer: 1200 });
          fetchProjects(pagination.page);
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการลบ', text: err.response?.data?.message || 'ไม่สามารถลบโครงการได้' });
        }
      }
    });
  };

  const handleToggleProjectLock = async (e, id, currentLocked, projName) => {
    e.preventDefault();
    e.stopPropagation();

    const actionText = currentLocked ? 'ปลดล็อกโครงการ' : 'ล็อกโครงการ';
    const result = await Swal.fire({
      title: `${actionText}?`,
      text: currentLocked 
        ? `ยินยอมเปิดให้ลบหรือแก้ไขข้อมูลโครงการ "${projName}"`
        : `สั่งล็อกโครงการ "${projName}" ห้ามลบโดยผู้ใช้งานทั่วไป`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: currentLocked ? '#059669' : '#d97706',
      cancelButtonColor: '#64748b',
      confirmButtonText: `ยืนยัน${actionText}`,
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.patch(`/projects/${id}/toggle-lock`);
        Swal.fire({ icon: 'success', title: res.data.message, showConfirmButton: false, timer: 1300 });
        fetchProjects(pagination.page);
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะล็อกโครงการได้' });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-300 border border-white/10 flex items-center gap-1.5">
                <FiBriefcase className="w-3.5 h-3.5" />
                <span>การบริหารจัดการระดับสถาบัน</span>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">จัดการโครงการยุทธศาสตร์ทั้งหมด</h1>
            <p className="text-xs md:text-sm text-indigo-200/80 mt-1 font-medium max-w-2xl">
              กำกับ ติดตาม ตรวจสอบรายละเอียด สั่งล็อกห้ามลบ/ปลดล็อก และจัดการแผนงานโครงการยุทธศาสตร์ทุกคณะ/หน่วยงาน
            </p>
          </div>

          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>สร้างโครงการใหม่</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              icon={<FiCalendar className="w-4 h-4 text-primary" />}
              options={[
                { value: '', label: 'ทุกปีงบประมาณ' },
                ...fiscalYears.map(y => ({ value: String(y.id), label: `ปีงบประมาณ พ.ศ. ${y.year} ${y.active ? '(ปัจจุบัน)' : ''}` }))
              ]}
              className="w-full"
            />
          </div>

          {/* Faculty Filter */}
          <div>
            <CustomSelect
              value={facultyId}
              onChange={(val) => {
                setFacultyId(val);
                setDepartmentId('');
              }}
              options={[
                { value: '', label: 'ทุกคณะ / สังกัด' },
                ...faculties.map(f => ({ value: String(f.id), label: f.name }))
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
                ...departments
                  .filter(d => !facultyId || d.facultyId === parseInt(facultyId))
                  .map(d => ({ value: String(d.id), label: d.name }))
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
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 shadow-2xs">
                      <FiCalendar className="w-3.5 h-3.5 text-primary" />
                      <span>ปีงบประมาณ พ.ศ. {project.fiscalYear?.year}</span>
                    </span>
                    {project.isLocked ? (
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <FiLock className="w-3.5 h-3.5 text-amber-600" />
                        <span>ล็อกห้ามลบ</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <FiUnlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ปกติ</span>
                      </span>
                    )}
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
              <div className="lg:w-[350px] shrink-0 bg-slate-50/60 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 md:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider shrink-0">งบประมาณจัดสรร</span>
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60">
                  {/* Admin Lock Toggle Button */}
                  <button
                    onClick={(e) => handleToggleProjectLock(e, project.id, project.isLocked, project.name)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                      project.isLocked
                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={project.isLocked ? "คลิกเพื่อปลดล็อกโครงการ" : "คลิกเพื่อสั่งล็อกโครงการ (ห้ามลบ)"}
                  >
                    {project.isLocked ? <FiLock className="w-4.5 h-4.5" /> : <FiUnlock className="w-4.5 h-4.5" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/projects/${project.id}/edit`);
                    }}
                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                    title="แก้ไขรายละเอียดโครงการ"
                  >
                    <FiEdit className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="ลบโครงการ"
                  >
                    <FiTrash2 className="w-4.5 h-4.5" />
                  </button>
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
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl shadow-soft border border-slate-100 space-y-2">
          <FiBriefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">ไม่พบข้อมูลโครงการ</div>
          <p className="text-xs text-slate-400">ไม่พบรายการโครงการที่ตรงกับเงื่อนไขการค้นหาในขณะนี้</p>
        </div>
      )}

      {/* Pagination */}
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

export default AdminProjects;
