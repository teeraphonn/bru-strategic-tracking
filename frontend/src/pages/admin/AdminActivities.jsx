import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';
import CustomSelect from '../../components/CustomSelect';
import {
  FiActivity,
  FiSearch,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiBriefcase,
  FiImage,
  FiDollarSign,
  FiTrendingUp,
  FiLayers,
  FiTrash2,
  FiEdit,
  FiCheck,
  FiAlertTriangle,
  FiLock,
  FiUnlock,
  FiPlus,
  FiFilter
} from 'react-icons/fi';

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);

  // Fetch filter dropdown options
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [facRes, deptRes, fyRes] = await Promise.all([
          api.get('/master/faculties'),
          api.get('/master/departments'),
          api.get('/master/fiscal-years')
        ]);
        setFaculties(facRes.data || []);
        setDepartments(deptRes.data || []);
        setFiscalYears(fyRes.data || []);
      } catch (err) {
        console.error('Error loading master data for filters:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch activities from backend
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        facultyId: facultyId || undefined,
        departmentId: departmentId || undefined,
        fiscalYearId: fiscalYearId || undefined
      };
      const response = await api.get('/activities', { params });
      setActivities(response.data || []);
    } catch (err) {
      console.error('Failed to load admin activities:', err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถดึงข้อมูลรายการกิจกรรมได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [statusFilter, facultyId, departmentId, fiscalYearId]);

  // Handle Delete Activity
  const handleDeleteActivity = async (id, actName) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบกิจกรรมย่อย?',
      text: `กิจกรรม "${actName}" จะถูกลบถาวรออกจากระบบ`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบกิจกรรม',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/activities/${id}`);
        Swal.fire({ icon: 'success', title: 'ลบกิจกรรมสำเร็จ', showConfirmButton: false, timer: 1200 });
        fetchActivities();
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'ลบกิจกรรมไม่สำเร็จ', text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ' });
      }
    }
  };

  // Handle Toggle Activity Lock Status (Admin)
  const handleToggleActivityLock = async (id, currentLocked, actName) => {
    const actionText = currentLocked ? 'ปลดล็อกแผนงาน' : 'ล็อกแผนงาน';
    const result = await Swal.fire({
      title: `${actionText}กิจกรรม?`,
      text: currentLocked 
        ? `ยินยอมเปิดให้แก้ไขข้อมูลแผนงานของกิจกรรม "${actName}"`
        : `ล็อกแผนงานของกิจกรรม "${actName}" ห้ามแก้ไขหรือลบ`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: currentLocked ? '#059669' : '#d97706',
      cancelButtonColor: '#64748b',
      confirmButtonText: `ยืนยัน${actionText}`,
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.patch(`/activities/${id}/toggle-lock`);
        Swal.fire({ icon: 'success', title: res.data.message, showConfirmButton: false, timer: 1300 });
        fetchActivities();
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะล็อกได้' });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Dark Purple Header Banner (Matching Reference Image) */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-300 border border-white/10 flex items-center gap-1.5">
              <FiActivity className="w-3.5 h-3.5" />
              <span>การบริหารจัดการระดับสถาบัน</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">จัดการกิจกรรมย่อยทั้งหมด</h1>
          <p className="text-xs md:text-sm text-indigo-200/80 mt-1 font-medium max-w-2xl">
            กำกับ ติดตาม ตรวจสอบรายละเอียด สั่งล็อก/ปลดล็อกแผนงาน และจัดการกิจกรรมย่อยทุกโครงการภายในมหาวิทยาลัย
          </p>
        </div>
      </div>

      {/* 2. Modern Rounded Filters Toolbar */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อกิจกรรม / คำอธิบาย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchActivities()}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Fiscal Year Filter */}
          <div>
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

          {/* Status Filter */}
          <div>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="ทุกสถานะกิจกรรม"
              options={[
                { value: 'all', label: 'ทุกสถานะกิจกรรม' },
                { value: 'pending', label: 'กำลังดำเนินการ (Pending)' },
                { value: 'completed', label: 'เสร็จสมบูรณ์ (Completed)' }
              ]}
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
              placeholder="ทุกคณะ / สังกัด"
              options={[
                { value: '', label: 'ทุกคณะ / สังกัด' },
                ...faculties.map(f => ({ value: f.id, label: f.name }))
              ]}
            />
          </div>

          {/* Department Filter */}
          <div>
            <CustomSelect
              value={departmentId}
              onChange={(val) => setDepartmentId(val)}
              placeholder="ทุกภาควิชา / หน่วยงาน"
              options={[
                { value: '', label: 'ทุกภาควิชา / หน่วยงาน' },
                ...departments
                  .filter(d => !facultyId || d.facultyId === parseInt(facultyId))
                  .map(d => ({ value: d.id, label: d.name }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* 3. Table or Empty State Card */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-3xl shadow-soft border border-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : activities.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">ชื่อกิจกรรมย่อย / กำหนดการ</th>
                  <th className="py-4 px-5">โครงการหลักต้นสังกัด</th>
                  <th className="py-4 px-5">สังกัด / ภาควิชา</th>
                  <th className="py-4 px-5 text-right">งบแผน / เบิกจริง</th>
                  <th className="py-4 px-5 text-center">สถานะการล็อก</th>
                  <th className="py-4 px-5 text-center">การจัดการ (Admin Control)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {activities.map((act) => {
                  const budgetNum = parseFloat(act.budget) || 0;
                  const actualNum = parseFloat(act.actualBudget) || 0;
                  const isOverBudget = actualNum > budgetNum;

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Date */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-extrabold text-slate-800 line-clamp-1">{act.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          <span>{new Date(act.activityDate).toLocaleDateString('th-TH')}</span>
                        </div>
                      </td>

                      {/* Project Name */}
                      <td className="py-4 px-5 max-w-xs">
                        <Link 
                          to={`/projects/${act.project?.id}`}
                          className="font-bold text-slate-700 hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
                        >
                          <FiBriefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{act.project?.name}</span>
                        </Link>
                        <div className="text-[10px] text-slate-400 font-medium">ปีงบประมาณ พ.ศ. {act.project?.fiscalYear?.year}</div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-5">
                        <span className="text-[11px] font-bold text-slate-600">
                          {act.project?.department?.name || 'ส่วนกลาง'}
                        </span>
                      </td>

                      {/* Budget comparison */}
                      <td className="py-4 px-5 text-right">
                        <div className="font-extrabold text-slate-800">{budgetNum.toLocaleString()} ฿</div>
                        <div className="text-[10px] font-bold mt-0.5">
                          {act.actualBudget ? (
                            <span className={isOverBudget ? 'text-rose-600 font-black' : 'text-emerald-600'}>
                              จ่ายจริง: {actualNum.toLocaleString()} ฿
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">ยังไม่เบิกจ่าย</span>
                          )}
                        </div>
                      </td>

                      {/* Lock Status */}
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActivityLock(act.id, act.isLocked, act.name)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                            act.isLocked 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title="คลิกเพื่อสั่งล็อก / ปลดล็อกแผนงาน"
                        >
                          {act.isLocked ? (
                            <>
                              <FiLock className="w-3 h-3 text-amber-600" />
                              <span>แผนถูกล็อก</span>
                            </>
                          ) : (
                            <>
                              <FiUnlock className="w-3 h-3 text-emerald-600" />
                              <span>แผนเปิดให้แก้ไข</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/projects/${act.project?.id}`}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-primary text-white rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                            title="ตรวจสอบ/บันทึกกิจกรรมในโครงการ"
                          >
                            <span>รายละเอียด</span>
                            <FiArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id, act.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="ลบกิจกรรมย่อยนี้"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl shadow-soft border border-slate-100 space-y-2">
          <FiActivity className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">ไม่พบข้อมูลกิจกรรม</div>
          <p className="text-xs text-slate-400">ไม่พบรายการกิจกรรมย่อยที่ตรงกับเงื่อนไขการค้นหาในขณะนี้</p>
        </div>
      )}
    </div>
  );
};

export default AdminActivities;
