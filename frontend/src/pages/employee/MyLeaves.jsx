import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { leaveService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { CalendarDays, Plus, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';

export const MyLeaves = () => {
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('PAID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeavesData = async () => {
    try {
      const [list, sum] = await Promise.all([
        leaveService.getMyLeaves(),
        leaveService.getMySummary()
      ]);
      setLeaves(list);
      setSummary(sum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeavesData();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      addToast('End date cannot be earlier than start date.', 'warning');
      return;
    }
    setApplying(true);
    try {
      await leaveService.applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      });
      addToast('Leave application submitted successfully!', 'success');
      setModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      fetchLeavesData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to submit leave request.', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Balances */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Off Hub</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">Leave Management & Balances</h2>
          <p className="text-xs text-slate-500 mt-1">Apply for paid, sick, or personal time off.</p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)} className="shadow-glow">
          Apply For Leave
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-brand-600 uppercase">Paid Leave Available</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.paid_leave_balance ?? 15} Days</h3>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-sky-600 uppercase">Sick Leave Available</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.sick_leave_balance ?? 10} Days</h3>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-amber-600 uppercase">Pending Review</p>
          <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{summary?.pending ?? 0}</h3>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Approved Leaves</p>
          <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{summary?.approved ?? 0}</h3>
        </Card>
      </div>

      {/* Leave Application History */}
      <Card title="Leave Request History" subtitle="Track all your submitted leave requests and approval comments">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Type</th>
                <th className="pb-3">Date Range</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">HR Comments</th>
                <th className="pb-3">Applied On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold text-slate-800">{leave.leave_type}</td>
                  <td className="py-3.5 font-semibold text-slate-700">
                    {leave.start_date} → {leave.end_date}
                  </td>
                  <td className="py-3.5 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                  <td className="py-3.5">
                    <Badge
                      variant={
                        leave.status === 'APPROVED'
                          ? 'success'
                          : leave.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {leave.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-slate-500 italic">{leave.approval_comment || '—'}</td>
                  <td className="py-3.5 text-slate-400">
                    {new Date(leave.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply Leave Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply For Time Off">
        <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="PAID">Paid Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details regarding your leave request..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={applying}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
