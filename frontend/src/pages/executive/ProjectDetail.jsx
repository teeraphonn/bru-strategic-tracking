import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import {
  FiArrowLeft,
  FiBriefcase,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiTarget,
  FiActivity,
  FiAlertTriangle,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiPrinter,
  FiLayers
} from 'react-icons/fi';

const ExecutiveProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Executive Directive Form State
  const [directiveText, setDirectiveText] = useState('');
  const [submittingDirective, setSubmittingDirective] = useState(false);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      const data = res.data;
      setProject(data);
      if (user?.role === 'DEAN') {
        setDirectiveText(data.deanDirective || '');
      } else if (user?.role === 'PRESIDENT') {
        setDirectiveText(data.presidentDirective || '');
      } else {
        setDirectiveText(data.executiveDirective || '');
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch executive project details:', err);
      setError('ไม่สามารถโหลดข้อมูลโครงการเชิงยุทธศาสตร์ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjectData();
    }
  }, [id, user]);

  const handleSaveDirective = async (e) => {
    e.preventDefault();
    if (!directiveText.trim()) {
      Swal.fire('คำเตือน', 'กรุณากรอกข้อความสั่งการ/ข้อคิดเห็นของผู้บริหารก่อนบันทึก', 'warning');
      return;
    }

    try {
      setSubmittingDirective(true);
      const res = await api.post(`/projects/${id}/directive`, {
        directive: directiveText.trim()
      });

      const updatedData = res.data;
      setProject(updatedData);
      
      if (user?.role === 'DEAN') {
        setDirectiveText(updatedData.deanDirective || '');
      } else if (user?.role === 'PRESIDENT') {
        setDirectiveText(updatedData.presidentDirective || '');
      } else {
        setDirectiveText(updatedData.executiveDirective || '');
      }

      Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อสั่งการสำเร็จ!',
        text: 'ระบบได้ทำการส่งการแจ้งเตือนไปยังผู้รับผิดชอบโครงการเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Failed to submit executive directive:', err);
      Swal.fire('เกิดข้อผิดพลาด', err.response?.data?.message || 'ไม่สามารถบันทึกข้อสั่งการได้', 'error');
    } finally {
      setSubmittingDirective(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl border border-rose-200 font-bold text-xs space-y-3">
        <div>{error || 'ไม่พบข้อมูลโครงการที่ระบุ'}</div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-rose-700 underline font-extrabold"
        >
          <FiArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>
      </div>
    );
  }

  // Calculate RAG Flag metrics
  const rawActivities = project.activities || [];
  const activities = [...rawActivities].sort((a, b) => {
    const tA = new Date(a.activityDate || a.createdAt).getTime();
    const tB = new Date(b.activityDate || b.createdAt).getTime();
    if (tA !== tB) return tA - tB;
    return (a.id || 0) - (b.id || 0);
  });
  const budgetNum = parseFloat(project.totalBudget || 0);
  const spentNum = activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
  const burnRatePct = budgetNum > 0 ? parseFloat(((spentNum / budgetNum) * 100).toFixed(1)) : 0;
  const targetCount = project.targetCount || 1;
  const completedCount = project.completedCount || 0;
  const progressPct = targetCount > 0 ? parseFloat(((completedCount / targetCount) * 100).toFixed(1)) : 0;

  const overBudgetItem = activities.find(a => parseFloat(a.actualBudget || 0) > parseFloat(a.budget || 0));

  let ragStatus = 'GREEN';
  let ragBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let ragReason = 'การดำเนินงานและเบิกจ่ายงบประมาณเป็นไปตามแผนที่กำหนด';

  if (progressPct < 40 || (burnRatePct > 90 && progressPct < 50) || overBudgetItem) {
    ragStatus = 'RED';
    ragBadge = 'bg-rose-50 text-rose-700 border-rose-200';
    if (overBudgetItem) {
      ragReason = `มีกิจกรรมย่อย (${overBudgetItem.name}) เบิกจ่ายเกินงบแผนที่ตั้งไว้`;
    } else if (burnRatePct > 90 && progressPct < 50) {
      ragReason = `งบประมาณถูกใช้ไปแล้วกว่า ${burnRatePct}% แต่ความก้าวหน้าผลงานได้เพียง ${progressPct}%`;
    } else {
      ragReason = `ความก้าวหน้าโครงการล่าช้ากว่ากำหนดมาก (${progressPct}%)`;
    }
  } else if (progressPct < 75 || Math.abs(burnRatePct - progressPct) > 25) {
    ragStatus = 'YELLOW';
    ragBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    ragReason = 'ความก้าวหน้าโครงการอยู่ในระดับเฝ้าระวัง';
  }

  return (
    <div className="pb-12">
      <div className="screen-only space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 text-xs font-extrabold transition-all shadow-2xs cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4 text-slate-500" />
          <span>ย้อนกลับแดชบอร์ด</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-extrabold border border-amber-200">
            <FiLock className="w-3.5 h-3.5 text-amber-600" />
            <span>โหมดอ่านสำหรับผู้บริหาร (Executive Read-Only)</span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 text-xs font-extrabold transition-all shadow-2xs cursor-pointer"
          >
            <FiPrinter className="w-4 h-4 text-primary" />
            <span>พิมพ์สรุป</span>
          </button>
        </div>
      </div>

      {/* Layer 3 Executive Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-3.5 py-1 rounded-full border shadow-2xs ${ragBadge}`}>
                {ragStatus === 'RED' ? '🔴 RED FLAG - วิกฤตด่วน' : ragStatus === 'YELLOW' ? '🟡 WARN - เฝ้าระวัง' : '🟢 GREEN - ปกติ'}
              </span>
              <span className="text-xs font-bold text-slate-400">รหัสโครงการ #{project.id}</span>
            </div>

            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <FiCalendar className="w-4 h-4 text-indigo-400" />
              <span>ปีงบประมาณ พ.ศ. {project.fiscalYear?.year}</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-white leading-snug">
            {project.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200/90 pt-2 border-t border-white/10">
            <div><span className="font-bold text-white">สังกัด:</span> {project.faculty?.name?.startsWith('คณะ') ? project.faculty.name : `คณะ${project.faculty?.name || 'ส่วนกลาง'}`} ({project.department?.name || 'ไม่ระบุภาควิชา'})</div>
            <div><span className="font-bold text-white">ผู้รับผิดชอบหลัก:</span> {project.creator?.name || 'ไม่ระบุ'}</div>
            <div><span className="font-bold text-white">แหล่งงบประมาณ:</span> {project.budgetSource?.name || 'ไม่ระบุ'}</div>
          </div>
        </div>
      </div>

      {/* Root Cause Reason Alert Box */}
      {ragStatus !== 'GREEN' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
            <FiAlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>จุดวิกฤตและสาเหตุความล่าช้า (Root Cause Analysis)</span>
          </div>
          <p className="text-xs text-rose-700 font-semibold pl-7">{ragReason}</p>
        </div>
      )}

      {/* 2. Executive Analytics Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft space-y-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">งบประมาณจัดสรรทั้งหมด</div>
          <div className="text-xl font-black text-slate-800">{budgetNum.toLocaleString()} ฿</div>
          <div className="text-[10px] text-slate-400">ตามอนุมัติแผนงาน</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft space-y-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">งบประมาณเบิกจ่ายจริง (Burn Rate)</div>
          <div className="text-xl font-black text-emerald-600">{spentNum.toLocaleString()} ฿</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, burnRatePct)}%` }} />
          </div>
          <div className="text-[10px] text-slate-500 font-bold text-right">{burnRatePct}% ของงบอนุมัติ</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft space-y-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ผลสัมฤทธิ์ KPI ตัวชี้วัด</div>
          <div className="text-xl font-black text-primary">{completedCount} / {targetCount} {project.unit}</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
          <div className="text-[10px] text-slate-500 font-bold text-right">{progressPct}% ความสำเร็จ</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft space-y-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">สถานะกิจกรรมย่อย</div>
          <div className="text-xl font-black text-slate-800">{activities.length} ขั้นตอน</div>
          <div className="text-[10px] text-emerald-600 font-bold">
            เสร็จแล้ว {activities.filter(a => a.success).length} ขั้นตอน
          </div>
        </div>
      </div>

      {/* 3. Executive Directive Panel (ข้อสั่งการผู้บริหาร / Executive Feedback Note) */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FiSend className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>สมุดบันทึกข้อสั่งการผู้บริหาร (Executive Directive Panel)</span>
            </h2>
            <p className="text-xs text-indigo-200/80">บันทึกคำสั่งการ ข้อเสนอแนะ หรือแนวนโยบายเร่งรัดส่งไปยังผู้รับผิดชอบโครงการ</p>
          </div>

          {project.directiveUpdatedAt && (
            <div className="text-[11px] text-indigo-300/80 font-bold shrink-0">
              อัปเดตล่าสุด: {new Date(project.directiveUpdatedAt).toLocaleString('th-TH')}
            </div>
          )}
        </div>

        {/* Existing Active Directives */}
        {(project.deanDirective || project.presidentDirective || project.executiveDirective) && (
          <div className="space-y-3">
            {/* 1. Dean Directive */}
            {project.deanDirective && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-1.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-300">
                    <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/40 text-[9px] uppercase">
                      คณบดี (Dean)
                    </span>
                    <span>ผู้สั่งการ: {project.deanDirectiveIssuerName || 'คณบดี'}</span>
                  </div>
                  {project.deanDirectiveUpdatedAt && (
                    <span className="text-[10px] text-indigo-200/70">
                      {new Date(project.deanDirectiveUpdatedAt).toLocaleString('th-TH')}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white leading-relaxed pl-1">
                  "{project.deanDirective}"
                </p>
              </div>
            )}

            {/* 2. President Directive */}
            {project.presidentDirective && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-1.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-sky-300">
                    <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-sky-200 border border-blue-400/40 text-[9px] uppercase">
                      อธิการบดี (President)
                    </span>
                    <span>ผู้สั่งการ: {project.presidentDirectiveIssuerName || 'อธิการบดี'}</span>
                  </div>
                  {project.presidentDirectiveUpdatedAt && (
                    <span className="text-[10px] text-indigo-200/70">
                      {new Date(project.presidentDirectiveUpdatedAt).toLocaleString('th-TH')}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white leading-relaxed pl-1">
                  "{project.presidentDirective}"
                </p>
              </div>
            )}

            {/* 3. Fallback for legacy directive */}
            {!project.deanDirective && !project.presidentDirective && project.executiveDirective && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-1.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-300">
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-300/40 text-[10px] uppercase">
                      {project.directiveIssuerRole === 'PRESIDENT' ? 'อธิการบดี' : project.directiveIssuerRole === 'DEAN' ? 'คณบดี' : 'ผู้บริหาร'}
                    </span>
                    <span>ผู้สั่งการ: {project.directiveIssuerName || 'ผู้บริหาร'}</span>
                  </div>
                  {project.directiveUpdatedAt && (
                    <span className="text-[10px] text-indigo-200/70">
                      {new Date(project.directiveUpdatedAt).toLocaleString('th-TH')}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white leading-relaxed pl-1">
                  "{project.executiveDirective}"
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSaveDirective} className="space-y-4">
          <textarea
            rows={4}
            value={directiveText}
            onChange={(e) => setDirectiveText(e.target.value)}
            placeholder={
              user?.role === 'DEAN'
                ? "พิมพ์ข้อสั่งการ แนวดำเนินการ หรือการอนุมัติเร่งรัดในระดับคณะ (คณบดี) ณ ที่นี้..."
                : user?.role === 'PRESIDENT'
                  ? "พิมพ์ข้อสั่งการ แนวนโยบายเร่งรัด หรือคำชี้แนะระดับสถาบัน (อธิการบดี) ณ ที่นี้..."
                  : "พิมพ์ข้อสั่งการ แนวดำเนินการ หรือการอนุมัติเร่งรัดของผู้บริหาร ณ ที่นี้..."
            }
            className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-xs font-semibold text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none"
          />

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-indigo-300/70">
              * เมื่อบันทึกสำเร็จ ข้อสั่งการจะถูกจัดเก็บลงในระบบพร้อมส่งการแจ้งเตือนทันที
            </div>

            <button
              type="submit"
              disabled={submittingDirective}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-slate-900 bg-white hover:bg-indigo-50 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <FiSend className="w-4 h-4 text-primary" />
              <span>{submittingDirective ? 'กำลังบันทึก...' : 'บันทึกและส่งข้อสั่งการ'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Read-Only Activity Timeline Table */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-primary shrink-0" />
              <span>ตารางขั้นตอนกิจกรรมย่อย (Read-Only Activity Timeline)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">รายละเอียดผลการดำเนินงานและงบประมาณของแต่ละขั้นตอนย่อย</p>
          </div>
        </div>

        {activities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4 w-14 text-center whitespace-nowrap">ลำดับ</th>
                  <th className="py-3 px-4">ชื่อขั้นตอนกิจกรรม</th>
                  <th className="py-3 px-4 w-32 text-center whitespace-nowrap">วันที่ดำเนินงาน</th>
                  <th className="py-3 px-4 w-32 text-right whitespace-nowrap">งบแผน</th>
                  <th className="py-3 px-4 w-32 text-right whitespace-nowrap">งบเบิกจริง</th>
                  <th className="py-3 px-4 w-36 text-center whitespace-nowrap">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act, idx) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-800 leading-snug">{act.name}</div>
                      {act.remark && (
                        <div className="text-[11px] text-purple-700 bg-purple-50 p-2 rounded-xl mt-1 font-medium border border-purple-100">
                          หมายเหตุ/อุปสรรค: {act.remark}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600 whitespace-nowrap">
                      {new Date(act.activityDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 whitespace-nowrap">
                      {parseFloat(act.budget || 0).toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                      {parseFloat(act.actualBudget || 0).toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full border whitespace-nowrap shadow-3xs ${
                        act.success 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${act.success ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span>{act.success ? 'เสร็จสมบูรณ์' : 'กำลังดำเนินการ'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FiClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-xs text-slate-500 font-bold">ยังไม่มีข้อมูลกิจกรรมย่อยในระบบ</div>
          </div>
        )}
      </div>
      </div>
      {/* ── End of Screen Interactive ProjectDetail UI ── */}

      {/* 📄 Official Project Detail A4 Printable Document */}
      <div className="official-print-document font-prompt text-slate-900 bg-white space-y-2.5 mt-0 pt-0">
        {/* Official Document Header */}
        <div className="border-b-2 border-slate-900 pb-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base tracking-wider shrink-0">
                BRU
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">มหาวิทยาลัยราชภัฏบุรีรัมย์</h1>
                <h2 className="text-[11px] font-bold text-slate-700">
                  รายงานสรุปผลการดำเนินงานโครงการยุทธศาสตร์ (Strategic Project Executive Summary)
                </h2>
                <div className="text-[9px] text-slate-500 font-medium">ระบบติดตามและประเมินผลเชิงยุทธศาสตร์มหาวิทยาลัย (BRU Strategic Tracking System)</div>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-700 space-y-0.5 font-medium border-l border-slate-300 pl-2.5">
              <div><span className="font-bold">รหัสโครงการ:</span> #{project.id}</div>
              <div><span className="font-bold">ปีงบประมาณ:</span> พ.ศ. {project.fiscalYear?.year || '-'}</div>
              <div><span className="font-bold">วันที่ออกเอกสาร:</span> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</div>
            </div>
          </div>
        </div>

        {/* Section 1: ข้อมูลโครงการและสังกัด (Project Profile) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            1. ข้อมูลทั่วไปและโครงสร้างโครงการ (Project Profile)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">ชื่อโครงการ</td>
                <td colSpan="3" className="font-bold text-slate-900 py-1 px-2">{project.name}</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">หน่วยงานสังกัด</td>
                <td className="font-medium text-slate-800 py-1 px-2">{project.faculty?.name?.startsWith('คณะ') ? project.faculty.name : `คณะ${project.faculty?.name || 'ส่วนกลาง'}`} ({project.department?.name || 'ไม่ระบุภาควิชา'})</td>
                <td className="bg-slate-50 font-bold py-1 px-2">ผู้รับผิดชอบหลัก</td>
                <td className="font-medium text-slate-800 py-1 px-2">{project.creator?.name || 'ไม่ระบุ'}</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">แหล่งงบประมาณ</td>
                <td className="font-medium text-slate-800 py-1 px-2">{project.budgetSource?.name || 'ไม่ระบุ'}</td>
                <td className="bg-slate-50 font-bold py-1 px-2">ประเด็นยุทธศาสตร์หลัก</td>
                <td className="font-medium text-slate-800 py-1 px-2">{project.subStrategy?.strategy?.name || 'ไม่ระบุ'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: ผลสัมฤทธิ์ตัวชี้วัดและการเบิกจ่ายงบประมาณ (KPI & Financial Health) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            2. สรุปผลสัมฤทธิ์ตัวชี้วัดและสถานะการเบิกจ่ายงบประมาณ (KPI & Financial Health)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">ความก้าวหน้าโครงการ</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{progressPct}% <span className="text-[9px] font-normal text-slate-500">({completedCount}/{targetCount} {project.unit || 'หน่วย'})</span></td>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">งบประมาณจัดสรร</td>
                <td className="w-1/4 font-black text-slate-900 text-sm py-1 px-2">{budgetNum.toLocaleString()} <span className="text-[10px] font-normal">บาท</span></td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">งบประมาณใช้จ่ายจริงสะสม</td>
                <td className="font-bold text-slate-900 py-1 px-2">{spentNum.toLocaleString()} บาท <span className="text-emerald-700 font-black">({burnRatePct}%)</span></td>
                <td className="bg-slate-50 font-bold py-1 px-2">งบประมาณคงเหลือ</td>
                <td className="font-bold text-slate-900 py-1 px-2">{Math.max(0, budgetNum - spentNum).toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">สถานะความเสี่ยง (RAG)</td>
                <td colSpan="3" className="font-bold text-[10px] py-1 px-2">
                  <span className={ragStatus === 'RED' ? 'text-rose-700' : ragStatus === 'YELLOW' ? 'text-amber-700' : 'text-emerald-700'}>
                    {ragStatus === 'RED' ? '🔴 RED FLAG - วิกฤตล่าช้ากว่าแผน' : ragStatus === 'YELLOW' ? '🟡 WARN - เฝ้าระวัง' : '🟢 GREEN - ปกติ/ตามแผน'}
                  </span>
                  {ragReason && <span className="text-slate-500 font-normal ml-2">({ragReason})</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: รายการกิจกรรมย่อยและผลสัมฤทธิ์ (Activity Timeline) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            3. รายละเอียดกิจกรรมย่อยและความก้าวหน้า (Activity Timeline & Outcomes)
          </h3>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="w-8 text-center py-1 px-1.5">ลำดับ</th>
                <th className="text-left py-1 px-2">ชื่อกิจกรรมย่อย</th>
                <th className="w-24 text-center py-1 px-1.5">วันที่ดำเนินงาน</th>
                <th className="w-24 text-right py-1 px-1.5">งบแผน (บาท)</th>
                <th className="w-24 text-right py-1 px-1.5">จ่ายจริง (บาท)</th>
                <th className="w-24 text-center py-1 px-1.5">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {activities && activities.length > 0 ? (
                activities.map((act, idx) => (
                  <tr key={act.id || idx}>
                    <td className="text-center font-bold py-1 px-1.5">{idx + 1}</td>
                    <td className="font-semibold text-slate-800 text-left py-1 px-2">
                      <div>{act.name}</div>
                      {act.remark && <div className="text-[8.5px] text-slate-500 font-normal">หมายเหตุ: {act.remark}</div>}
                    </td>
                    <td className="text-center font-medium py-1 px-1.5">{new Date(act.activityDate).toLocaleDateString('th-TH')}</td>
                    <td className="text-right font-medium py-1 px-1.5">{parseFloat(act.budget || 0).toLocaleString()}</td>
                    <td className="text-right font-medium text-emerald-700 py-1 px-1.5">{parseFloat(act.actualBudget || 0).toLocaleString()}</td>
                    <td className="text-center font-bold text-[9px] py-1 px-1.5">
                      {act.success ? <span className="text-emerald-700">🟢 เสร็จสมบูรณ์</span> : <span className="text-amber-700">🟡 ดำเนินการ</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-1.5 text-slate-400 italic">ไม่มีข้อมูลกิจกรรมย่อย</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: ข้อสั่งการผู้บริหาร (Executive Directives) */}
        <div className="space-y-1 print-section avoid-break">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
            4. ข้อสั่งการและการกำกับติดตามของผู้บริหาร (Executive Directives)
          </h3>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/4 bg-slate-50 font-bold py-1 px-2">ข้อสั่งการอธิการบดี</td>
                <td className="py-1 px-2 font-medium text-slate-800">{project.presidentDirective ? `"${project.presidentDirective}"` : <span className="text-slate-400 italic">- ไม่มีข้อสั่งการ -</span>}</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold py-1 px-2">ข้อสั่งการคณบดี</td>
                <td className="py-1 px-2 font-medium text-slate-800">{project.deanDirective ? `"${project.deanDirective}"` : <span className="text-slate-400 italic">- ไม่มีข้อสั่งการ -</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Document Clean Footer */}
        <div className="text-right text-[8px] text-slate-400 pt-1.5 border-t border-slate-200">
          เอกสารนี้สร้างขึ้นโดยระบบติดตามการทำงานโครงการยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategic Tracking System)
        </div>
      </div>
    </div>
  );
};

export default ExecutiveProjectDetail;
