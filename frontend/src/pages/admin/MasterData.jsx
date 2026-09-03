import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useSearchParams, Link } from 'react-router-dom';
import CustomSelect from '../../components/CustomSelect';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiDatabase,
  FiGitCommit,
  FiLayers,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiBookmark,
  FiKey,
  FiDownload,
  FiRefreshCw,
  FiBriefcase,
  FiGlobe,
  FiX
} from 'react-icons/fi';

const MasterData = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'user';
  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [userSortOrder, setUserSortOrder] = useState('id');

  // Filters for User management
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');

  // Filters for Department management
  const [filterDeptFacultyId, setFilterDeptFacultyId] = useState('');

  // Fixed role ranking for strict sorting
  const ROLE_RANK = {
    PRESIDENT: 1,
    ADMIN: 2,
    DEAN: 3,
    TEACHER: 4
  };

  // Modal specific state for dynamic dependent dropdowns
  const [modalFacultyId, setModalFacultyId] = useState('');

  const roleWeights = {
    PRESIDENT: 1,
    ADMIN: 2,
    DEAN: 3,
    TEACHER: 4
  };

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [localIssues, setLocalIssues] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [subStrategies, setSubStrategies] = useState([]);

  // Calculate dynamic 2-digit faculty codes (00 for "ส่วนกลาง", 01+ for others)
  const getFacultyCode = (fac) => {
    if (!fac) return '00';
    if (fac.name === 'ส่วนกลาง') return '00';
    const nonCentral = faculties
      .filter(f => f.name !== 'ส่วนกลาง')
      .sort((a, b) => a.id - b.id);
    const idx = nonCentral.findIndex(f => f.id === fac.id);
    const seq = idx !== -1 ? idx + 1 : fac.id;
    return String(seq).padStart(2, '0');
  };

  // Calculate dynamic hierarchical department codes based on faculty (4 digits)
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

  // Calculate dynamic personnel code: [Dept Code][Seq Number] (Total 6 digits)
  const getUserCode = (usr) => {
    if (!usr) return '';
    const deptId = usr.departmentId || 0;
    
    // Find all users in the same department, sorted by ID
    const siblingUsers = data
      .filter(u => (u.departmentId || 0) === deptId)
      .sort((a, b) => a.id - b.id);
      
    const index = siblingUsers.findIndex(u => u.id === usr.id);
    const seq = String(index !== -1 ? index + 1 : 1).padStart(2, '0');
    
    if (usr.department) {
      const deptCode = getDeptCode(usr.department);
      return `${deptCode}${seq}`;
    } else {
      // Unaffiliated users get a central code sequence
      return `0000${seq}`;
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});

  const tabs = [
    { id: 'user', name: 'ผู้ใช้งาน', icon: <FiUsers /> },
    { id: 'local-issue', name: 'ประเด็นการพัฒนาท้องถิ่น', icon: <FiGlobe /> },
    { id: 'strategy', name: 'แผนงานหลัก', icon: <FiDatabase /> },
    { id: 'sub-strategy', name: 'แผนงานย่อย', icon: <FiGitCommit /> },
    { id: 'indicator', name: 'โครงการหลัก (MP)', icon: <FiBriefcase /> },
    { id: 'fiscal-year', name: 'ปีงบประมาณ', icon: <FiCalendar /> },
    { id: 'budget-source', name: 'แหล่งงบประมาณ', icon: <FiDollarSign /> },
    { id: 'faculty', name: 'คณะ', icon: <FiBookmark /> },
    { id: 'department', name: 'ภาควิชา/หน่วยงาน', icon: <FiLayers /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = `/master/faculties`;
      if (activeTab === 'local-issue') endpoint = `/master/local-issues`;
      else if (activeTab === 'department') endpoint = `/master/departments`;
      else if (activeTab === 'strategy') endpoint = `/master/strategies`;
      else if (activeTab === 'sub-strategy') endpoint = `/master/sub-strategies`;
      else if (activeTab === 'indicator') endpoint = `/master/indicators`;
      else if (activeTab === 'user') endpoint = `/master/users`;
      else if (activeTab === 'fiscal-year') endpoint = `/master/fiscal-years`;
      else if (activeTab === 'budget-source') endpoint = `/master/budget-sources`;

      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err) {
      console.error('Fetch data error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
        text: `${errorMsg} (หากเซิร์ฟเวอร์เพิ่งอัปเดตหรือกำลังเริ่มระบบ กรุณารอ 10-20 วินาทีแล้วรีเฟรชอีกครั้ง)`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/master/faculties'),
        api.get('/master/departments'),
        api.get('/master/strategies'),
        api.get('/master/sub-strategies'),
        api.get('/master/local-issues')
      ]);
      if (results[0].status === 'fulfilled') setFaculties(results[0].value.data);
      if (results[1].status === 'fulfilled') setDepartments(results[1].value.data);
      if (results[2].status === 'fulfilled') setStrategies(results[2].value.data);
      if (results[3].status === 'fulfilled') setSubStrategies(results[3].value.data);
      if (results[4].status === 'fulfilled') setLocalIssues(results[4].value.data);
    } catch (err) {
      console.error('Failed to load relation options:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelations();
    setFilterFacultyId('');
    setFilterDepartmentId('');
    setFilterDeptFacultyId('');
  }, [activeTab]);

  const handleCreate = () => {
    setEditId(null);
    const initialForm = {};
    if (activeTab === 'fiscal-year') {
      initialForm.year = new Date().getFullYear() + 543;
      initialForm.active = false;
    } else if (activeTab === 'user') {
      initialForm.role = 'TEACHER';
      setModalFacultyId('');
    }
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    const form = { ...item };
    if (activeTab === 'strategy') form.localIssueId = item.localIssueId || '';
    if (activeTab === 'department') form.facultyId = item.facultyId || '';
    if (activeTab === 'sub-strategy') form.strategyId = item.strategyId || '';
    if (activeTab === 'indicator') form.subStrategyId = item.subStrategyId || '';
    if (activeTab === 'user') {
      form.departmentId = item.departmentId || '';
      form.password = '';
      const userDept = departments.find(d => d.id === item.departmentId);
      setModalFacultyId(userDept ? String(userDept.facultyId || '') : '');
    }
    setFormData(form);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = `/master/faculties`;
      if (activeTab === 'local-issue') endpoint = `/master/local-issues`;
      else if (activeTab === 'department') endpoint = `/master/departments`;
      else if (activeTab === 'strategy') endpoint = `/master/strategies`;
      else if (activeTab === 'sub-strategy') endpoint = `/master/sub-strategies`;
      else if (activeTab === 'indicator') endpoint = `/master/indicators`;
      else if (activeTab === 'user') endpoint = `/master/users`;
      else if (activeTab === 'fiscal-year') endpoint = `/master/fiscal-years`;
      else if (activeTab === 'budget-source') endpoint = `/master/budget-sources`;

      const payload = { ...formData };

      if (payload.localIssueId && !isNaN(parseInt(payload.localIssueId))) payload.localIssueId = parseInt(payload.localIssueId);
      else delete payload.localIssueId;

      if (payload.facultyId && !isNaN(parseInt(payload.facultyId))) payload.facultyId = parseInt(payload.facultyId);
      else delete payload.facultyId;

      if (payload.strategyId && !isNaN(parseInt(payload.strategyId))) payload.strategyId = parseInt(payload.strategyId);
      else delete payload.strategyId;

      if (payload.subStrategyId && !isNaN(parseInt(payload.subStrategyId))) payload.subStrategyId = parseInt(payload.subStrategyId);
      else delete payload.subStrategyId;

      if (payload.departmentId && !isNaN(parseInt(payload.departmentId))) payload.departmentId = parseInt(payload.departmentId);
      else payload.departmentId = null;

      if (payload.year && !isNaN(parseInt(payload.year))) payload.year = parseInt(payload.year);

      if (editId) {
        await api.put(`${endpoint}/${editId}`, payload);
        Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสำเร็จ', showConfirmButton: false, timer: 1200 });
      } else {
        await api.post(endpoint, payload);
        Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', showConfirmButton: false, timer: 1200 });
      }
      setModalOpen(false);
      fetchData();
      fetchRelations();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'โปรดตรวจสอบความถูกต้องของข้อมูล';
      Swal.fire({ icon: 'error', title: 'การบันทึกข้อมูลล้มเหลว', text: errorMsg });
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'ต้องการลบข้อมูลนี้?',
      text: "การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลที่เกี่ยวเนื่องกันอาจได้รับผลกระทบ!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6C3BFF',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'ใช่, ฉันต้องการลบ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let endpoint = `/master/faculties`;
          if (activeTab === 'local-issue') endpoint = `/master/local-issues`;
          else if (activeTab === 'department') endpoint = `/master/departments`;
          else if (activeTab === 'strategy') endpoint = `/master/strategies`;
          else if (activeTab === 'sub-strategy') endpoint = `/master/sub-strategies`;
          else if (activeTab === 'indicator') endpoint = `/master/indicators`;
          else if (activeTab === 'user') endpoint = `/master/users`;
          else if (activeTab === 'fiscal-year') endpoint = `/master/fiscal-years`;
          else if (activeTab === 'budget-source') endpoint = `/master/budget-sources`;

          await api.delete(`${endpoint}/${id}`);
          Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', showConfirmButton: false, timer: 1200 });
          fetchData();
          fetchRelations();
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'ลบข้อมูลไม่สำเร็จ', text: err.response?.data?.message || 'ข้อมูลนี้ถูกใช้งานร่วมกับโมดูลอื่นอยู่' });
        }
      }
    });
  };

  // Quick reset user password
  const handleResetPassword = (usr) => {
    Swal.fire({
      title: 'ยืนยันรีเซ็ตรหัสผ่าน?',
      html: `ต้องการรีเซ็ตรหัสผ่านสำหรับ <b>${usr.name}</b> (${usr.username}) เป็นค่าเริ่มต้น <code>123456</code> ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, รีเซ็ตรหัสผ่าน',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.post(`/master/users/${usr.id}/reset-password`);
          Swal.fire({
            icon: 'success',
            title: 'รีเซ็ตรหัสผ่านสำเร็จ',
            html: `รหัสผ่านใหม่คือ: <b class="text-primary text-base font-mono">${res.data.defaultPassword || '123456'}</b>`,
            confirmButtonColor: '#6C3BFF'
          });
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: err.response?.data?.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้'
          });
        }
      }
    });
  };

  // Clear system cache & maintenance
  const handleClearSystemCache = async () => {
    try {
      await api.post('/master/system/clear-cache');
      Swal.fire({
        icon: 'success',
        title: 'ล้างแคชระบบสำเร็จ',
        text: 'รีเฟรชข้อมูลและสถานะการเชื่อมต่อล่าสุดเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
      fetchRelations();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถล้างแคชได้' });
    }
  };

  // Export current table view as decorated A4 PDF
  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/reports/export/master-pdf?tab=${activeTab}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MasterData_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถสร้างรายงาน PDF ได้' });
    }
  };

  const filteredData = data.filter(item => {
    const text = search.toLowerCase();

    // Affiliation filtering for User tab
    if (activeTab === 'user') {
      if (filterFacultyId && item.department?.facultyId !== parseInt(filterFacultyId)) {
        return false;
      }
      if (filterDepartmentId && item.departmentId !== parseInt(filterDepartmentId)) {
        return false;
      }
    }

    // Faculty filtering for Department tab
    if (activeTab === 'department') {
      if (filterDeptFacultyId && item.facultyId !== parseInt(filterDeptFacultyId)) {
        return false;
      }
    }

    return (
      (item.name && item.name.toLowerCase().includes(text)) ||
      (item.code && item.code.toLowerCase().includes(text)) ||
      (item.username && item.username.toLowerCase().includes(text)) ||
      (item.year && String(item.year).includes(text))
    );
  });

  const getSortedData = () => {
    if (activeTab === 'user') {
      return [...filteredData].sort((a, b) => {
        return getUserCode(a).localeCompare(getUserCode(b));
      });
    }
    if (activeTab === 'department') {
      return [...filteredData].sort((a, b) => {
        return getDeptCode(a).localeCompare(getDeptCode(b));
      });
    }
    if (activeTab === 'faculty') {
      return [...filteredData].sort((a, b) => {
        return getFacultyCode(a).localeCompare(getFacultyCode(b));
      });
    }
    return [...filteredData].sort((a, b) => a.id - b.id);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Top Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-300 border border-white/10 flex items-center gap-1.5">
              <FiDatabase className="w-3.5 h-3.5" />
              <span>การบริหารจัดการข้อมูลฐาน</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">จัดการข้อมูลพื้นฐานระบบ (Master Data)</h1>
          <p className="text-xs md:text-sm text-indigo-200/80 mt-1 font-medium max-w-2xl">
            ตั้งค่าและจัดการโครงสร้างหลักของมหาวิทยาลัย ได้แก่ คณะ ภาควิชา แผนงานหลัก (Program) แผนงานย่อย (Sub-Program) โครงการหลัก (Main Project) ปีงบประมาณ และสิทธิ์ผู้ใช้งาน
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-center shrink-0">
          <button
            onClick={handleClearSystemCache}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 hover:text-white rounded-2xl border border-white/15 backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-sm"
            title="ล้างแคชและรีเฟรชข้อมูล"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ล้างแคชระบบ</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-2xl shadow-sm border border-rose-200 active:scale-95 transition-all cursor-pointer"
            title="พิมพ์และดาวน์โหลดรายงานข้อมูลหลักเป็นเอกสาร PDF"
          >
            <FiDownload className="w-4 h-4 text-rose-600" />
            <span>พิมพ์รายงาน PDF</span>
          </button>

          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>{activeTab === 'faculty' ? 'เพิ่มคณะ' : 'เพิ่มข้อมูลใหม่'}</span>
          </button>
        </div>
      </div>

      {/* 2. Master Data In-Page Horizontal Tab Navigation Ribbon */}
      <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-soft overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'user', name: 'ผู้ใช้งาน', icon: <FiUsers className="w-4 h-4" /> },
            { id: 'local-issue', name: 'ประเด็นการพัฒนาท้องถิ่น', icon: <FiGlobe className="w-4 h-4" /> },
            { id: 'strategy', name: 'แผนงานหลัก', icon: <FiDatabase className="w-4 h-4" /> },
            { id: 'sub-strategy', name: 'แผนงานย่อย', icon: <FiGitCommit className="w-4 h-4" /> },
            { id: 'indicator', name: 'โครงการหลัก', icon: <FiBriefcase className="w-4 h-4" /> },
            { id: 'fiscal-year', name: 'ปีงบประมาณ', icon: <FiCalendar className="w-4 h-4" /> },
            { id: 'budget-source', name: 'แหล่งงบประมาณ', icon: <FiDollarSign className="w-4 h-4" /> },
            { id: 'faculty', name: 'คณะ', icon: <FiBookmark className="w-4 h-4" /> },
            { id: 'department', name: 'ภาควิชา/หน่วยงาน', icon: <FiLayers className="w-4 h-4" /> },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filter and Sorting Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-soft max-w-md w-full">
          <FiSearch className="text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาข้อมูลหลัก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filters inline (Only for 'user' tab) */}
        {activeTab === 'user' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Faculty Dropdown */}
            <div className="min-w-[200px]">
              <CustomSelect
                value={filterFacultyId}
                onChange={(val) => {
                  setFilterFacultyId(val);
                  setFilterDepartmentId('');
                }}
                placeholder="🏛️ ทั้งหมดทุกคณะ"
                options={[
                  { value: '', label: '🏛️ ทั้งหมดทุกคณะ' },
                  ...faculties.map(f => ({ value: String(f.id), label: f.name }))
                ]}
              />
            </div>

            {/* Department Dropdown */}
            <div className="min-w-[200px]">
              <CustomSelect
                value={filterDepartmentId}
                onChange={(val) => setFilterDepartmentId(val)}
                placeholder="🏢 ทั้งหมดทุกภาควิชา"
                options={[
                  { value: '', label: '🏢 ทั้งหมดทุกภาควิชา' },
                  ...departments
                    .filter(d => !filterFacultyId || d.facultyId === parseInt(filterFacultyId))
                    .map(d => ({ value: String(d.id), label: d.name }))
                ]}
              />
            </div>
          </div>
        )}

        {/* Filters inline (Only for 'department' tab) */}
        {activeTab === 'department' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Faculty Dropdown */}
            <div className="min-w-[240px]">
              <CustomSelect
                value={filterDeptFacultyId}
                onChange={(val) => setFilterDeptFacultyId(val)}
                placeholder="🏛️ กรองตามคณะ (ทั้งหมด)"
                options={[
                  { value: '', label: '🏛️ กรองตามคณะ (ทั้งหมด)' },
                  ...faculties.map(f => ({ value: String(f.id), label: f.name }))
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid or Table Content */}
      {activeTab === 'faculty' ? (
        loading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-soft border border-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : getSortedData().length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSortedData().map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl border border-gray-100 shadow-soft p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
              >
                {/* Visual decoration top color line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-violet-500"></div>

                <div>
                  {/* Faculty Name */}
                  <h3 className="text-base font-bold text-gray-800 tracking-tight group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>

                  {/* Faculty Details */}
                  <div className="mt-4 space-y-2.5 text-xs text-gray-500 font-semibold">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <span className="text-gray-400">รหัสคณะ:</span>
                      <span className="text-gray-700 font-bold">{getFacultyCode(item)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <span className="text-gray-400">คณบดี:</span>
                      <span className="text-gray-700 font-bold">{item.dean}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <span className="text-gray-400">สาขา/ภาควิชา:</span>
                      <span className="text-primary font-bold">{item.departmentsCount} ภาควิชา</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <span className="text-gray-400">โครงการทั้งหมด:</span>
                      <span className="text-gray-700 font-bold">{item.projectsCount} โครงการ</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500">
                      <span>ความก้าวหน้ารวม:</span>
                      <span className="text-primary font-bold">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary to-violet-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex gap-2.5 justify-end pt-5 mt-6 border-t border-slate-50">
                  <Link
                    to={`/projects?facultyId=${item.id}`}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>ดูรายละเอียด</span>
                  </Link>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-primary hover:bg-primary-light rounded-lg border border-transparent hover:border-primary/10 transition-colors"
                    title="แก้ไข"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                    title="ลบ"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-soft border border-gray-100 text-xs text-gray-400">
            ยังไม่มีข้อมูลคณะในระบบ
          </div>
        )
      ) : (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden w-full">
          {/* Mobile swipe hint banner */}
          <div className="sm:hidden px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/70 text-[11px] font-bold text-primary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>👉</span>
              <span>เลื่อนตารางไปทางขวาเพื่อดูข้อมูลทั้งหมด</span>
            </span>
            <span className="text-[10px] text-purple-400 font-medium">(แนวนอน)</span>
          </div>

          <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm text-left border-collapse min-w-[760px] md:min-w-[880px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-gray-100 text-[11px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {activeTab === 'department' && (
                    <>
                      <th className="w-24 px-4 py-3.5">รหัสคณะ</th>
                      <th className="min-w-[190px] px-4 py-3.5">สังกัดคณะ</th>
                      <th className="w-28 px-4 py-3.5">รหัสภาควิชา</th>
                      <th className="min-w-[240px] px-4 py-3.5">ภาควิชา/หน่วยงาน</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'user' && (
                    <>
                      <th className="w-24 px-4 py-3.5">รหัสบุคลากร</th>
                      <th className="w-36 px-4 py-3.5">บัญชีผู้ใช้</th>
                      <th className="min-w-[190px] px-4 py-3.5">ชื่อ-นามสกุล</th>
                      <th className="w-32 px-4 py-3.5">สิทธิ์การใช้งาน</th>
                      <th className="min-w-[170px] px-4 py-3.5">สังกัดคณะ</th>
                      <th className="min-w-[190px] px-4 py-3.5">ภาควิชา/หน่วยงาน</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'local-issue' && (
                    <>
                      <th className="w-24 px-4 py-3.5">รหัส</th>
                      <th className="min-w-[340px] px-4 py-3.5">ประเด็นการพัฒนาท้องถิ่น</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'strategy' && (
                    <>
                      <th className="w-24 px-4 py-3.5">รหัส</th>
                      <th className="min-w-[340px] px-4 py-3.5">แผนงานหลัก</th>
                      <th className="min-w-[260px] px-4 py-3.5">ประเด็นการพัฒนาท้องถิ่น</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'sub-strategy' && (
                    <>
                      <th className="w-24 px-4 py-3.5">รหัส</th>
                      <th className="min-w-[280px] px-4 py-3.5">แผนงานย่อย</th>
                      <th className="min-w-[260px] px-4 py-3.5">แผนงานหลัก</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'indicator' && (
                    <>
                      <th className="w-28 px-4 py-3.5">รหัส (MP)</th>
                      <th className="min-w-[280px] px-4 py-3.5">โครงการหลัก (Main Project)</th>
                      <th className="min-w-[260px] px-4 py-3.5">แผนงานย่อย (Sub-Strategy)</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'fiscal-year' && (
                    <>
                      <th className="w-36 px-4 py-3.5">ปีงบประมาณ</th>
                      <th className="min-w-[220px] px-4 py-3.5">การใช้งานหลัก</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                  {activeTab === 'budget-source' && (
                    <>
                      <th className="w-20 px-4 py-3.5">ID</th>
                      <th className="min-w-[340px] px-4 py-3.5">แหล่งที่มางบประมาณ</th>
                      <th className="w-24 px-4 py-3.5 text-center">จัดการ</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </td>
                  </tr>
                ) : getSortedData().length > 0 ? (
                  getSortedData().map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {activeTab === 'department' && (
                        <>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-slate-500 truncate align-middle">
                            {getFacultyCode(item.faculty)}
                          </td>
                          <td className="px-3.5 py-2.5 align-middle">
                            {item.faculty?.name ? (
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 shadow-3xs inline-flex items-start gap-1 max-w-full leading-tight">
                                <span className="shrink-0 mt-0.5 text-xs">🏛️</span>
                                <span className="leading-snug">{item.faculty.name.startsWith('คณะ') ? item.faculty.name : `คณะ${item.faculty.name}`}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 inline-flex items-start gap-1 leading-tight">
                                <span className="shrink-0 mt-0.5 text-xs">🏛️</span>
                                <span className="leading-snug">ส่วนกลางมหาวิทยาลัย</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-black text-primary truncate align-middle">
                            {getDeptCode(item)}
                          </td>
                          <td className="px-3.5 py-2.5 font-extrabold text-slate-800 text-xs align-middle">
                            <span className="leading-snug">{item.name}</span>
                          </td>
                        </>
                      )}

                      {activeTab === 'user' && (
                        <>
                          <td className="px-3 py-2.5 truncate align-middle">
                            <span className="font-mono text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                              {getUserCode(item)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 truncate align-middle">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                              {item.username}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-violet-500 text-white font-black text-[10px] flex items-center justify-center shadow-3xs shrink-0">
                                {item.name ? item.name.charAt(0) : 'U'}
                              </div>
                              <span className="font-extrabold text-slate-800 text-xs leading-snug" title={item.name}>{item.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 truncate align-middle">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-xl border inline-flex items-center gap-1 shadow-3xs ${
                              item.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              item.role === 'PRESIDENT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              item.role === 'DEAN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <span>
                                {item.role === 'ADMIN' ? '🛡️' : item.role === 'PRESIDENT' ? '👑' : item.role === 'DEAN' ? '🏛️' : '👨‍🏫'}
                              </span>
                              <span>{item.role}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            {item.department?.faculty?.name ? (
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 shadow-3xs inline-flex items-start gap-1 max-w-full leading-tight">
                                <span className="shrink-0 mt-0.5 text-xs">🏛️</span>
                                <span className="leading-snug">{item.department.faculty.name.startsWith('คณะ') ? item.department.faculty.name : `คณะ${item.department.faculty.name}`}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 inline-flex items-start gap-1 leading-tight">
                                <span className="shrink-0 mt-0.5 text-xs">🏛️</span>
                                <span className="leading-snug">ส่วนกลางมหาวิทยาลัย</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            {item.department?.name ? (
                              <span className="text-xs font-bold text-slate-700 flex items-start gap-1.5 leading-snug" title={item.department.name}>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5"></span>
                                <span className="leading-snug">{item.department.name}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium italic">
                                — (ไม่สังกัดภาควิชา)
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {activeTab === 'local-issue' && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-violet-700 whitespace-nowrap align-top">{item.code}</td>
                          <td className="px-4 py-3 text-slate-800 font-bold break-words leading-relaxed align-top">{item.name}</td>
                        </>
                      )}

                      {activeTab === 'strategy' && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-purple-700 whitespace-nowrap align-top">{item.code}</td>
                          <td className="px-4 py-3 text-slate-800 font-bold break-words leading-relaxed align-top">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium break-words leading-relaxed align-top">{item.localIssue?.name || '—'}</td>
                        </>
                      )}

                      {activeTab === 'sub-strategy' && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap align-top">{item.code}</td>
                          <td className="px-4 py-3 text-slate-800 font-bold break-words leading-relaxed align-top" title={item.name}>{item.name}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium break-words leading-relaxed align-top" title={item.strategy?.name}>{item.strategy?.name || '—'}</td>
                        </>
                      )}

                      {activeTab === 'indicator' && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700 whitespace-nowrap align-top">{item.code}</td>
                          <td className="px-4 py-3 text-slate-800 font-bold break-words leading-relaxed align-top" title={item.name}>{item.name}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium break-words leading-relaxed align-top" title={item.subStrategy?.name}>{item.subStrategy?.name || '—'}</td>
                        </>
                      )}

                      {activeTab === 'fiscal-year' && (
                        <>
                          <td className="px-4 py-3 font-mono font-black text-slate-800 whitespace-nowrap align-top">ปี {item.year}</td>
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${item.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {item.active ? 'เปิดใช้งานหลัก' : 'ปิดใช้งาน'}
                            </span>
                          </td>
                        </>
                      )}

                      {activeTab === 'budget-source' && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-slate-500 whitespace-nowrap align-top">#{item.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800 break-words leading-relaxed align-top">{item.name}</td>
                        </>
                      )}

                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {activeTab === 'user' && (
                            <button
                              onClick={() => handleResetPassword(item)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200 shrink-0"
                              title="รีเซ็ตรหัสผ่านเป็น 123456"
                            >
                              <FiKey className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-primary hover:bg-primary-light rounded-lg transition-colors border border-transparent hover:border-primary/20 shrink-0"
                            title="แก้ไข"
                          >
                            <FiEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 shrink-0"
                            title="ลบ"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-xs text-gray-400">ไม่มีข้อมูลหลักในหมวดหมู่นี้</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal dialog */}
      {modalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className={`w-full max-w-md ${activeTab === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-gray-800'} rounded-3xl shadow-2xl border ${activeTab === 'user' ? 'border-slate-800' : 'border-gray-100'} overflow-hidden max-h-[90vh] flex flex-col my-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${activeTab === 'user' ? 'border-slate-800' : 'border-gray-100'} shrink-0`}>
              <h3 className={`text-base font-bold ${activeTab === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {editId ? `แก้ไขข้อมูล (${tabs.find(t => t.id === activeTab)?.name})` : `เพิ่มข้อมูล (${tabs.find(t => t.id === activeTab)?.name})`}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="ปิดหน้าต่าง"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {activeTab === 'faculty' && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อคณะ</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                    placeholder="กรอกชื่อคณะ (มรภ.บุรีรัมย์)"
                    required
                  />
                </div>
              )}

              {activeTab === 'department' && (
                <>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อภาควิชา/หน่วยงาน</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="กรอกชื่อหน่วยงาน"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">สังกัดคณะ (ถ้ามี)</label>
                    <CustomSelect
                      value={formData.facultyId ? String(formData.facultyId) : ''}
                      onChange={(val) => setFormData({ ...formData, facultyId: val })}
                      placeholder="หน่วยงานส่วนกลาง (ไม่สังกัดคณะ)"
                      options={[
                        { value: '', label: 'หน่วยงานส่วนกลาง (ไม่สังกัดคณะ)' },
                        ...faculties.map(f => ({ value: String(f.id), label: f.name }))
                      ]}
                    />
                  </div>
                </>
              )}

              {activeTab === 'local-issue' && (
                <>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">รหัสประเด็นการพัฒนาท้องถิ่น (เช่น LDI1)</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="เช่น LDI1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อประเด็นการพัฒนาท้องถิ่น</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="กรอกชื่อประเด็นการพัฒนาท้องถิ่น"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'strategy' && (
                <>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ประเด็นการพัฒนาท้องถิ่น (ถ้ามี)</label>
                    <CustomSelect
                      value={formData.localIssueId ? String(formData.localIssueId) : ''}
                      onChange={(val) => setFormData({ ...formData, localIssueId: val })}
                      placeholder="-- เลือกประเด็นการพัฒนาท้องถิ่น --"
                      options={[
                        { value: '', label: '-- ไม่ระบุ --' },
                        ...localIssues.map(li => ({
                          value: String(li.id),
                          label: `${li.code} - ${li.name}`
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">รหัสแผนงานหลัก (เช่น S1)</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="เช่น S1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อแผนงานหลัก</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="กรอกชื่อแผนงานหลัก"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'sub-strategy' && (
                <>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">แผนงานหลัก</label>
                    <CustomSelect
                      value={formData.strategyId ? String(formData.strategyId) : ''}
                      onChange={(val) => setFormData({ ...formData, strategyId: val })}
                      placeholder="-- เลือกแผนงานหลัก --"
                      options={strategies.map(s => ({
                        value: String(s.id),
                        label: `${s.code} - ${s.name}`
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">รหัสแผนงานย่อย (เช่น SS1.1)</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="เช่น SS1.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อแผนงานย่อย</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="กรอกชื่อแผนงานย่อย"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'indicator' && (
                <>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">แผนงานย่อย</label>
                    <CustomSelect
                      value={formData.subStrategyId ? String(formData.subStrategyId) : ''}
                      onChange={(val) => setFormData({ ...formData, subStrategyId: val })}
                      placeholder="-- เลือกแผนงานย่อย --"
                      options={subStrategies.map(ss => ({
                        value: String(ss.id),
                        label: `${ss.code} - ${ss.name}`
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">รหัสโครงการหลัก (เช่น MP1.1)</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="เช่น MP1.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อโครงการหลัก</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="กรอกชื่อโครงการหลัก"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'user' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">ชื่อเข้าใช้ระบบ (Username)</label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm disabled:opacity-50 disabled:bg-slate-900"
                      placeholder="ชื่อผู้ใช้งาน"
                      required
                      disabled={!!editId}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      รหัสผ่าน {editId && <span className="text-[10px] text-slate-300">(เว้นว่างไว้เพื่อคงรหัสผ่านเดิม)</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                      placeholder="รหัสผ่านบัญชี"
                      required={!editId}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">ชื่อ-นามสกุลจริง</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                      placeholder="คำนำหน้าและชื่อนามสกุล"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">บทบาทระบบ (Role)</label>
                    <CustomSelect
                      value={formData.role || 'TEACHER'}
                      onChange={(val) => setFormData({ ...formData, role: val })}
                      dark={true}
                      options={[
                        { value: 'ADMIN', label: 'ADMIN (ผู้ดูแลระบบ)' },
                        { value: 'PRESIDENT', label: 'PRESIDENT (อธิการบดี)' },
                        { value: 'DEAN', label: 'DEAN (คณบดี)' },
                        { value: 'TEACHER', label: 'TEACHER (อาจารย์ / เจ้าหน้าที่)' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">สังกัดคณะ</label>
                    <CustomSelect
                      value={modalFacultyId ? String(modalFacultyId) : ''}
                      onChange={(val) => {
                        setModalFacultyId(val);
                        setFormData({ ...formData, departmentId: '' });
                      }}
                      dark={true}
                      placeholder="-- กรุณาเลือกคณะ / ส่วนกลาง --"
                      options={[
                        { value: '', label: '-- กรุณาเลือกคณะ / ส่วนกลาง --' },
                        ...faculties.map(f => ({ value: String(f.id), label: f.name }))
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">สังกัดภาควิชา/หน่วยงาน</label>
                    <CustomSelect
                      value={formData.departmentId ? String(formData.departmentId) : ''}
                      onChange={(val) => setFormData({ ...formData, departmentId: val })}
                      dark={true}
                      disabled={!modalFacultyId}
                      placeholder="-- กรุณาเลือกภาควิชา/หน่วยงานย่อย --"
                      options={[
                        { value: '', label: '-- กรุณาเลือกภาควิชา/หน่วยงานย่อย --' },
                        ...departments
                          .filter(d => d.facultyId === parseInt(modalFacultyId))
                          .map(d => ({ value: String(d.id), label: d.name }))
                      ]}
                    />
                  </div>
                </>
              )}

              {activeTab === 'fiscal-year' && (
                <>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ปีงบประมาณ (พ.ศ.)</label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                      placeholder="เช่น 2569"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={!!formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="active" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      กำหนดปีงบประมาณนี้ให้เปิดใช้การติดตามผลหลัก
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'budget-source' && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ชื่อแหล่งงบประมาณ</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all hover:border-slate-300 text-slate-700 font-semibold"
                    placeholder="เช่น งบรายได้มหาวิทยาลัย"
                    required
                  />
                </div>
              )}

              <div className={`flex gap-3 justify-end pt-4 border-t ${activeTab === 'user' ? 'border-slate-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'user' ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-md transition-all cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MasterData;
