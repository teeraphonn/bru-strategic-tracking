import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiAlertCircle, FiSend, FiClock, FiCheckCircle, FiXCircle, FiList, FiPlusCircle, FiMessageSquare } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../services/api';
import CustomSelect from './CustomSelect';

const ReportIssueModal = ({ isOpen, onClose, initialTab = 'form' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'form' | 'history'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ทั่วไป');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [myIssues, setMyIssues] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchMyIssues();
    }
  }, [isOpen, activeTab]);

  // Handle ESC key press to close modal fast
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchMyIssues = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/issues/my');
      setMyIssues(response.data.data || []);
    } catch (error) {
      console.error('Error fetching my issues:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกหัวข้อและรายละเอียดปัญหาระบบ',
        confirmButtonColor: '#6C3BFF'
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/issues', {
        title: title.trim(),
        category,
        priority,
        description: description.trim()
      });

      Swal.fire({
        icon: 'success',
        title: 'ส่งรายงานสำเร็จ',
        text: 'ทีมงานผู้ดูแลระบบได้รับรายงานปัญหาของคุณเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false
      });

      // Reset form & view history
      setTitle('');
      setDescription('');
      setCategory('ทั่วไป');
      setPriority('MEDIUM');
      setActiveTab('history');
    } catch (error) {
      console.error('Error submitting issue:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.message || 'ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#6C3BFF'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <FiClock className="w-3 h-3" /> รอดำเนินการ
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
            <FiClock className="w-3 h-3 animate-spin" /> กำลังแก้ไข
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <FiCheckCircle className="w-3 h-3" /> แก้ไขแล้ว
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <FiXCircle className="w-3 h-3" /> ยกเลิก
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'URGENT':
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">เร่งด่วนที่สุด</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">ความสำคัญสูง</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">ปานกลาง</span>;
      default:
        return <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">ทั่วไป</span>;
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white text-slate-800 rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col my-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Soft & Professional Header ── */}
        <div className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-slate-50 p-5 sm:p-6 border-b border-slate-100 relative shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-all duration-150 cursor-pointer focus:outline-none border border-slate-200/80 shadow-2xs"
            title="ปิดหน้าต่าง (Esc)"
          >
            <FiX className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3 relative z-10 pr-8">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-primary shrink-0 shadow-2xs">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">แจ้งปัญหาระบบ / ข้อเสนอแนะ</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">รายงานปัญหาการใช้งานเพื่อการปรับปรุงและแก้ไขโดยเร็ว</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'form' 
                  ? 'bg-primary text-white shadow-sm shadow-primary/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              <FiPlusCircle className="w-3.5 h-3.5" /> แจ้งเรื่องใหม่
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-primary text-white shadow-sm shadow-primary/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              <FiList className="w-3.5 h-3.5" /> ประวัติการแจ้งเรื่อง ({myIssues.length})
            </button>
          </div>
        </div>

        {/* ── Content Body ── */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto min-h-0">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    หมวดหมู่ปัญหา <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={(val) => setCategory(val)}
                    placeholder="เลือกหมวดหมู่ปัญหา"
                    options={[
                      { value: 'ทั่วไป', label: 'ทั่วไป / สอบถาม' },
                      { value: 'UI/การแสดงผล', label: 'UI / การแสดงผลหน้าจอ' },
                      { value: 'ประสิทธิภาพ/ความเร็ว', label: 'ความช้า / ประสิทธิภาพระบบ' },
                      { value: 'ข้อมูลผิดพลาด', label: 'ข้อมูลไม่ถูกต้อง / ข้อผิดพลาด' },
                      { value: 'ข้อเสนอแนะ', label: 'ข้อเสนอแนะเพิ่มเติม' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    ระดับความเร่งด่วน <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={priority}
                    onChange={(val) => setPriority(val)}
                    placeholder="เลือกระดับความเร่งด่วน"
                    options={[
                      { value: 'LOW', label: 'ปกติ / ความสำคัญต่ำ' },
                      { value: 'MEDIUM', label: 'ปานกลาง' },
                      { value: 'HIGH', label: 'สูง / กระทบการทำงาน' },
                      { value: 'URGENT', label: 'เร่งด่วนที่สุด / ดำเนินการไม่ได้' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  หัวข้อเรื่อง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ปุ่มบันทึกไม่ทำงานในหน้าจัดการโครงการ"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  รายละเอียดปัญหา <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุรายละเอียด เช่น เมนูที่พบปัญหา, ลำดับขั้นตอนการกด, หรือข้อความที่ระบบแสดงขึ้นมา..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    'กำลังส่งข้อมูล...'
                  ) : (
                    <>
                      <FiSend className="w-3.5 h-3.5" /> ส่งรายงานปัญหา
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-xs font-bold text-slate-400">กำลังโหลดประวัติการแจ้งปัญหา...</p>
                </div>
              ) : myIssues.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <FiMessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">ยังไม่มีประวัติการแจ้งเรื่องในระบบ</p>
                </div>
              ) : (
                myIssues.map((issue) => (
                  <div 
                    key={issue.id} 
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-primary bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                            {issue.category || 'ทั่วไป'}
                          </span>
                          {getPriorityBadge(issue.priority)}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{issue.title}</h4>
                      </div>
                      <div className="shrink-0">{getStatusBadge(issue.status)}</div>
                    </div>

                    <p className="text-xs text-slate-600 font-normal leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                      {issue.description}
                    </p>

                    {issue.adminNote && (
                      <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200/80 text-xs">
                        <div className="font-bold text-sky-800 flex items-center gap-1.5 mb-0.5">
                          <FiMessageSquare className="w-3.5 h-3.5" /> การตอบกลับจากผู้ดูแลระบบ:
                        </div>
                        <div className="text-sky-900 font-normal">{issue.adminNote}</div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                      แจ้งเมื่อ: {new Date(issue.createdAt).toLocaleString('th-TH')}
                    </div>
                  </div>
                ))
              )}

              {/* Bottom Action Close button for History Tab */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportIssueModal;
