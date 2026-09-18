/** ==============================================================================
 * หน้าฟอร์มสร้างและแก้ไขข้อมูลโครงการยุทธศาสตร์ (Teacher Project Form)
 * ------------------------------------------------------------------------------
 * ฟอร์มจัดการข้อมูลโครงการระดับอาจารย์/ผู้รับผิดชอบ:
 *   - บันทึกข้อมูลพื้นฐาน: ชื่อโครงการ, รายละเอียด, ปีงบประมาณ, แหล่งงบประมาณ
 *   - ระบบ Cascading Dropdowns เชื่อมโยงยุทธศาสตร์ 4 ระดับ:
 *       1. ประเด็นการพัฒนาท้องถิ่น (Local Issue)
 *       2. ยุทธศาสตร์หลัก (Strategy)
 *       3. กลยุทธ์/ยุทธศาสตร์ย่อย (Sub-Strategy)
 *       4. ตัวชี้วัดเป้าหมาย (KPI Indicator)
 *   - กำหนดกรอบงบประมาณรวม (Total Budget), เป้าหมายตัวชี้วัด (Target Count), และหน่วยนับ
 *   - เลือกระยะเวลาดำเนินงาน (วันเริ่มต้น - วันสิ้นสุด)
 *   - แต่งตั้งอาจารย์ผู้ร่วมรับผิดชอบโครงการ (Co-Responsibles) กรองตามสังกัดคณะเดียวกัน
 *   - ตรวจสอบเงื่อนไข Plan Lock (หากมีกิจกรรมแล้ว จะไม่อนุญาตให้แก้ไขงบประมาณหรือเป้าหมาย)
 * ============================================================================== */

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import CustomSelect from '../../components/CustomSelect';
import Swal from 'sweetalert2';
import { FiArrowLeft, FiSave, FiCompass, FiLayers, FiLock } from 'react-icons/fi';

// รายการตัวเลือกหน่วยนับมาตรฐาน
const UNIT_OPTIONS = [
  { value: 'กิจกรรม', label: 'กิจกรรม' },
  { value: 'ครั้ง', label: 'ครั้ง' },
  { value: 'คน', label: 'คน' },
  { value: 'ชุมชน', label: 'ชุมชน' },
  { value: 'หลักสูตร', label: 'หลักสูตร' },
  { value: 'ผลิตภัณฑ์', label: 'ผลิตภัณฑ์' },
  { value: 'นวัตกรรม', label: 'นวัตกรรม' },
  { value: 'ร้อยละ', label: 'ร้อยละ' },
  { value: '__custom__', label: 'ระบุอื่นๆ (พิมพ์เอง)...' }
];

const ESSENTIAL_UNITS = UNIT_OPTIONS.filter(o => o.value !== '__custom__').map(o => o.value);

/**
 * คอมโพเนนต์ฟอร์มบันทึก/แก้ไขข้อมูลโครงการยุทธศาสตร์
 * @returns {JSX.Element}
 */
