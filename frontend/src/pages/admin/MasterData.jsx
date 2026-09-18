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

/**
 * ====================================================================================
 * คอมโพเนนต์: MasterData (การบริหารจัดการข้อมูลพื้นฐานระบบ)
 * บทบาทผู้ใช้งาน: ADMIN (ผู้ดูแลระบบสูงสุด)
 * หน้าที่หลัก:
 *   1. จัดการข้อมูลโครงสร้างพื้นฐาน 9 หมวดหมู่ (ผู้ใช้งาน, ประเด็นท้องถิ่น, แผนงานหลัก,
 *      แผนงานย่อย, โครงการหลัก, ปีงบประมาณ, แหล่งเงิน, คณะ, ภาควิชา/หน่วยงาน)
 *   2. กำหนดสิทธิ์และบัญชีผู้ใช้งาน (RBAC: ADMIN, PRESIDENT, DEAN, TEACHER)
 *   3. รันระบบรหัสลำดับชั้นอัตโนมัติ (Hierarchical Coding: คณะ 2 หลัก -> สาขา 4 หลัก -> บุคลากร 6 หลัก)
 *   4. มีระบบค้นหา กรองข้อมูลตามสังกัด และส่งออกรายงานตารางเป็นไฟล์ PDF
 * ====================================================================================
 */
