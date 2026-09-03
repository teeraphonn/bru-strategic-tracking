import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

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
  const [subStrategies, setSubStrategies] = useState([]);
  const [indicators, setIndicators] = useState([]);

  // Selected Strategy and Sub-strategy state for filtering dropdowns
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [selectedSubStrategyId, setSelectedSubStrategyId] = useState('');

  // Project details if edit mode
  const [project, setProject] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  // Load masters and users
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [years, sources, usrList, strats, subStrats, inds] = await Promise.all([
          api.get('/master/fiscal-years'),
          api.get('/master/budget-sources'),
          api.get('/master/users'),
          api.get('/master/strategies'),
          api.get('/master/sub-strategies'),
          api.get('/master/indicators')
        ]);

        setFiscalYears(years.data);
        setBudgetSources(sources.data);
        setUsers(usrList.data.filter(u => u.role === 'TEACHER')); // only select teachers as responsibles
        setStrategies(strats.data);
        setSubStrategies(subStrats.data);
        setIndicators(inds.data);

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
            setSelectedStrategyId(subStrat.strategyId);
            setValue('strategyId', subStrat.strategyId);
          }
          setSelectedSubStrategyId(proj.subStrategyId);
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

  // When Strategy changes, reset sub-strategy and indicator
  const handleStrategyChange = (e) => {
    const sId = e.target.value;
    setSelectedStrategyId(sId);
    setSelectedSubStrategyId('');
    setValue('subStrategyId', '');
    setValue('indicatorId', '');
  };

  // When Sub-strategy changes, reset indicator
  const handleSubStrategyChange = (e) => {
    const ssId = e.target.value;
    setSelectedSubStrategyId(ssId);
    setValue('indicatorId', '');
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
      } else {
        await api.post('/projects', payload);
        Swal.fire({ icon: 'success', title: 'สร้างโครงการสำเร็จ', showConfirmButton: false, timer: 1500 });
      }
      navigate('/projects');
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
  const filteredSubStrategies = subStrategies.filter(ss => ss.strategyId === parseInt(selectedStrategyId));
  const filteredIndicators = indicators.filter(ind => ind.subStrategyId === parseInt(selectedSubStrategyId));

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
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">ชื่อโครงการ <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="กรุณากรอกชื่อโครงการ"
            className={`w-full px-4 py-2.5 border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all`}
            {...register('name', { required: 'กรุณากรอกชื่อโครงการ' })}
          />
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

        {/* Dynamic Cascading Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strategy */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">แผนงานหลัก <span className="text-red-500">*</span></label>
            <select
              className={`w-full px-3 py-2 border ${errors.strategyId ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm`}
              {...register('strategyId', { required: 'กรุณาเลือกแผนงานหลัก' })}
              onChange={handleStrategyChange}
              value={selectedStrategyId}
            >
              <option value="">-- เลือกแผนงานหลัก --</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
            {errors.strategyId && <span className="text-xs text-red-500 mt-1 block">{errors.strategyId.message}</span>}
          </div>

          {/* Sub Strategy */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">แผนงานย่อย <span className="text-red-500">*</span></label>
            <select
              className={`w-full px-3 py-2 border ${errors.subStrategyId ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm`}
              {...register('subStrategyId', { required: 'กรุณาเลือกแผนงานย่อย' })}
              onChange={handleSubStrategyChange}
              disabled={!selectedStrategyId}
              value={selectedSubStrategyId}
            >
              <option value="">-- เลือกแผนงานย่อย --</option>
              {filteredSubStrategies.map(ss => (
                <option key={ss.id} value={ss.id}>{ss.code} - {ss.name}</option>
              ))}
            </select>
            {errors.subStrategyId && <span className="text-xs text-red-500 mt-1 block">{errors.subStrategyId.message}</span>}
          </div>

          {/* Indicator */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">โครงการหลัก</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              {...register('indicatorId')}
              disabled={!selectedSubStrategyId}
            >
              <option value="">-- เลือกโครงการหลัก --</option>
              {filteredIndicators.map(ind => (
                <option key={ind.id} value={ind.id}>{ind.code} - {ind.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget Sources and Year */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fiscal Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">ปีงบประมาณ <span className="text-red-500">*</span></label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              {...register('fiscalYearId', { required: 'กรุณาเลือกปีงบประมาณ' })}
            >
              {fiscalYears.map(fy => (
                <option key={fy.id} value={fy.id}>ปี พ.ศ. {fy.year} {fy.active ? '(ปีงบปัจจุบัน)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Budget Source */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">แหล่งที่มางบประมาณ <span className="text-red-500">*</span></label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              {...register('budgetSourceId', { required: 'กรุณาเลือกแหล่งงบประมาณ' })}
            >
              <option value="">-- เลือกแหล่งงบประมาณ --</option>
              {budgetSources.map(bs => (
                <option key={bs.id} value={bs.id}>{bs.name}</option>
              ))}
            </select>
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
