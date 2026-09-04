import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import CustomSelect from '../../components/CustomSelect';
import Swal from 'sweetalert2';
import { FiArrowLeft, FiSave, FiCompass, FiLayers, FiTarget, FiAward } from 'react-icons/fi';

const ProjectForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams(); // present if edit mode
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown options arrays
  const [fiscalYears, setFiscalYears] = useState([]);
  const [budgetSources, setBudgetSources] = useState([]);
  const [users, setUsers] = useState([]);

  // Cascading Strategies Options
  const [strategies, setStrategies] = useState([]);
  const [localIssues, setLocalIssues] = useState([]);
  const [subStrategies, setSubStrategies] = useState([]);
  const [indicators, setIndicators] = useState([]);

  // Selected cascade states for filtering dropdowns
  const [selectedLocalIssueId, setSelectedLocalIssueId] = useState('');
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [selectedSubStrategyId, setSelectedSubStrategyId] = useState('');

  // Project details if edit mode
  const [project, setProject] = useState(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

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

        setFiscalYears(years.data);
        setBudgetSources(sources.data);
        setUsers(usrList.data.filter(u => u.role === 'TEACHER')); // only select teachers as responsibles
        setStrategies(strats.data);
        setSubStrategies(subStrats.data);
        setIndicators(inds.data);
        setLocalIssues(lIssues.data);

        // Pre-select active fiscal year
        const activeYear = years.data.find(y => y.active);
        if (activeYear && !isEdit) {
          setValue('fiscalYearId', activeYear.id);
        }

        // If Edit Mode, load the project details
        if (isEdit) {
          const projResp = await api.get(`/projects/${id}`);
          const proj = projResp.data;
          setProject(proj);

          // Populate Form values
          setValue('name', proj.name);
          setValue('description', proj.description);
          setValue('fiscalYearId', proj.fiscalYearId);
          const budgetVal = parseFloat(proj.totalBudget);
          setValue('totalBudget', isNaN(budgetVal) ? '' : budgetVal.toLocaleString('en-US'));
          setValue('targetCount', proj.targetCount);
          setValue('unit', proj.unit);
          setValue('startDate', proj.startDate.split('T')[0]);
          setValue('endDate', proj.endDate.split('T')[0]);

          // Set cascading values
          const subStrat = subStrats.data.find(ss => ss.id === proj.subStrategyId);
          if (subStrat) {
            const strat = strats.data.find(s => s.id === subStrat.strategyId);
            if (strat && strat.localIssueId) {
              setSelectedLocalIssueId(String(strat.localIssueId));
            }
            setSelectedStrategyId(String(subStrat.strategyId));
            setValue('strategyId', subStrat.strategyId);
          }
          setSelectedSubStrategyId(String(proj.subStrategyId));
          setValue('subStrategyId', proj.subStrategyId);
          setValue('indicatorId', proj.indicatorId || '');

          // Multi-responsibles user mapping (exclude creator)
          const assignedUserIds = proj.users
            .map(u => u.userId)
            .filter(uId => uId !== proj.creatorId);
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

  // When Local Issue changes, reset downstream selections
  const handleLocalIssueChange = (val) => {
    setSelectedLocalIssueId(val);
    setSelectedStrategyId('');
    setSelectedSubStrategyId('');
    setValue('strategyId', '');
    setValue('subStrategyId', '');
    setValue('indicatorId', '');
  };

  // When Strategy changes, auto-sync Local Issue if applicable and reset downstream
  const handleStrategyChange = (val) => {
    setSelectedStrategyId(val);
    setValue('strategyId', val, { shouldValidate: true });
    const chosenStrat = strategies.find(s => String(s.id) === String(val));
    if (chosenStrat && chosenStrat.localIssueId) {
      setSelectedLocalIssueId(String(chosenStrat.localIssueId));
    }
    setSelectedSubStrategyId('');
    setValue('subStrategyId', '');
    setValue('indicatorId', '');
  };

  // When Sub-strategy changes, reset indicator
  const handleSubStrategyChange = (val) => {
    setSelectedSubStrategyId(val);
    setValue('subStrategyId', val, { shouldValidate: true });
    setValue('indicatorId', '');
  };

  const handleIndicatorChange = (val) => {
    setValue('indicatorId', val);
  };

  // Submit Handler
  const onSubmit = async (data) => {
    // Basic verification on completed count vs new target count if edit
    if (isEdit && project && project.completedCount > parseInt(data.targetCount) && user?.role !== 'ADMIN') {
      Swal.fire({
        icon: 'error',
        title: 'เป้าหมายไม่ถูกต้อง',
        text: `จำนวนที่ทำเสร็จแล้วในโครงการนี้คือ ${project.completedCount} ครั้ง ซึ่งจะมากกว่าเป้าหมายรวมใหม่ไม่ได้`
      });
      return;
    }

    setSaving(true);
    try {
      // Clean comma from budget string before parsing
      const rawBudget = typeof data.totalBudget === 'string' ? data.totalBudget.replace(/,/g, '') : data.totalBudget;

      const payload = {
        name: data.name,
        description: data.description,
        fiscalYearId: parseInt(data.fiscalYearId),
        budgetSourceId: parseInt(data.budgetSourceId),
        subStrategyId: parseInt(data.subStrategyId),
        indicatorId: data.indicatorId ? parseInt(data.indicatorId) : null,
        totalBudget: parseFloat(rawBudget),
        targetCount: parseInt(data.targetCount),
        unit: data.unit,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        userIds: data.userIds ? data.userIds.map(id => parseInt(id)) : []
      };

      if (isEdit) {
        await api.put(`/projects/${id}`, payload);
        Swal.fire({ icon: 'success', title: 'ปรับปรุงโครงการสำเร็จ', showConfirmButton: false, timer: 1500 });
        navigate(`/projects/${id}`);
      } else {
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
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: err.response?.data?.message || 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง'
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter lists based on selections
  const filteredStrategies = selectedLocalIssueId
    ? strategies.filter(s => s.localIssueId === parseInt(selectedLocalIssueId))
    : strategies;
  const filteredSubStrategies = subStrategies.filter(ss => ss.strategyId === parseInt(selectedStrategyId));
  const filteredIndicators = indicators.filter(ind => ind.subStrategyId === parseInt(selectedSubStrategyId));

  // Active hierarchy path labels
  const currentLocalIssue = localIssues.find(li => String(li.id) === String(selectedLocalIssueId));
  const currentStrategy = strategies.find(s => String(s.id) === String(selectedStrategyId));
  const currentSubStrategy = subStrategies.find(ss => String(ss.id) === String(selectedSubStrategyId));
  const currentIndicator = indicators.find(ind => String(ind.id) === String(watch('indicatorId')));

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

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 sm:p-8 space-y-6">

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
            className={`w-full px-4 py-2.5 border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
            {...register('name', { required: 'กรุณากรอกชื่อโครงการปฏิบัติการ' })}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            💡 <strong>ข้อแนะนำ:</strong> ระบุชื่อโครงการเฉพาะของท่านหรือคณะที่จะลงมือปฏิบัติจริงในพื้นที่ โดยไม่ต้องคัดลอกชื่อโครงการหลัก (MP)
          </p>
          {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">รายละเอียดคำอธิบายโครงการ</label>
          <textarea
            rows="3"
            placeholder="รายละเอียดและวัตถุประสงค์โครงการ..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
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
                value={watch('indicatorId') || ''}
                onChange={handleIndicatorChange}
                disabled={!selectedSubStrategyId}
                placeholder={selectedSubStrategyId ? '-- เลือกโครงการหลัก --' : 'กรุณาเลือกแผนงานย่อยก่อน'}
                multiline={true}
                options={filteredIndicators.map(ind => ({
                  value: String(ind.id),
                  label: ind.name,
                  badge: ind.code
                }))}
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
              value={watch('fiscalYearId') || ''}
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
              value={watch('budgetSourceId') || ''}
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
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">งบประมาณโครงการรวม (บาท) <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="0"
              className={`w-full px-4 py-2 border ${errors.totalBudget ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
              {...register('totalBudget', { 
                required: 'กรุณากรอกงบประมาณรวม',
                validate: (val) => {
                  const num = parseFloat(String(val).replace(/,/g, ''));
                  if (isNaN(num) || num < 0) return 'งบประมาณต้องเป็นตัวเลขและมากกว่าหรือเท่ากับ 0';
                  return true;
                }
              })}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                if (!raw) {
                  setValue('totalBudget', '');
                  return;
                }
                const parts = raw.split('.');
                parts[0] = Number(parts[0]).toLocaleString('en-US');
                const formatted = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
                setValue('totalBudget', formatted);
              }}
            />
            {errors.totalBudget && <span className="text-xs text-red-500 mt-1 block">{errors.totalBudget.message}</span>}
          </div>
        </div>

        {/* Target Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary-light/30 p-5 rounded-xl border border-primary-light">
          {/* Target Count */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">จำนวนครั้ง/เป้าหมายการดำเนินงาน <span className="text-red-500">*</span></label>
            <input
              type="number"
              placeholder="เช่น 10, 20"
              className={`w-full px-4 py-2 border ${errors.targetCount ? 'border-red-400' : 'border-gray-200'} bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
              {...register('targetCount', { required: 'กรุณากรอกเป้าหมายสะสม', min: { value: 1, message: 'เป้าหมายต้องเป็นบวก' } })}
            />
            {errors.targetCount && <span className="text-xs text-red-500 mt-1 block">{errors.targetCount.message}</span>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">หน่วยนับความสำเร็จ <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="กรอกหน่วยนับความสำเร็จ เช่น ครั้ง, คน, ชุมชน, ร้อยละ..."
              className={`w-full px-4 py-2 border ${errors.unit ? 'border-red-400' : 'border-gray-200'} bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
              {...register('unit', { required: 'กรุณากรอกหน่วยนับความสำเร็จ' })}
            />
            {errors.unit && <span className="text-xs text-red-500 mt-1 block">{errors.unit.message}</span>}
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">วันที่เริ่มดำเนินงาน <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={`w-full px-4 py-2 border ${errors.startDate ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
              {...register('startDate', { required: 'กรุณากรอกวันเริ่มต้นดำเนินโครงการ' })}
            />
            {errors.startDate && <span className="text-xs text-red-500 mt-1 block">{errors.startDate.message}</span>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">วันที่สิ้นสุดการดำเนินงาน <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={`w-full px-4 py-2 border ${errors.endDate ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
              {...register('endDate', { required: 'กรุณากรอกวันสิ้นสุดโครงการ' })}
            />
            {errors.endDate && <span className="text-xs text-red-500 mt-1 block">{errors.endDate.message}</span>}
          </div>
        </div>

        {/* Multi-Responsibles Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            ผู้ประสานงาน / ผู้รับผิดชอบร่วม <span className="text-[10px] text-gray-400">(ท่านจะได้รับมอบสิทธิ์โดยอัตโนมัติ)</span>
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
            {users.map(u => (
              <label key={u.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-1.5 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  value={u.id}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  {...register('userIds')}
                />
                <span>{u.name} ({u.department?.name || 'ไม่สังกัด'})</span>
              </label>
            ))}
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