const ProjectForm = () => {
  const { user } = useContext(AuthContext);               // ข้อมูลผู้ใช้งานปัจจุบัน
  const navigate = useNavigate();
  const { id } = useParams();                             // รับ id เมื่ออยู่ในโหมดแก้ไข
  const isEdit = !!id;                                    // true = โหมดแก้ไข, false = สร้างใหม่

  // ─── State ทั่วไปของฟอร์ม ───
  const [loading, setLoading] = useState(false);          // สถานะกำลังโหลดข้อมูล Master Data
  const [saving, setSaving] = useState(false);            // สถานะกำลังบันทึกข้อมูล
  const [isCustomUnit, setIsCustomUnit] = useState(false);// ระบุหน่วยนับเองหรือไม่

  // ─── State สำหรับ Master Data Dropdowns ───
  const [fiscalYears, setFiscalYears] = useState([]);     // รายการปีงบประมาณ
  const [budgetSources, setBudgetSources] = useState([]); // รายการแหล่งงบประมาณ
  const [users, setUsers] = useState([]);                 // รายชื่ออาจารย์สำหรับเลือกผู้ร่วมรับผิดชอบ

  // ─── State สำหรับโครงสร้างยุทธศาสตร์แบบ Cascading ───
  const [strategies, setStrategies] = useState([]);       // ยุทธศาสตร์หลัก
  const [localIssues, setLocalIssues] = useState([]);     // ประเด็นการพัฒนาท้องถิ่น
  const [subStrategies, setSubStrategies] = useState([]); // ยุทธศาสตร์ย่อย
  const [indicators, setIndicators] = useState([]);       // ตัวชี้วัด

  // State ติดตามค่าที่เลือกในระดับยุทธศาสตร์
  const [selectedLocalIssueId, setSelectedLocalIssueId] = useState('');
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [selectedSubStrategyId, setSelectedSubStrategyId] = useState('');

  // ข้อมูลโครงการเดิมกรณีเป็นโหมดแก้ไข (Edit Mode)
  const [project, setProject] = useState(null);

  // ─── React Hook Form Configuration ───
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      fiscalYearId: '',
      budgetSourceId: '',
      strategyId: '',
      subStrategyId: '',
      indicatorId: '',
      totalBudget: '',
      targetCount: '',
      unit: 'กิจกรรม',
      startDate: '',
      endDate: '',
      userIds: []
    }
  });

  // Watch ตัวแปรต่างๆ เพื่อนำมาควบคุม UI
  const watchedFiscalYearId = watch('fiscalYearId');
  const watchedBudgetSourceId = watch('budgetSourceId');
  const watchedIndicatorId = watch('indicatorId');
  const watchedUnit = watch('unit');

  // Load masters and users
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [years, sources, usrList, strats, subStrats, inds, lIssues] = await Promise.all([
          api.get('/master/fiscal-years'),
          api.get('/master/budget-sources'),
          api.get('/master/users'),
          api.get('/master/strategies'),
          api.get('/master/sub-strategies'),
          api.get('/master/indicators'),
          api.get('/master/local-issues')
        ]);

        const yearsData = years.data || [];
        const sourcesData = sources.data || [];
        const usersData = usrList.data || [];
        const stratsData = strats.data || [];
        const subStratsData = subStrats.data || [];
        const indsData = inds.data || [];
        const lIssuesData = lIssues.data || [];

        setFiscalYears(yearsData);
        setBudgetSources(sourcesData);
        setUsers(usersData.filter(u => u.role === 'TEACHER'));
        setStrategies(stratsData);
        setSubStrategies(subStratsData);
        setIndicators(indsData);
        setLocalIssues(lIssuesData);

        // Pre-select active fiscal year if creating new
        const activeYear = yearsData.find(y => y.active);
        if (activeYear && !isEdit) {
          setValue('fiscalYearId', String(activeYear.id), { shouldValidate: true });
        }

        // If Edit Mode, load the project details
        if (isEdit) {
          const projResp = await api.get(`/projects/${id}`);
          const proj = projResp.data;
          setProject(proj);

          // Populate Form values
          setValue('name', proj.name || '');
          setValue('description', proj.description || '');
          setValue('fiscalYearId', proj.fiscalYearId ? String(proj.fiscalYearId) : '', { shouldValidate: true });
          setValue('budgetSourceId', proj.budgetSourceId ? String(proj.budgetSourceId) : '', { shouldValidate: true });

          const budgetVal = parseFloat(proj.totalBudget);
          setValue('totalBudget', isNaN(budgetVal) ? '' : budgetVal.toLocaleString('en-US'), { shouldValidate: true });
          setValue('targetCount', proj.targetCount ?? '', { shouldValidate: true });

          const projUnit = proj.unit || 'กิจกรรม';
          setValue('unit', projUnit, { shouldValidate: true });
          if (!ESSENTIAL_UNITS.includes(projUnit)) {
            setIsCustomUnit(true);
          } else {
            setIsCustomUnit(false);
          }

          setValue('startDate', proj.startDate ? proj.startDate.split('T')[0] : '');
          setValue('endDate', proj.endDate ? proj.endDate.split('T')[0] : '');

          // Set cascading values
          const subStrat = subStratsData.find(ss => ss.id === proj.subStrategyId);
          if (subStrat) {
            const strat = stratsData.find(s => s.id === subStrat.strategyId);
            if (strat && strat.localIssueId) {
              setSelectedLocalIssueId(String(strat.localIssueId));
            }
            setSelectedStrategyId(String(subStrat.strategyId));
            setValue('strategyId', String(subStrat.strategyId), { shouldValidate: true });
          }
          setSelectedSubStrategyId(String(proj.subStrategyId));
          setValue('subStrategyId', String(proj.subStrategyId), { shouldValidate: true });
          setValue('indicatorId', proj.indicatorId ? String(proj.indicatorId) : '', { shouldValidate: true });

          // Multi-responsibles user mapping (exclude creator)
          const assignedUserIds = (proj.users || [])
            .map(u => u.userId)
            .filter(uId => uId !== proj.creatorId)
            .map(String);
          setValue('userIds', assignedUserIds);
        }
      } catch (err) {
        console.error('Failed to load masters:', err);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถโหลดข้อมูลหลักประกอบฟอร์มได้' });
      } finally {
        setLoading(false);
      }
    };
    loadMasters();
  }, [id, isEdit, setValue]);

  /**
   * เมื่อผู้ใช้เปลี่ยน "ประเด็นการพัฒนาท้องถิ่น" ให้ล้างค่ายุทธศาสตร์และตัวชี้วัดที่อยู่ลำดับล่างทั้งหมด
   */
  const handleLocalIssueChange = (val) => {
    setSelectedLocalIssueId(val);
    setSelectedStrategyId('');
    setSelectedSubStrategyId('');
    setValue('strategyId', '', { shouldValidate: true });
    setValue('subStrategyId', '', { shouldValidate: true });
    setValue('indicatorId', '', { shouldValidate: true });
  };

  /**
   * เมื่อผู้ใช้เปลี่ยน "ยุทธศาสตร์หลัก" ให้ดึงประเด็นท้องถิ่นที่สอดคล้อง และล้างค่ายุทธศาสตร์ย่อย/ตัวชี้วัด
   */
  const handleStrategyChange = (val) => {
    setSelectedStrategyId(val);
    setValue('strategyId', val, { shouldValidate: true });
    const chosenStrat = strategies.find(s => String(s.id) === String(val));
    if (chosenStrat && chosenStrat.localIssueId) {
      setSelectedLocalIssueId(String(chosenStrat.localIssueId));
    }
    setSelectedSubStrategyId('');
    setValue('subStrategyId', '', { shouldValidate: true });
    setValue('indicatorId', '', { shouldValidate: true });
  };

  /**
   * เมื่อผู้ใช้เปลี่ยน "กลยุทธ์/ยุทธศาสตร์ย่อย" ให้ล้างค่าตัวชี้วัดเดิมออก
   */
  const handleSubStrategyChange = (val) => {
    setSelectedSubStrategyId(val);
    setValue('subStrategyId', val, { shouldValidate: true });
    setValue('indicatorId', '', { shouldValidate: true });
  };

  /**
   * บันทึกค่าตัวชี้วัดที่เลือก
   */
  const handleIndicatorChange = (val) => {
    setValue('indicatorId', val, { shouldValidate: true });
  };

  // ─── การกรองรายการยุทธศาสตร์แบบ Cascading ตามลำดับชั้น ───
  const filteredStrategies = selectedLocalIssueId
    ? strategies.filter(s => s.localIssueId === parseInt(selectedLocalIssueId, 10))
    : strategies;
  const filteredSubStrategies = subStrategies.filter(ss => ss.strategyId === parseInt(selectedStrategyId, 10));
  const filteredIndicators = indicators.filter(ind => ind.subStrategyId === parseInt(selectedSubStrategyId, 10));

  // ค้นหา Object ข้อมูลยุทธศาสตร์ปัจจุบันสำหรับแสดงผล Breadcrumb เส้นทางยุทธศาสตร์
  const currentLocalIssue = localIssues.find(li => String(li.id) === String(selectedLocalIssueId));
  const currentStrategy = strategies.find(s => String(s.id) === String(selectedStrategyId));
  const currentSubStrategy = subStrategies.find(ss => String(ss.id) === String(selectedSubStrategyId));
  const currentIndicator = indicators.find(ind => String(ind.id) === String(watchedIndicatorId));

  // ─── การกรองผู้ร่วมรับผิดชอบโครงการ (เฉพาะคณะเดียวกันและไม่รวมผู้สร้าง) ───
  const currentFacultyId = isEdit
    ? (project?.facultyId || project?.department?.facultyId || user?.department?.facultyId)
    : (user?.department?.facultyId || user?.department?.faculty?.id);

  const currentFacultyName = isEdit
    ? (project?.faculty?.name || project?.department?.faculty?.name || user?.department?.faculty?.name)
    : (user?.department?.faculty?.name || user?.department?.facultyName);

  const creatorUserId = isEdit ? project?.creatorId : user?.id;

  const coResponsibles = users.filter(u => {
    // 1. ตัดผู้สร้างโครงการออก (เพราะเป็นผู้รับผิดชอบหลักอยู่แล้ว)
    if (u.id === creatorUserId) return false;

    // 2. กรองเฉพาะอาจารย์ที่สังกัดคณะเดียวกัน
    if (currentFacultyId) {
      const uFacId = u.department?.facultyId || u.department?.faculty?.id;
      return uFacId === currentFacultyId;
    }

    return true;
  });

  // ─── การล็อกแผนโครงการ (Plan Lock Detection) ───
  // หากโครงการมีการสร้างกิจกรรมย่อยแล้ว จะไม่อนุญาตให้อาจารย์แก้ไขงบรวมและเป้าหมาย (ยกเว้นผู้ดูแลระบบ ADMIN)
  const hasActivities = isEdit && project?.activities && project.activities.length > 0;
  const isPlanLocked = hasActivities && user?.role !== 'ADMIN';

  /**
   * ฟังก์ชันประมวลผลและส่งข้อมูลฟอร์มโครงการไปยังเซิร์ฟเวอร์
   * @param {Object} data - ข้อมูลทั้งหมดจากฟอร์ม
   */
  const onSubmit = async (data) => {
    // 1. ตรวจสอบความถูกต้องของวันเริ่มต้นและสิ้นสุด
    if (!data.startDate || !data.endDate) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลวันที่ไม่ครบถ้วน',
        text: 'กรุณาระบุวันเริ่มต้นและสิ้นสุดการดำเนินงาน'
      });
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Swal.fire({
        icon: 'error',
        title: 'รูปแบบวันที่ไม่ถูกต้อง',
        text: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุดโครงการให้ถูกต้อง'
      });
      return;
    }

    if (start > end) {
      Swal.fire({
        icon: 'warning',
        title: 'ช่วงเวลาดำเนินงานไม่ถูกต้อง',
        text: 'วันที่สิ้นสุดโครงการต้องไม่น้อยกว่าวันที่เริ่มต้นดำเนินงาน'
      });
      return;
    }

    // 2. แปลงและตรวจสอบงบประมาณรวมโครงการ (ต้องเป็นตัวเลข >= 0)
    const cleanBudgetStr = typeof data.totalBudget === 'string'
      ? data.totalBudget.replace(/,/g, '').trim()
      : String(data.totalBudget ?? '');
    const totalBudget = parseFloat(cleanBudgetStr);
    if (isNaN(totalBudget) || totalBudget < 0) {
      Swal.fire({
        icon: 'error',
        title: 'งบประมาณไม่ถูกต้อง',
        text: 'กรุณาระบุงบประมาณรวมเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0'
      });
      return;
    }

    // 3. ตรวจสอบจำนวนเป้าหมายตัวชี้วัด (ต้องเป็นจำนวนเต็ม >= 1)
    const targetCount = parseInt(data.targetCount, 10);
    if (isNaN(targetCount) || targetCount < 1) {
      Swal.fire({
        icon: 'error',
        title: 'จำนวนเป้าหมายไม่ถูกต้อง',
        text: 'กรุณาระบุจำนวนเป้าหมายเป็นตัวเลขจำนวนเต็มอย่างน้อย 1'
      });
      return;
    }

    // 4. ตรวจสอบหน่วยนับความสำเร็จ
    const unit = (data.unit || '').trim();
    if (!unit) {
      Swal.fire({
        icon: 'error',
        title: 'หน่วยนับความสำเร็จ',
        text: 'กรุณาเลือกหรือระบุหน่วยนับความสำเร็จ'
      });
      return;
    }

    // 5. กรณีแก้ไข: ตรวจสอบไม่ให้ลดเป้าหมายรวมต่ำกว่าจำนวนกิจกรรมที่ทำเสร็จไปแล้ว
    if (isEdit && project && project.completedCount > targetCount && user?.role !== 'ADMIN') {
      Swal.fire({
        icon: 'error',
        title: 'เป้าหมายไม่ถูกต้อง',
        text: `จำนวนที่ทำเสร็จแล้วในโครงการนี้คือ ${project.completedCount} ครั้ง ซึ่งจะมากกว่าเป้าหมายรวมใหม่ไม่ได้`
      });
      return;
    }

    // 6. แปลง userIds ของผู้ร่วมรับผิดชอบให้อยู่ในรูปแบบ Array ของ Integer อย่างปลอดภัย
    let normalizedUserIds = [];
    if (Array.isArray(data.userIds)) {
      normalizedUserIds = data.userIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    } else if (typeof data.userIds === 'string' || typeof data.userIds === 'number') {
      const parsed = parseInt(data.userIds, 10);
      if (!isNaN(parsed)) normalizedUserIds = [parsed];
    } else if (data.userIds === true && coResponsibles.length === 1) {
      normalizedUserIds = [coResponsibles[0].id];
    }

    setSaving(true);
    try {
      // ประกอบข้อมูล Payload สำหรับเรียก API
      const payload = {
        name: (data.name || '').trim(),
        description: data.description ? data.description.trim() : '',
        fiscalYearId: parseInt(data.fiscalYearId, 10),
        budgetSourceId: parseInt(data.budgetSourceId, 10),
        subStrategyId: parseInt(data.subStrategyId, 10),
        indicatorId: data.indicatorId ? parseInt(data.indicatorId, 10) : null,
        totalBudget,
        targetCount,
        unit,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        userIds: normalizedUserIds
      };

      if (isEdit) {
        // อัปเดตโครงการเดิม
        await api.put(`/projects/${id}`, payload);
        Swal.fire({ icon: 'success', title: 'ปรับปรุงโครงการสำเร็จ', showConfirmButton: false, timer: 1500 });
        navigate(`/projects/${id}`);
      } else {
        // บันทึกสร้างโครงการใหม่ และนำทางไปยังหน้าจัดการกิจกรรมโครงการโดยอัตโนมัติ
        const response = await api.post('/projects', payload);
        const newProject = response.data;
        Swal.fire({ 
          icon: 'success', 
          title: 'สร้างโครงการสำเร็จ', 
          text: 'เข้าสู่หน้ากิจกรรมโครงการเพื่อเริ่มวางแผนงาน...',
          showConfirmButton: false, 
          timer: 1500 
        });
        navigate(`/projects/${newProject.id}`, { state: { autoOpenAddActivity: true, isNewProject: true } });
      }
    } catch (err) {
      console.error('Project form submit error:', err);
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: err.response?.data?.message || 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation header */}
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'แก้ไขโครงการยุทธศาสตร์' : 'เพิ่มโครงการยุทธศาสตร์ใหม่'}</h1>
          <p className="text-xs text-gray-400 mt-0.5">ระบุรายละเอียดแผนงาน งบประมาณ และเป้าหมายตามตัวชี้วัดมหาวิทยาลัย</p>
        </div>
      </div>

      {/* Plan Locked Notification Banner */}
      {isPlanLocked && (
        <div className="flex items-start sm:items-center gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-900 text-xs shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <FiLock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800">
              โครงการนี้มีกิจกรรมในแผนงานแล้ว ({project.activities.length} กิจกรรม)
            </div>
            <div className="text-amber-800/90 text-[11px] mt-0.5">
              งบประมาณโครงการรวมและจำนวนเป้าหมายถูกล็อกตามระบบควบคุมแผนงาน (Plan Locked) หากต้องการปรับเปลี่ยนกรุณาติดต่อผู้ดูแลระบบ (Admin)
            </div>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sm:p-8 space-y-6">

        {/* Project Name */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              ชื่อโครงการปฏิบัติการของท่าน (Operational Project Name) <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ตั้งชื่อโครงการเฉพาะที่จัดทำขึ้นภายใต้โครงการหลักที่เลือก
            </span>
          </div>
          <input
            type="text"
            placeholder="เช่น โครงการพัฒนาระบบตรวจวัดคุณภาพน้ำชุมชนห้วยจระเข้มาก"
            className={`w-full px-4 py-2.5 border ${errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all shadow-2xs`}
            {...register('name', { required: 'กรุณากรอกชื่อโครงการปฏิบัติการ' })}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            💡 <strong>ข้อแนะนำ:</strong> ระบุชื่อโครงการเฉพาะของท่านหรือคณะที่จะลงมือปฏิบัติจริงในพื้นที่ โดยไม่ต้องคัดลอกชื่อโครงการหลัก (MP)
          </p>
          {errors.name && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.name.message}</span>}
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">รายละเอียดคำอธิบายโครงการ</label>
          <textarea
            rows="3"
            placeholder="รายละเอียดและวัตถุประสงค์โครงการ..."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium text-slate-800 transition-all shadow-2xs"
            {...register('description')}
          />
        </div>

        {/* Dynamic Cascading Dropdowns: 4 Levels with Stepper Badges */}
        <div className="bg-gradient-to-b from-slate-50/90 via-purple-50/20 to-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <FiCompass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-wide">
                  ความเชื่อมโยงตามยุทธศาสตร์มหาวิทยาลัย
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  เลือกความสอดคล้องตามลำดับชั้น 4 ระดับ (แสดงชื่อเต็ม 2 บรรทัด อ่านง่าย พร้อมระบบค้นหาอัตโนมัติ)
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
              <span>โครงสร้าง 4 ระดับ</span>
            </span>
          </div>

          {/* Hidden inputs for React Hook Form validation */}
          <input type="hidden" {...register('strategyId', { required: 'กรุณาเลือกแผนงานหลัก' })} />
          <input type="hidden" {...register('subStrategyId', { required: 'กรุณาเลือกแผนงานย่อย' })} />
          <input type="hidden" {...register('indicatorId')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Local Development Issue */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-black flex items-center justify-center">1</span>
                  <span>ประเด็นการพัฒนาท้องถิ่น</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">4 ด้าน</span>
              </div>
              <CustomSelect
                value={selectedLocalIssueId}
                onChange={handleLocalIssueChange}
                placeholder="-- ทุกประเด็นการพัฒนาท้องถิ่น --"
                multiline={true}
                options={[
                  { value: '', label: 'ทุกประเด็นการพัฒนาท้องถิ่น (แสดงทั้งหมด)', badge: 'ALL' },
                  ...localIssues.map(li => ({
                    value: String(li.id),
                    label: li.name,
                    badge: li.code
                  }))
                ]}
              />
            </div>

            {/* 2. Strategy (แผนงานหลัก) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center">2</span>
                  <span>แผนงานหลัก</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  {filteredStrategies.length} แผนงาน
                </span>
              </div>
              <CustomSelect
                value={selectedStrategyId}
                onChange={handleStrategyChange}
                placeholder="-- เลือกแผนงานหลัก --"
                multiline={true}
                className={errors.strategyId ? 'ring-2 ring-red-400 rounded-xl' : ''}
                options={filteredStrategies.map(s => ({
                  value: String(s.id),
                  label: s.name,
                  badge: s.code
                }))}
              />
              {errors.strategyId && (
                <span className="text-xs font-semibold text-red-500 mt-1 block">
                  {errors.strategyId.message}
                </span>
              )}
            </div>

            {/* 3. Sub Strategy (แผนงานย่อย) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">3</span>
                  <span>แผนงานย่อย</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  {selectedStrategyId ? `${filteredSubStrategies.length} แผนงานย่อย` : 'ต้องเลือกข้อ 2 ก่อน'}
                </span>
              </div>
              <CustomSelect
                value={selectedSubStrategyId}
                onChange={handleSubStrategyChange}
                disabled={!selectedStrategyId}
                placeholder={selectedStrategyId ? '-- เลือกแผนงานย่อย --' : 'กรุณาเลือกแผนงานหลักก่อน'}
                multiline={true}
                className={errors.subStrategyId ? 'ring-2 ring-red-400 rounded-xl' : ''}
                options={filteredSubStrategies.map(ss => ({
                  value: String(ss.id),
                  label: ss.name,
                  badge: ss.code
                }))}
              />
              {errors.subStrategyId && (
                <span className="text-xs font-semibold text-red-500 mt-1 block">
                  {errors.subStrategyId.message}
                </span>
              )}
            </div>

            {/* 4. Indicator (โครงการหลัก) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">4</span>
                  <span>โครงการหลักระดับมหาวิทยาลัย (Main Project - MP)</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  {selectedSubStrategyId ? `${filteredIndicators.length} โครงการหลัก` : 'ต้องเลือกข้อ 3 ก่อน'}
                </span>
              </div>
              <CustomSelect
                value={watchedIndicatorId || ''}
                onChange={handleIndicatorChange}
                disabled={!selectedSubStrategyId}
                placeholder={selectedSubStrategyId ? '-- เลือกโครงการหลัก (ถ้ามี) --' : 'กรุณาเลือกแผนงานย่อยก่อน'}
                multiline={true}
                options={[
                  { value: '', label: '-- ไม่ระบุโครงการหลัก (ไม่เลือก) --', badge: 'OPTIONAL' },
                  ...filteredIndicators.map(ind => ({
                    value: String(ind.id),
                    label: ind.name,
                    badge: ind.code
                  }))
                ]}
              />
            </div>
          </div>

          {/* Active Hierarchy Path Visual Summary - Stepper Card Flow */}
          {(selectedLocalIssueId || selectedStrategyId) && (
            <div className="mt-5 bg-white/95 rounded-2xl border border-purple-100/90 shadow-sm p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                  <FiLayers className="w-4 h-4 text-primary" />
                  <span>เส้นทางยุทธศาสตร์ที่เลือก (Strategic Alignment Pipeline)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  สายสัมพันธ์ 4 ระดับ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                {/* Step 1: ประเด็นการพัฒนาท้องถิ่น */}
                <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  currentLocalIssue 
                    ? 'bg-violet-50/50 border-violet-200/80 shadow-2xs' 
                    : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-black text-violet-700 tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-violet-200/80 text-violet-800 flex items-center justify-center text-[9px] font-black">1</span>
                        ประเด็นการพัฒนา
                      </span>
                      {currentLocalIssue && (
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-violet-600 text-white shadow-xs">
                          {currentLocalIssue.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug break-words">
                      {currentLocalIssue ? currentLocalIssue.name : 'ทุกประเด็นการพัฒนา'}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-violet-500 flex items-center gap-1">
                    <span>ระดับยุทธศาสตร์ที่ 1</span>
                  </div>
                </div>

                {/* Step 2: แผนงานหลัก */}
                <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  currentStrategy 
                    ? 'bg-purple-50/50 border-purple-200/80 shadow-2xs' 
                    : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-black text-purple-700 tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-200/80 text-purple-800 flex items-center justify-center text-[9px] font-black">2</span>
                        แผนงานหลัก
                      </span>
                      {currentStrategy && (
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-purple-600 text-white shadow-xs">
                          {currentStrategy.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug break-words">
                      {currentStrategy ? currentStrategy.name : 'ยังไม่ได้เลือก'}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-purple-500 flex items-center gap-1">
                    <span>ระดับยุทธศาสตร์ที่ 2</span>
                  </div>
                </div>

                {/* Step 3: แผนงานย่อย */}
                <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  currentSubStrategy 
                    ? 'bg-blue-50/50 border-blue-200/80 shadow-2xs' 
                    : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-black text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-200/80 text-blue-800 flex items-center justify-center text-[9px] font-black">3</span>
                        แผนงานย่อย
                      </span>
                      {currentSubStrategy && (
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                          {currentSubStrategy.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug break-words">
                      {currentSubStrategy ? currentSubStrategy.name : 'ยังไม่ได้เลือก'}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-blue-500 flex items-center gap-1">
                    <span>ระดับยุทธศาสตร์ที่ 3</span>
                  </div>
                </div>

                {/* Step 4: โครงการหลัก */}
                <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  currentIndicator 
                    ? 'bg-emerald-50/50 border-emerald-200/80 shadow-2xs' 
                    : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-black text-emerald-700 tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center text-[9px] font-black">4</span>
                        โครงการหลัก (MP)
                      </span>
                      {currentIndicator && (
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                          {currentIndicator.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug break-words">
                      {currentIndicator ? currentIndicator.name : '(ยังไม่ระบุ/ไม่เลือก)'}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <span>ระดับยุทธศาสตร์ที่ 4</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Budget Sources and Year */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fiscal Year */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500">ปีงบประมาณ <span className="text-red-500">*</span></label>
            <input type="hidden" {...register('fiscalYearId', { required: 'กรุณาเลือกปีงบประมาณ' })} />
            <CustomSelect
              value={watchedFiscalYearId || ''}
              onChange={(val) => setValue('fiscalYearId', val, { shouldValidate: true })}
              placeholder="-- เลือกปีงบประมาณ --"
              className={errors.fiscalYearId ? 'ring-2 ring-red-400 rounded-xl' : ''}
              options={fiscalYears.map(fy => ({
                value: String(fy.id),
                label: `ปี พ.ศ. ${fy.year} ${fy.active ? '(ปีงบปัจจุบัน)' : ''}`,
                badge: fy.active ? 'ปัจจุบัน' : undefined
              }))}
            />
            {errors.fiscalYearId && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.fiscalYearId.message}</span>}
          </div>

          {/* Budget Source */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500">แหล่งที่มางบประมาณ <span className="text-red-500">*</span></label>
            <input type="hidden" {...register('budgetSourceId', { required: 'กรุณาเลือกแหล่งงบประมาณ' })} />
            <CustomSelect
              value={watchedBudgetSourceId || ''}
              onChange={(val) => setValue('budgetSourceId', val, { shouldValidate: true })}
              placeholder="-- เลือกแหล่งงบประมาณ --"
              className={errors.budgetSourceId ? 'ring-2 ring-red-400 rounded-xl' : ''}
              options={budgetSources.map(bs => ({
                value: String(bs.id),
                label: bs.name
              }))}
            />
            {errors.budgetSourceId && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.budgetSourceId.message}</span>}
          </div>

          {/* Total Budget */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500">
                งบประมาณโครงการรวม (บาท) <span className="text-red-500">*</span>
              </label>
              {isPlanLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <FiLock className="w-3 h-3" /> ล็อก
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="0"
              readOnly={isPlanLocked}
              disabled={isPlanLocked}
              className={`w-full px-4 py-2.5 border ${errors.totalBudget ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all shadow-2xs ${isPlanLocked ? 'bg-slate-100/80 text-slate-500 cursor-not-allowed' : ''}`}
              {...register('totalBudget', { 
                required: 'กรุณากรอกงบประมาณรวม',
                validate: (val) => {
                  const num = parseFloat(String(val).replace(/,/g, ''));
                  if (isNaN(num) || num < 0) return 'งบประมาณต้องเป็นตัวเลขและมากกว่าหรือเท่ากับ 0';
                  return true;
                }
              })}
              onChange={(e) => {
                if (isPlanLocked) return;
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                if (!raw) {
                  setValue('totalBudget', '', { shouldValidate: true });
                  return;
                }
                const parts = raw.split('.');
                parts[0] = Number(parts[0]).toLocaleString('en-US');
                const formatted = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
                setValue('totalBudget', formatted, { shouldValidate: true });
              }}
            />
            {errors.totalBudget && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.totalBudget.message}</span>}
          </div>
        </div>

        {/* Target and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Count */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500">
                จำนวนเป้าหมาย <span className="text-red-500">*</span>
              </label>
              {isPlanLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <FiLock className="w-3 h-3" /> ล็อก
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="0"
              readOnly={isPlanLocked}
              disabled={isPlanLocked}
              className={`w-full px-4 py-2.5 border ${errors.targetCount ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all shadow-2xs ${isPlanLocked ? 'bg-slate-100/80 text-slate-500 cursor-not-allowed' : ''}`}
              {...register('targetCount', { 
                required: 'กรุณากรอกจำนวนเป้าหมาย', 
                min: { value: 1, message: 'เป้าหมายต้องมากกว่า 0' },
                validate: (val) => {
                  const num = Number(val);
                  if (!Number.isInteger(num)) return 'เป้าหมายต้องเป็นจำนวนเต็ม';
                  return true;
                }
              })}
            />
            {errors.targetCount && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.targetCount.message}</span>}
          </div>

          {/* Unit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500">
                หน่วยนับความสำเร็จ <span className="text-red-500">*</span>
              </label>
              {isCustomUnit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomUnit(false);
                    setValue('unit', 'กิจกรรม', { shouldValidate: true });
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  ← เลือกจากรายการ
                </button>
              )}
            </div>

            {/* Hidden input registered with react-hook-form */}
            <input
              type="hidden"
              {...register('unit', { required: 'กรุณาเลือกหรือระบุหน่วยนับความสำเร็จ' })}
            />

            {!isCustomUnit ? (
              <CustomSelect
                value={watchedUnit || ''}
                onChange={(val) => {
                  if (val === '__custom__') {
                    setIsCustomUnit(true);
                    setValue('unit', '', { shouldValidate: true });
                  } else {
                    setIsCustomUnit(false);
                    setValue('unit', val, { shouldValidate: true });
                  }
                }}
                placeholder="-- เลือกหน่วยนับ --"
                searchable={false}
                className={errors.unit ? 'ring-2 ring-red-400 rounded-xl' : ''}
                options={UNIT_OPTIONS}
              />
            ) : (
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  value={watchedUnit || ''}
                  onChange={(e) => setValue('unit', e.target.value, { shouldValidate: true })}
                  placeholder="พิมพ์ระบุหน่วยนับ เช่น แปลง, ครัวเรือน..."
                  className={`w-full px-4 py-2.5 pr-16 border ${errors.unit ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all shadow-2xs`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomUnit(false);
                    setValue('unit', 'กิจกรรม', { shouldValidate: true });
                  }}
                  className="absolute right-2 px-2.5 py-1 text-xs text-gray-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            )}
            {errors.unit && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.unit.message}</span>}
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">วันที่เริ่มดำเนินงาน <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={`w-full px-4 py-2.5 border ${errors.startDate ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all shadow-2xs`}
              {...register('startDate', { required: 'กรุณากรอกวันเริ่มต้นดำเนินโครงการ' })}
            />
            {errors.startDate && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.startDate.message}</span>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">วันที่สิ้นสุดการดำเนินงาน <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={`w-full px-4 py-2.5 border ${errors.endDate ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all shadow-2xs`}
              {...register('endDate', { required: 'กรุณากรอกวันสิ้นสุดโครงการ' })}
            />
            {errors.endDate && <span className="text-xs text-red-500 mt-1 block font-semibold">{errors.endDate.message}</span>}
          </div>
        </div>

        {/* Responsible Person Section */}
        <div className="space-y-4 pt-2">
          {/* 1. Primary Responsible Person (Auto-selected from Creator) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                ผู้รับผิดชอบโครงการ (ผู้สร้างโครงการ) <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-slate-50 border border-emerald-200/80 rounded-xl shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {isEdit && project?.creator ? project.creator.name?.charAt(0) : user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>{isEdit && project?.creator ? project.creator.name : user?.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                      ผู้รับผิดชอบหลัก
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isEdit && project?.department?.name 
                      ? `${project.department.name} (${project.faculty?.name || project.department?.faculty?.name || 'มหาวิทยาลัย'})` 
                      : `${user?.department?.name || 'ไม่ระบุภาควิชา/หน่วยงาน'} (${user?.department?.faculty?.name || 'มหาวิทยาลัย'})`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-2">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  disabled
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-300 accent-emerald-600 cursor-not-allowed"
                />
                <span className="text-[11px] font-bold text-emerald-700">เลือกแล้ว</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-1">
              * บัญชีผู้สร้างโครงการจะได้รับสิทธิ์เป็นผู้รับผิดชอบโครงการโดยตรงโดยอัตโนมัติ
            </p>
          </div>

          {/* 2. Co-Responsibles / Team Members (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                ผู้ประสานงาน / ผู้รับผิดชอบร่วม <span className="text-gray-400 font-normal">(ถ้ามี)</span>
              </label>
              <span className="text-[10px] text-gray-400">เลือกได้มากกว่า 1 ท่าน (หากไม่มีไม่ต้องเลือก)</span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 bg-gray-50/60">
              {coResponsibles.length > 0 ? (
                coResponsibles.map(u => {
                  const rawDept = u.department?.name || '';
                  const deptDisplay = rawDept 
                    ? (rawDept.includes('สาขา') || rawDept.includes('ภาควิชา') ? rawDept : `สาขา${rawDept}`)
                    : 'ไม่ระบุสาขา';

                  return (
                    <label key={u.id} className="flex items-center justify-between gap-2.5 text-xs text-gray-700 cursor-pointer p-2 hover:bg-white hover:shadow-2xs rounded-lg transition-all border border-transparent hover:border-gray-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          value={String(u.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary shrink-0"
                          {...register('userIds')}
                        />
                        <span className="font-medium text-slate-800 truncate">{u.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-primary/90 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 shrink-0">
                        {deptDisplay}
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 font-medium">
                  {currentFacultyName ? `ไม่พบคณาจารย์ท่านอื่นใน${currentFacultyName} (ท่านเป็นผู้รับผิดชอบหลักของโครงการนี้)` : 'ไม่มีรายชื่อผู้ประสานงานอื่น'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            <FiSave />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกโครงการ'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
