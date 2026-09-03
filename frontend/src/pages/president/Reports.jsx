import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import {
  FiFileText,
  FiDownload
} from 'react-icons/fi';
import CustomSelect from '../../components/CustomSelect';
import { getProjectWarningState } from '../../utils/statusHelper';

const PresidentReports = () => {
  const [reportType, setReportType] = useState('project');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);

  const reportTypeOptions = [
    { value: 'project', label: 'รายงานติดตามผลการดำเนินโครงการ (Project Report)' },
    { value: 'faculty', label: 'รายงานความสำเร็จแบ่งรายคณะ (Faculty Report)' },
    { value: 'department', label: 'รายงานความสำเร็จแบ่งรายภาควิชา/หน่วยงาน (Department Report)' },
    { value: 'budget', label: 'รายงานเปรียบเทียบเบิกจ่ายงบประมาณ (Budget Report)' },
    { value: 'university', label: 'รายงานยุทธศาสตร์หลักมหาวิทยาลัย (University Report)' }
  ];

  const fiscalYearOptions = [
    { value: '', label: 'ทุกปีงบประมาณ' },
    ...fiscalYears.map(fy => ({
      value: fy.id,
      label: `ปี พ.ศ. ${fy.year} ${fy.active ? '(ปัจจุบัน)' : ''}`
    }))
  ];

  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { value: 'all', label: 'ทุกสถานะความเสี่ยง' },
    { value: 'normal', label: '🟢 ปกติ (Normal)' },
    { value: 'warn', label: '🟡 เฝ้าระวัง (Warn)' },
    { value: 'red', label: '🔴 วิกฤต (Red Flags)' }
  ];

  const getFilteredData = () => {
    if (!Array.isArray(reportData)) return [];
    if (statusFilter === 'all') return reportData;
    return reportData.filter(row => {
      if (!row) return false;
      // For project or budget type
      const budget = Number(row.totalBudget || 0);
      const spent = Number(row.actualSpent || 0);
      const target = Number(row.targetCount || 0);
      const completed = Number(row.completedCount || 0);
      const progress = Number(row.progress || 0);
      const endDate = row.endDate;

      const warn = getProjectWarningState(budget, spent, target, completed, progress, endDate);

      if (statusFilter === 'normal') {
        return warn === null;
      }
      if (statusFilter === 'warn') {
        return warn !== null && warn.level === 'WARN';
      }
      if (statusFilter === 'red') {
        return warn !== null && warn.level === 'RED';
      }
      return true;
    });
  };

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load fiscal years for dropdown filter
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/master/fiscal-years');
        setFiscalYears(response.data || []);
        const activeYear = (response.data || []).find(y => y.active);
        if (activeYear) setFiscalYearId(activeYear.id);
      } catch (err) {
        console.error('Failed to load years:', err);
      }
    };
    fetchYears();
  }, []);

  // Fetch report JSON data for live preview
  const generateReportPreview = async () => {
    setLoading(true);
    try {
      const params = {
        type: reportType,
        fiscalYearId: fiscalYearId || undefined,
        statusFilter: statusFilter || undefined
      };
      const response = await api.get('/reports', { params });
      setReportData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setReportData([]);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถประมวลผลสรุปรายงานได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fiscalYears.length > 0) {
      generateReportPreview();
    }
  }, [reportType, fiscalYearId, statusFilter, fiscalYears]);

  // Handle Export request (Blob file download)
  const handleExport = async (format) => {
    setExporting(true);
    try {
       const params = {
        type: reportType,
        fiscalYearId: fiscalYearId || undefined,
        statusFilter: statusFilter || undefined
      };

      const response = await api.get(`/reports/export/${format}`, {
        params,
        responseType: 'blob'
      });

      // Create local file URL and trigger browser download
      const mimeType = format === 'pdf'
        ? 'application/pdf'
        : format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let ext = format === 'pdf' ? 'pdf' : (format === 'excel' ? 'xlsx' : 'csv');
      const selectedYear = fiscalYears.find(y => String(y.id) === String(fiscalYearId));
      const yearLabel = selectedYear ? `ปีงบประมาณ_${selectedYear.year}` : 'ทุกปีงบประมาณ';
      const getReportNameTh = (type) => {
        switch (type) {
          case 'project': return 'รายงานความสำเร็จโครงการยุทธศาสตร์';
          case 'faculty': return 'รายงานสรุปผลงานภาพรวมคณะ';
          case 'department': return 'รายงานสรุปผลงานจำแนกภาควิชา';
          case 'budget': return 'รายงานสถานะเบิกจ่ายและงบประมาณคงเหลือ';
          case 'university': return 'รายงานสรุปผลงานภาพรวมยุทธศาสตร์มหาวิทยาลัย';
          default: return 'รายงานสรุป';
        }
      };
      const reportName = getReportNameTh(reportType);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${reportName}_${yearLabel}_${dateStr}.${ext}`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'ดาวน์โหลดล้มเหลว', text: 'เกิดข้อผิดพลาดในการสร้างไฟล์รายงาน' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-3xl shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-purple-200 border border-white/10 flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5 text-purple-300" />
                <span>การออกรายงานระดับผู้บริหาร</span>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">ระบบรายงานสรุปผลงานความสำเร็จ (อธิการบดี)</h1>
            <p className="text-xs md:text-sm text-purple-200/80 mt-1 font-medium max-w-2xl">
              ประมวลรายงานความก้าวหน้าโครงการ ความสำเร็จของยุทธศาสตร์การพัฒนาคณะ และการใช้จ่ายงบประมาณภาพรวมมหาวิทยาลัย
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter and Compile Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-6 bg-white rounded-3xl shadow-soft border border-slate-100">
        {/* Report Type */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">เลือกหมวดหมู่รายงาน</label>
          <CustomSelect
            value={reportType}
            onChange={(val) => {
              setReportData([]);
              setReportType(val);
            }}
            options={reportTypeOptions}
          />
        </div>

        {/* Fiscal Year Filter */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ปีงบประมาณ</label>
          <CustomSelect
            value={fiscalYearId}
            onChange={(val) => setFiscalYearId(val)}
            options={fiscalYearOptions}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
            {reportType !== 'project' && reportType !== 'budget' ? 'สถานะความเสี่ยง (ใช้เฉพาะโครงการ)' : 'สถานะความเสี่ยงโครงการ'}
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={statusOptions}
          />
        </div>

        {/* Export Triggers */}
        <div className="flex flex-col justify-end items-start">
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">ส่งออกไฟล์รายงาน</label>
          <button
            onClick={() => handleExport('pdf')}
            disabled={loading || exporting || getFilteredData().length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-700 hover:to-red-800 rounded-2xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 active:scale-95 cursor-pointer w-full"
            title="พิมพ์และดาวน์โหลดรายงานสรุปเป็นเอกสาร PDF"
          >
            <FiDownload className="w-4 h-4" />
            <span>พิมพ์รายงาน PDF</span>
          </button>
        </div>
      </div>

      {/* 3. Live Preview Content Table */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden space-y-2">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <FiFileText className="text-primary w-4 h-4" />
            <span>ตัวอย่างสรุปผลงานความสำเร็จ (Preview Compiled Report)</span>
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 px-3 py-1 bg-slate-100 rounded-full">
            แสดงผล {getFilteredData().length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : getFilteredData().length > 0 ? (
            <table className="w-full text-xs text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                  {reportType === 'project' && (
                    <>
                      <th className="px-6 py-3.5 text-center w-16">ID</th>
                      <th className="px-6 py-3.5">ชื่อโครงการ</th>
                      <th className="px-6 py-3.5">สังกัดหน่วยงาน</th>
                      <th className="px-6 py-3.5 text-center">ปีงบประมาณ</th>
                      <th className="px-6 py-3.5 text-right">งบประมาณรวม</th>
                      <th className="px-6 py-3.5 text-center">ทำแล้ว</th>
                      <th className="px-6 py-3.5 text-center">เป้าหมายรวม</th>
                      <th className="px-6 py-3.5 text-right">ความคืบหน้า (%)</th>
                    </>
                  )}

                  {reportType === 'faculty' && (
                    <>
                      <th className="px-6 py-3.5 text-center w-16">ID</th>
                      <th className="px-6 py-3.5">คณะ</th>
                      <th className="px-6 py-3.5 text-center">จำนวนโครงการ</th>
                      <th className="px-6 py-3.5 text-right">งบแผนงานสะสม</th>
                      <th className="px-6 py-3.5 text-right">ใช้จ่ายจริง</th>
                      <th className="px-6 py-3.5 text-right">ความสำเร็จเฉลี่ย (%)</th>
                    </>
                  )}

                  {reportType === 'department' && (
                    <>
                      <th className="px-6 py-3.5 text-center w-16">ID</th>
                      <th className="px-6 py-3.5">ภาควิชา/หน่วยงาน</th>
                      <th className="px-6 py-3.5">คณะต้นสังกัด</th>
                      <th className="px-6 py-3.5 text-center">จำนวนโครงการ</th>
                      <th className="px-6 py-3.5 text-right">งบแผนงานสะสม</th>
                      <th className="px-6 py-3.5 text-right">ใช้จ่ายจริง</th>
                      <th className="px-6 py-3.5 text-right">ความสำเร็จเฉลี่ย (%)</th>
                    </>
                  )}

                  {reportType === 'budget' && (
                    <>
                      <th className="px-6 py-3.5 text-center w-16">ID</th>
                      <th className="px-6 py-3.5">ชื่อโครงการ</th>
                      <th className="px-6 py-3.5">หน่วยงาน</th>
                      <th className="px-6 py-3.5 text-right">งบตั้งต้นโครงการ</th>
                      <th className="px-6 py-3.5 text-right">จ่ายเงินจริงแล้ว</th>
                      <th className="px-6 py-3.5 text-right">งบประมาณคงเหลือ</th>
                      <th className="px-6 py-3.5 text-right">สัดส่วนใช้จ่าย (%)</th>
                    </>
                  )}

                  {reportType === 'university' && (
                    <>
                      <th className="px-6 py-3.5 text-center">รหัสยุทธศาสตร์</th>
                      <th className="px-6 py-3.5">ประเด็นยุทธศาสตร์หลัก</th>
                      <th className="px-6 py-3.5 text-center">จำนวนโครงการ</th>
                      <th className="px-6 py-3.5 text-right">งบตามแผน</th>
                      <th className="px-6 py-3.5 text-right">จ่ายจริงแล้ว</th>
                      <th className="px-6 py-3.5 text-right">สำเร็จเฉลี่ย (%)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {getFilteredData().map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    {reportType === 'project' && (
                      <>
                        <td className="px-6 py-3.5 text-center font-extrabold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-3.5 font-extrabold text-slate-800 max-w-[240px]">
                          <div className="truncate">{row.name}</div>
                          {(() => {
                            const warn = getProjectWarningState(row.totalBudget, row.actualSpent, row.targetCount, row.completedCount, row.progress, row.endDate);
                            if (warn) {
                              return (
                                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] px-2 py-0.5 rounded-full border ${warn.color}`}>
                                  ⚠️ {warn.label}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 font-bold">{row.department}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-600">{row.fiscalYear}</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-slate-800">{((row.totalBudget !== undefined && row.totalBudget !== null) ? row.totalBudget : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-center font-extrabold text-emerald-600">{row.completedCount}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-600">{row.targetCount} {row.unit}</td>
                        <td className="px-6 py-3.5 text-right font-black text-primary">{row.progress}%</td>
                      </>
                    )}

                    {reportType === 'faculty' && (
                      <>
                        <td className="px-6 py-3.5 text-center font-extrabold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-3.5 font-extrabold text-slate-800">{row.name}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-600">{row.projectsCount} โครงการ</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-slate-800">{((row.totalBudget !== undefined && row.totalBudget !== null) ? row.totalBudget : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-emerald-600">{((row.actualSpent !== undefined && row.actualSpent !== null) ? row.actualSpent : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-primary">{row.avgProgress}%</td>
                      </>
                    )}

                    {reportType === 'department' && (
                      <>
                        <td className="px-6 py-3.5 text-center font-extrabold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-3.5 font-extrabold text-slate-800">{row.name}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-bold">{row.faculty}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-600">{row.projectsCount} โครงการ</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-slate-800">{((row.totalBudget !== undefined && row.totalBudget !== null) ? row.totalBudget : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-emerald-600">{((row.actualSpent !== undefined && row.actualSpent !== null) ? row.actualSpent : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-primary">{row.avgProgress}%</td>
                      </>
                    )}

                    {reportType === 'budget' && (
                      <>
                        <td className="px-6 py-3.5 text-center font-extrabold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-3.5 font-extrabold text-slate-800 truncate max-w-[240px]">{row.projectName}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-bold">{row.department}</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-slate-800">{((row.totalBudget !== undefined && row.totalBudget !== null) ? row.totalBudget : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-emerald-600">{((row.actualSpent !== undefined && row.actualSpent !== null) ? row.actualSpent : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-500">{((row.remainingBudget !== undefined && row.remainingBudget !== null) ? row.remainingBudget : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-primary">{row.usagePercentage}%</td>
                      </>
                    )}

                    {reportType === 'university' && (
                      <>
                        <td className="px-6 py-3.5 text-center font-black text-purple-700">{row.code}</td>
                        <td className="px-6 py-3.5 font-extrabold text-slate-800 truncate max-w-[300px]">{row.name}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-600">{row.projectsCount} โครงการ</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-slate-800">{((row.totalBudget !== undefined && row.totalBudget !== null) ? row.totalBudget : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-emerald-600">{((row.actualSpent !== undefined && row.actualSpent !== null) ? row.actualSpent : 0).toLocaleString()} ฿</td>
                        <td className="px-6 py-3.5 text-right font-black text-primary">{row.avgProgress}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-xs font-bold text-slate-400">
              ไม่มีข้อมูลสำหรับประมวลผลรายงานในช่วงปีงบประมาณที่เลือก
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresidentReports;