const MasterData = () => {
  // ----------------------------------------------------------------------------------
  // [1] ส่วนจัดการ URL Query Params & แท็บเมนูการทำงาน (Active Tab)
  // ----------------------------------------------------------------------------------
  const [searchParams, setSearchParams] = useSearchParams();
  // ดึงชื่อแท็บปัจจุบันจาก URL (ค่าเริ่มต้นคือแท็บ 'user')
  const activeTab = searchParams.get('tab') || 'user';
  // ฟังก์ชันเปลี่ยนแท็บและอัปเดต Query String ใน URL อัตโนมัติ
  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // ----------------------------------------------------------------------------------
  // [2] State สำหรับการแสดงผลข้อมูลหลัก ตาราง การโหลด และการค้นหา
  // ----------------------------------------------------------------------------------
  const [data, setData] = useState([]);                     // ข้อมูลรายการในแท็บปัจจุบันที่ดึงมาจาก API
  const [loading, setLoading] = useState(false);             // สถานะการโหลดข้อมูล (แสดง Spinner ขณะรอ API)
  const [search, setSearch] = useState('');                  // ข้อความค้นหาในช่อง Search Input
  const [userSortOrder, setUserSortOrder] = useState('id');  // ลำดับการเรียงลำดับข้อมูลผู้ใช้

  // ----------------------------------------------------------------------------------
  // [3] State สำหรับตัวกรองขั้นสูง (Cascading Filters)
  // ----------------------------------------------------------------------------------
  // ตัวกรองเฉพาะแท็บจัดการผู้ใช้ (User Management)
  const [filterFacultyId, setFilterFacultyId] = useState('');       // กรองผู้ใช้งานตามสังกัดคณะ
  const [filterDepartmentId, setFilterDepartmentId] = useState(''); // กรองผู้ใช้งานตามสังกัดภาควิชา

  // ตัวกรองเฉพาะแท็บจัดการภาควิชา/หน่วยงาน (Department Management)
  const [filterDeptFacultyId, setFilterDeptFacultyId] = useState(''); // กรองภาควิชาตามสังกัดคณะ

  // ลำดับความสำคัญของบทบาทผู้ใช้งาน สำหรับใช้ในการจัดเรียงความสำคัญ (Hierarchy Ranking)
  const ROLE_RANK = {
    PRESIDENT: 1,
    ADMIN: 2,
    DEAN: 3,
    TEACHER: 4
  };

  // State พักค่าคณะที่เลือกในหน้าต่าง Modal (เพื่อกรองตัวเลือกภาควิชาให้สัมพันธ์กันแบบ Dynamic)
  const [modalFacultyId, setModalFacultyId] = useState('');

  const roleWeights = {
    PRESIDENT: 1,
    ADMIN: 2,
    DEAN: 3,
    TEACHER: 4
  };

  // ----------------------------------------------------------------------------------
  // [4] State เก็บข้อมูลตารางอ้างอิงความสัมพันธ์ (Relational Reference Data)
  // ----------------------------------------------------------------------------------
  const [faculties, setFaculties] = useState([]);         // รายการคณะทั้งหมด (สำหรับ Dropdown)
  const [departments, setDepartments] = useState([]);     // รายการภาควิชาทั้งหมด (สำหรับ Dropdown)
  const [localIssues, setLocalIssues] = useState([]);     // รายการประเด็นพัฒนาท้องถิ่น (สำหรับ Dropdown)
  const [strategies, setStrategies] = useState([]);       // รายการแผนงานหลัก (สำหรับ Dropdown)
  const [subStrategies, setSubStrategies] = useState([]); // รายการแผนงานย่อย (สำหรับ Dropdown)

  // ----------------------------------------------------------------------------------
  // [5] Helper Functions: ระบบคำนวณรหัสลำดับชั้นอัตโนมัติ (Hierarchical Auto-Coding)
  // ----------------------------------------------------------------------------------

  /**
   * ฟังก์ชัน: getFacultyCode
   * หน้าที่: คำนวณรหัสคณะอัตโนมัติ 2 หลัก
   * - กรณี "ส่วนกลาง" กำหนดรหัสเป็น "00"
   * - คณะอื่น ๆ เรียงตาม ID และแปลงเป็นเลข 2 หลัก เช่น 01, 02, 03...
   */
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

  /**
   * ฟังก์ชัน: getDeptCode
   * หน้าที่: คำนวณรหัสภาควิชาอัตโนมัติ 4 หลัก
   * โครงสร้างรหัส: [รหัสคณะ 2 หลัก] + [ลำดับภาควิชาภายในคณะนั้น 2 หลัก] เช่น "0101", "0102"
   */
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

  /**
   * ฟังก์ชัน: getUserCode
   * หน้าที่: คำนวณรหัสบุคลากรอัตโนมัติ 6 หลัก
   * โครงสร้างรหัส: [รหัสภาควิชา 4 หลัก] + [ลำดับผู้ใช้งานในภาควิชานั้น 2 หลัก] เช่น "010101"
   * กรณีไม่สังกัดภาควิชาจะขึ้นต้นด้วย "0000" ตามด้วยลำดับ 2 หลัก
   */
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

  // ----------------------------------------------------------------------------------
  // [6] State สำหรับหน้าต่าง Modal จัดการข้อมูล (CRUD Modal)
  // ----------------------------------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false); // ควบคุมการเปิด/ปิดหน้าต่าง Modal
  const [editId, setEditId] = useState(null);         // เก็บ ID ของรายการที่กำลังแก้ไข (ถ้าเป็น null คือโหมดสร้างใหม่)
  const [formData, setFormData] = useState({});       // เก็บข้อมูลฟอร์มที่กรอกใน Modal

  // โครงสร้างเมนูแท็บทั้ง 9 หมวดหมู่ของ Master Data
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

  // ==================================================================================
  // [7] ฟังก์ชันดึงข้อมูลจาก API (Data Fetching Functions)
  // ==================================================================================

  /**
   * ฟังก์ชัน: fetchData
   * หน้าที่: ดึงข้อมูลรายการหลักของแท็บปัจจุบันที่เปิดอยู่ (ตามค่า activeTab)
   * กระบวนการทำงาน:
   *   1. ตั้งค่า loading = true เพื่อแสดงสถานะหมุนโหลด
   *   2. เลือกว่าจะเรียก API Endpoint ไหนตามแท็บ เช่น /master/users, /master/faculties
   *   3. นำข้อมูลที่ได้จาก API เก็บลงใน state `data`
   *   4. หากเกิดข้อผิดพลาด จะแสดง SweetAlert2 แจ้งสาเหตุให้ผู้ใช้ทราบ
   */
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

  /**
   * ฟังก์ชัน: fetchRelations
   * หน้าที่: ดึงข้อมูลความสัมพันธ์ทั้งหมดเพื่อนำมาใช้เป็นตัวเลือกใน Dropdown (คณะ, สาขา, แผนงาน ฯลฯ)
   * เทคนิค: ใช้ `Promise.allSettled` เพื่อยิง API ทั้ง 5 ตารางพร้อมกันแบบ Asynchronous Parallel
   * ข้อดี: โหลดข้อมูลเร็วขึ้น และถ้ามี endpoint ใดล้มเหลว ตารางอื่น ๆ ก็ยังคงโหลดได้ตามปกติ
   */
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

  /**
   * Hook: useEffect (Lifecycle Component)
   * หน้าที่: ทำงานทุกครั้งที่ผู้ใช้สลับแท็บ (เมื่อ activeTab เปลี่ยนแปลง)
   * การทำงาน:
   *   1. เรียก fetchData() เพื่อโหลดข้อมูลของแท็บนั้น
   *   2. เรียก fetchRelations() เพื่ออัปเดตตัวเลือกใน Dropdown
   *   3. ล้างค่าตัวกรองคณะ/ภาควิชา ให้กลับเป็นค่าว่าง
   */
  useEffect(() => {
    fetchData();
    fetchRelations();
    setFilterFacultyId('');
    setFilterDepartmentId('');
    setFilterDeptFacultyId('');
  }, [activeTab]);

  // ==================================================================================
  // [8] ฟังก์ชันจัดการฟอร์มและเหตุการณ์ CRUD (Create, Read, Update, Delete Handlers)
  // ==================================================================================

  /**
   * ฟังก์ชัน: handleCreate
   * หน้าที่: เตรียมเปิดหน้าต่าง Modal สำหรับ "เพิ่มข้อมูลใหม่"
   * กระบวนการ:
   *   1. รีเซ็ต editId เป็น null (แสดงว่าเป็นโหมดสร้างใหม่ ไม่ใช่โหมดแก้ไข)
   *   2. กำหนดค่าเริ่มต้นของแต่ละแท็บ เช่น แท็บปีงบประมาณให้ใช้วันที่ปัจจุบันแปลงเป็น พ.ศ.
   *   3. สำหรับแท็บผู้ใช้ กำหนด Role เริ่มต้นเป็น 'TEACHER'
   *   4. เปิดหน้าต่าง Modal (setModalOpen(true))
   */
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

  /**
   * ฟังก์ชัน: handleEdit
   * หน้าที่: เตรียมเปิดหน้าต่าง Modal สำหรับ "แก้ไขข้อมูลเดิม"
   * พารามิเตอร์: item = วัตถุข้อมูลของแถวที่ต้องการแก้ไข
   * กระบวนการ:
   *   1. บันทึก ID รายการไว้ใน `editId`
   *   2. คัดลอกข้อมูลเดิมใส่ใน `formData` เพื่อแสดงในช่อง Input อัตโนมัติ
   *   3. ถ้าเป็นผู้ใช้ ให้เคลียร์ช่องรหัสผ่าน และตั้งค่าสังกัดคณะเพื่อกรองภาควิชาให้ถูกต้อง
   *   4. เปิดหน้าต่าง Modal
   */
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

  /**
   * ฟังก์ชัน: handleSubmit (ฟอร์มบันทึกข้อมูลหลัก)
   * หน้าที่: ตรวจสอบความถูกต้องและส่งข้อมูลฟอร์มไปยัง API Backend
   * กระบวนการ:
   *   1. e.preventDefault() ป้องกันการรีเฟรชหน้าเว็บ
   *   2. ทำ Data Cleansing / Type Casting: แปลง Foreign Keys (เช่น facultyId, strategyId) ให้เป็น Integer
   *   3. ตรวจสอบโหมด:
   *      - ถ้ามี editId ➔ ส่งคำขอแบบ PUT ไปยัง `/master/.../${editId}` (อัปเดต)
   *      - ถ้าไม่มี editId ➔ ส่งคำขอแบบ POST ไปยัง `/master/...` (สร้างใหม่)
   *   4. แสดงกล่อง SweetAlert2 แจ้งผลลัพธ์
   *   5. ปิด Modal และสั่ง fetchData() รีเฟรชตารางทันที
   */
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

      // Type Casting: ตรวจสอบและแปลง Foreign Key ให้เป็นประเภทตัวเลข (Integer)
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

      // ยิง API บันทึกข้อมูล
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

  /**
   * ฟังก์ชัน: handleDelete
   * หน้าที่: ลบข้อมูลรายการตาม ID
   * ความปลอดภัย:
   *   1. มีกล่อง SweetAlert2 ยืนยันก่อนลบ ป้องกันการกดผิด
   *   2. ส่งคำขอ DELETE ไปยัง Backend API
   *   3. หากข้อมูลนี้ถูกใช้งานอยู่ในตารางอื่น (ติด Foreign Key Constraint) Backend จะตอบกลับ Error และแสดงแจ้งเตือนความปลอดภัย
   */
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

  /**
   * ฟังก์ชัน: handleResetPassword
   * หน้าที่: ช่วยให้ Admin รีเซ็ตรหัสผ่านของผู้ใช้งานรายบุคคลเป็นค่าเริ่มต้น ("123456") ได้ทันที
   * ประโยชน์: แก้ปัญหาอาจารย์หรือผู้บริหารลืมรหัสผ่านเข้าระบบ
   */
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

  /**
   * ฟังก์ชัน: handleClearSystemCache
   * หน้าที่: ล้างแคชในระบบและสั่งเซิร์ฟเวอร์ซิงก์สถานะล่าสุด
   * ใช้เมื่อ: มีการอัปเดตข้อมูลโครงสร้างแล้วต้องการให้ระบบดึงข้อมูลสดใหม่ทันที
   */
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

  /**
   * ฟังก์ชัน: handleExportPDF
   * หน้าที่: ดาวน์โหลดข้อมูลตารางในแท็บปัจจุบันออกเป็นรายงานเอกสาร PDF ขนาด A4
   * การทำงาน:
   *   1. ยิง GET Request แบบ responseType: 'blob' ไปยัง backend
   *   2. แปลง binary stream เป็น Blob URL ชั่วคราว
   *   3. สร้างแท็ก <a> เพื่อ trigger ให้เบราว์เซอร์ดาวน์โหลดไฟล์อัตโนมัติ
   */
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

  // ==================================================================================
  // [9] ส่วนประมวลผลการกรองและเรียงลำดับข้อมูล (Filtering & Sorting Pipeline)
  // ==================================================================================

  /**
   * ตัวแปร: filteredData
   * หน้าที่: กรองข้อมูลในตารางตามคำค้นหา (search) และตัวกรอง Dropdown (คณะ / สาขา)
   */
  const filteredData = data.filter(item => {
    const text = search.toLowerCase();

    // ตัวกรองสังกัดสำหรับแท็บผู้ใช้งาน (User Tab)
    if (activeTab === 'user') {
      if (filterFacultyId && item.department?.facultyId !== parseInt(filterFacultyId)) {
        return false;
      }
      if (filterDepartmentId && item.departmentId !== parseInt(filterDepartmentId)) {
        return false;
      }
    }

    // ตัวกรองคณะสำหรับแท็บภาควิชา (Department Tab)
    if (activeTab === 'department') {
      if (filterDeptFacultyId && item.facultyId !== parseInt(filterDeptFacultyId)) {
        return false;
      }
    }

    // ค้นหาตามชื่อ รหัส บัญชีผู้ใช้ หรือปีงบประมาณ
    return (
      (item.name && item.name.toLowerCase().includes(text)) ||
      (item.code && item.code.toLowerCase().includes(text)) ||
      (item.username && item.username.toLowerCase().includes(text)) ||
      (item.year && String(item.year).includes(text))
    );
  });

  /**
   * ฟังก์ชัน: getSortedData
   * หน้าที่: นำข้อมูลที่ผ่านการกรองแล้วมาจัดเรียงลำดับอย่างเป็นมืออาชีพ
   * - ผู้ใช้: เรียงตามรหัสบุคลากร 6 หลัก (getUserCode)
   * - ภาควิชา: เรียงตามรหัสภาควิชา 4 หลัก (getDeptCode)
   * - คณะ: เรียงตามรหัสคณะ 2 หลัก (getFacultyCode)
   * - อื่น ๆ: เรียงตาม ID
   */
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
      {/* ---------------------------------------------------------------------------- */}
      {/* [10] ส่วนหัวแบนเนอร์ด้านบน (Top Header Banner & Action Buttons)               */}
      {/* หน้าที่: แสดงชื่อหน้า แนะนำภาพรวม และมีปุ่มคำสั่งหลัก 3 ปุ่ม:                     */}
      {/* 1. ล้างแคชระบบ (handleClearSystemCache)                                       */}
      {/* 2. พิมพ์รายงาน PDF (handleExportPDF)                                         */}
      {/* 3. เพิ่มข้อมูลใหม่ (handleCreate) - สลับข้อความตามแท็บ เช่น "เพิ่มคณะ"           */}
      {/* ---------------------------------------------------------------------------- */}
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
          {/* ปุ่มที่ 1: ล้างแคชระบบ */}
          <button
            onClick={handleClearSystemCache}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 hover:text-white rounded-2xl border border-white/15 backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-sm"
            title="ล้างแคชและรีเฟรชข้อมูล"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ล้างแคชระบบ</span>
          </button>

          {/* ปุ่มที่ 2: ดาวน์โหลดรายงาน PDF */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-2xl shadow-sm border border-rose-200 active:scale-95 transition-all cursor-pointer"
            title="พิมพ์และดาวน์โหลดรายงานข้อมูลหลักเป็นเอกสาร PDF"
          >
            <FiDownload className="w-4 h-4 text-rose-600" />
            <span>พิมพ์รายงาน PDF</span>
          </button>

          {/* ปุ่มที่ 3: เปิด Modal เพิ่มข้อมูลใหม่ */}
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary-dark hover:to-indigo-700 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>{activeTab === 'faculty' ? 'เพิ่มคณะ' : 'เพิ่มข้อมูลใหม่'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------------- */}
      {/* [11] แถบสลับแท็บข้อมูลหลัก 9 หมวดหมู่ (Tab Navigation Ribbon)                 */}
      {/* หน้าที่: นำทางระหว่าง 9 กลุ่มข้อมูล พร้อมไอคอนและเอฟเฟกต์ Active State         */}
      {/* ---------------------------------------------------------------------------- */}
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

      {/* ---------------------------------------------------------------------------- */}
      {/* [12] ส่วนค้นหาและตัวกรองข้อมูล (Search & Cascading Filter Panel)              */}
      {/* หน้าที่: ค้นหาคำ และมี Dropdown กรองแบบเจาะจงสังกัดคณะ/ภาควิชา                */}
      {/* ---------------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* ช่องค้นหาข้อความแบบเรียลไทม์ (Search Input) */}
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

      {/* ---------------------------------------------------------------------------- */}
      {/* [13] ส่วนแสดงผลข้อมูลหลัก (Main Content: Grid View หรือ Table View)             */}
      {/* - หากเลือกแท็บ 'faculty' (คณะ) ➔ แสดงผลเป็นการ์ดแบบ 3 คอลัมน์ (Card Grid)       */}
      {/* - หากเลือกแท็บอื่น ๆ ➔ แสดงผลเป็นตารางรายการสากล (Universal Responsive Table)     */}
      {/* ---------------------------------------------------------------------------- */}

      {activeTab === 'faculty' ? (
        /* โครงสร้างที่ 1: การ์ดแสดงข้อมูลคณะ (Faculty Card Grid) */
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
                {/* แถบสีตกแต่งด้านบนการ์ด */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-violet-500"></div>

                <div>
                  {/* ชื่อคณะ */}
                  <h3 className="text-base font-bold text-gray-800 tracking-tight group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>

                  {/* สรุปข้อมูลตัวเลขของคณะ: รหัสคณะ, คณบดี, จำนวนภาควิชา, จำนวนโครงการ */}
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

                  {/* แถบหลอดความก้าวหน้ารวมของโครงการในคณะ (Progress Bar) */}
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

                {/* แผงปุ่มคำสั่งใต้การ์ดคณะ: ดูรายละเอียดโครงการ, แก้ไข, ลบ */}
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
        /* โครงสร้างที่ 2: ตารางข้อมูลสากลสำหรับแท็บอื่น ๆ 8 แท็บ (Universal Data Table) */
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

      {/* ---------------------------------------------------------------------------- */}
      {/* [14] หน้าต่างป๊อปอัปสำหรับสร้างและแก้ไขข้อมูล (CRUD Modal Dialog via React Portal)*/}
      {/* หน้าที่: เป็นฟอร์มกลางที่สลับช่อง Input ตามแท็บปัจจุบันที่เปิดอยู่ (9 ฟอร์ม)       */}
      {/* ---------------------------------------------------------------------------- */}
      {modalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className={`w-full ${activeTab === 'user' ? 'max-w-2xl' : 'max-w-md'} ${activeTab === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-gray-800'} rounded-3xl shadow-2xl border ${activeTab === 'user' ? 'border-slate-800' : 'border-gray-100'} overflow-hidden max-h-[90vh] flex flex-col my-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ส่วนหัวของ Modal (Modal Header): แสดงชื่อแท็บ และปุ่มปิด */}
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

            {/* ฟอร์มรับข้อมูล (Form Body): สลับแสดงผลตาม activeTab */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* ==================================================================== */}
              {/* ฟอร์มที่ 1: จัดการข้อมูลคณะ (Faculty Form)                             */}
              {/* ฟิลด์: name (ชื่อคณะ เช่น คณะครุศาสตร์, คณะวิทยาศาสตร์)               */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 2: จัดการข้อมูลภาควิชา/หน่วยงาน (Department Form)             */}
              {/* ฟิลด์: name (ชื่อภาควิชา), facultyId (สังกัดคณะ - เป็นคีย์นอก Foreign Key) */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 3: จัดการประเด็นการพัฒนาท้องถิ่น (Local Development Issue Form) */}
              {/* ลำดับขั้น: ยุทธศาสตร์ระดับ 1                                           */}
              {/* ฟิลด์: code (รหัส เช่น LDI1), name (ชื่อประเด็นการพัฒนาท้องถิ่น)       */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 4: จัดการแผนงานหลัก (Strategy Form)                          */}
              {/* ลำดับขั้น: ยุทธศาสตร์ระดับ 2                                           */}
              {/* ฟิลด์: localIssueId (ผูกประเด็นท้องถิ่น), code (รหัส เช่น S1), name      */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 5: จัดการแผนงานย่อย/กลยุทธ์ (Sub-Strategy Form)              */}
              {/* ลำดับขั้น: ยุทธศาสตร์ระดับ 3                                           */}
              {/* ฟิลด์: strategyId (ผูกแผนงานหลัก), code (รหัส เช่น SS1.1), name         */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 6: จัดการโครงการหลัก (Indicator / Main Project MP Form)       */}
              {/* ลำดับขั้น: ยุทธศาสตร์ระดับ 4                                           */}
              {/* ฟิลด์: subStrategyId (ผูกแผนงานย่อย), code (รหัส เช่น MP1.1), name     */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 7: จัดการบัญชีผู้ใช้งานและสิทธิ์ (User & RBAC Form)            */}
              {/* ฟิลด์:                                                              */}
              {/*   - name: ชื่อ-สกุลจริง                                              */}
              {/*   - role: สิทธิ์ (ADMIN, PRESIDENT, DEAN, TEACHER)                     */}
              {/*   - username: บัญชีผู้ใช้ (ไม่ให้แก้เมื่ออยู่ในโหมดแก้ไข)                 */}
              {/*   - password: รหัสผ่าน (กรอกเมื่อสร้างใหม่ / เว้นว่างได้ถ้าแก้ไข)          */}
              {/*   - modalFacultyId: เลือกคณะเพื่อโหลดรายชื่อภาควิชาให้สัมพันธ์กัน         */}
              {/*   - departmentId: สังกัดภาควิชา (Foreign Key)                         */}
              {/* ==================================================================== */}
              {activeTab === 'user' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">ชื่อ-นามสกุลจริง *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs font-medium"
                      placeholder="คำนำหน้าและชื่อนามสกุล"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">บทบาทระบบ (Role) *</label>
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
                    <label className="block text-xs font-semibold text-white mb-1.5">ชื่อเข้าใช้ระบบ (Username) *</label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs font-medium disabled:opacity-50 disabled:bg-slate-900"
                      placeholder="ชื่อผู้ใช้งาน"
                      required
                      disabled={!!editId}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      รหัสผ่าน {editId && <span className="text-[10px] text-slate-400 font-normal">(เว้นว่างเพื่อคงเดิม)</span>} {!editId && '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs font-medium"
                      placeholder={editId ? "••••••••" : "รหัสผ่านบัญชี"}
                      required={!editId}
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
                </div>
              )}

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 8: จัดการปีงบประมาณ (Fiscal Year Form)                         */}
              {/* ฟิลด์: year (ปี พ.ศ. เช่น 2569), active (กำหนดเป็นปีงบประมาณหลัก)         */}
              {/* ==================================================================== */}
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

              {/* ==================================================================== */}
              {/* ฟอร์มที่ 9: จัดการแหล่งงบประมาณ (Budget Source Form)                    */}
              {/* ฟิลด์: name (ชื่อแหล่งเงิน เช่น งบประมาณแผ่นดิน, งบรายได้)                 */}
              {/* ==================================================================== */}
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

              {/* -------------------------------------------------------------------- */}
              {/* ส่วนปุ่มกดยืนยัน/ยกเลิกท้าย Modal (Modal Action Footer)               */}
              {/* -------------------------------------------------------------------- */}
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
