import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle, 
  FiSearch, FiFilter, FiTrash2, FiEdit3, FiUser, 
  FiMessageSquare, FiRefreshCw, FiChevronRight, FiCheck
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';

const AdminIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Selected issue for status update modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get('/issues', { params });
      setIssues(response.data.data || []);
    } catch (error) {
      console.error('Error fetching admin issues:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลรายงานปัญหาระบบได้',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateModal = (issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setAdminNote(issue.adminNote || '');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      setUpdating(true);
      await api.patch(`/issues/${selectedIssue.id}`, {
        status: newStatus,
        adminNote: adminNote.trim()
      });

      Swal.fire({
        icon: 'success',
        title: 'อัปเดตเรียบร้อย',
        text: 'อัปเดตสถานะและคำตอบกลับปัญหาระบบแล้ว',
        timer: 1500,
        showConfirmButton: false
      });

      setSelectedIssue(null);
      fetchIssues();
    } catch (error) {
      console.error('Error updating issue:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteIssue = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบเรื่องนี้?',
      text: 'ข้อมูลการรายงานปัญหานี้จะถูกลบถาวร',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบข้อมูล',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/issues/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ',
          timer: 1500,
          showConfirmButton: false
        });
        fetchIssues();
      } catch (error) {
        console.error('Error deleting issue:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถลบรายการนี้ได้',
          confirmButtonColor: '#4f46e5'
        });
      }
    }
  };

  // Filtered issues by search term
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const totalCount = issues.length;
  const pendingCount = issues.filter(i => i.status === 'PENDING').length;
  const inProgressCount = issues.filter(i => i.status === 'IN_PROGRESS').length;
  const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length;
  const rejectedCount = issues.filter(i => i.status === 'REJECTED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">รอดำเนินการ</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">กำลังแก้ไข</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">แก้ไขเรียบร้อย</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">ยกเลิก/ปฏิเสธ</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'URGENT':
        return <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">เร่งด่วนที่สุด</span>;
      case 'HIGH':
        return <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">ความสำคัญสูง</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">ปานกลาง</span>;
      default:
        return <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">ทั่วไป</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-extrabold uppercase tracking-wider mb-2">
              <FiAlertTriangle className="w-3.5 h-3.5" /> Admin System Issue Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">จัดการการรายงานปัญหาระบบ</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              ติดตามเรื่องร้องเรียน ตรวจสอบบั๊ก และอัปเดตสถานะการดำเนินการแก่ผู้ใช้งานในระบบ
            </p>
          </div>
          <button
            onClick={fetchIssues}
            className="self-start sm:self-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <FiClock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{pendingCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">รอดำเนินการ</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <FiRefreshCw className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{inProgressCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">กำลังแก้ไข</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <FiCheckCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{resolvedCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">แก้ไขเรียบร้อย</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <FiXCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{rejectedCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">ยกเลิก/ปฏิเสธ</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, รายละเอียด, หรือผู้รายงาน..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="ทุกสถานะ"
            className="w-40"
            options={[
              { value: '', label: 'ทุกสถานะ' },
              { value: 'PENDING', label: 'รอดำเนินการ', badge: 'PENDING' },
              { value: 'IN_PROGRESS', label: 'กำลังแก้ไข', badge: 'PROGRESS' },
              { value: 'RESOLVED', label: 'แก้ไขเรียบร้อย', badge: 'DONE' },
              { value: 'REJECTED', label: 'ยกเลิก/ปฏิเสธ', badge: 'REJECT' }
            ]}
          />

          <CustomSelect
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            placeholder="ทุกระดับความเร่งด่วน"
            className="w-44"
            options={[
              { value: '', label: 'ทุกระดับความเร่งด่วน' },
              { value: 'URGENT', label: 'เร่งด่วนที่สุด', badge: 'URGENT' },
              { value: 'HIGH', label: 'ความสำคัญสูง', badge: 'HIGH' },
              { value: 'MEDIUM', label: 'ความสำคัญปานกลาง', badge: 'MED' },
              { value: 'LOW', label: 'ทั่วไป', badge: 'LOW' }
            ]}
          />
        </div>
      </div>

      {/* Issues Table List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
            <p className="text-xs font-bold text-slate-400">กำลังโหลดรายการปัญหาระบบ...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 text-center">
            <FiMessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">ไม่พบรายการแจ้งปัญหาระบบ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      #{issue.id}
                    </span>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                      {issue.category || 'ทั่วไป'}
                    </span>
                    {getPriorityBadge(issue.priority)}
                    {getStatusBadge(issue.status)}
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold">
                    แจ้งเมื่อ: {new Date(issue.createdAt).toLocaleString('th-TH')}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-800">{issue.title}</h3>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed mt-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {issue.description}
                  </p>
                </div>

                {/* User & Admin Note section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-xs shrink-0">
                      {issue.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span>{issue.user?.name}</span>
                      <span className="text-slate-400 font-medium text-[11px] ml-1">
                        ({issue.user?.department?.faculty?.name || 'ส่วนกลาง'} / {issue.user?.department?.name || '-'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenUpdateModal(issue)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" /> อัปเดตสถานะ / ตอบกลับ
                    </button>
                    <button
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="ลบ"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {issue.adminNote && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs">
                    <div className="font-extrabold text-blue-800 flex items-center gap-1.5 mb-1">
                      <FiMessageSquare className="w-3.5 h-3.5" /> ข้อความตอบกลับผู้ใช้งาน:
                    </div>
                    <div className="text-blue-950 font-medium">{issue.adminNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Update Dialog Modal */}
      {selectedIssue && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 animate-fadeIn" onClick={() => setSelectedIssue(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-black/30 border border-black/15 overflow-hidden transform transition-all duration-300 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">อัปเดตสถานะ & ตอบกลับปัญหา #{selectedIssue.id}</h3>
                <p className="text-xs text-slate-400 font-medium truncate max-w-xs">{selectedIssue.title}</p>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  เปลี่ยนสถานะการดำเนินการ
                </label>
                <CustomSelect
                  value={newStatus}
                  onChange={(val) => setNewStatus(val)}
                  placeholder="เลือกสถานะ..."
                  options={[
                    { value: 'PENDING', label: 'รอดำเนินการ (PENDING)', badge: 'PENDING' },
                    { value: 'IN_PROGRESS', label: 'กำลังแก้ไข (IN_PROGRESS)', badge: 'PROGRESS' },
                    { value: 'RESOLVED', label: 'แก้ไขเรียบร้อยแล้ว (RESOLVED)', badge: 'DONE' },
                    { value: 'REJECTED', label: 'ยกเลิก / ไม่ดำเนินการ (REJECTED)', badge: 'REJECT' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  ข้อความตอบกลับผู้ใช้งาน (Admin Note)
                </label>
                <textarea
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="เขียนข้อความชี้แจง วิธีการแก้ไขปัญหา หรือสถานะการดำเนินการเพื่อให้ผู้รายงานทราบ..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating ? 'กำลังบันทึก...' : <><FiCheck className="w-4 h-4" /> บันทึกการอัปเดต</>}
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

export default AdminIssues;
