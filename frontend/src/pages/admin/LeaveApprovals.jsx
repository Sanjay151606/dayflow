import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { leaveService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { CalendarDays, Check, X, MessageSquare } from 'lucide-react';

export const LeaveApprovals = () => {
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('APPROVE');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await leaveService.getAllLeaves({
        status_filter: statusFilter || undefined
      });
      setLeaves(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleOpenAction = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setComment(type === 'APPROVE' ? 'Approved by HR' : 'Reason for rejection...');
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    setSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        await leaveService.approveLeave(selectedLeave.id, comment);
        addToast('Leave request approved! Attendance updated.', 'success');
      } else {
        await leaveService.rejectLeave(selectedLeave.id, comment);
        addToast('Leave request rejected.', 'info');
      }
      setActionModalOpen(false);
      fetchLeaves();
    } catch (err) {
      addToast('Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave Approvals & Workflows</h2>
          <p className="text-xs text-slate-500 mt-1">Review employee time-off requests, append HR feedback, and sync attendance.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            statusFilter === '' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Requests ({leaves.length})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            statusFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Leave Type</th>
                <th className="pb-3">Dates</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">HR Feedback</th>
                <th className="pb-3 text-right">Decide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5">
                    <p className="font-bold text-slate-900">{l.employee_name || 'Staff Member'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{l.employee_code} • {l.department}</p>
                  </td>
                  <td className="py-3.5 font-semibold text-slate-800">{l.leave_type}</td>
                  <td className="py-3.5 text-slate-700">
                    {l.start_date} → {l.end_date}
                  </td>
                  <td className="py-3.5 text-slate-600 max-w-xs truncate">{l.reason}</td>
                  <td className="py-3.5">
                    <Badge
                      variant={
                        l.status === 'APPROVED'
                          ? 'success'
                          : l.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {l.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-slate-500 italic max-w-xs truncate">{l.approval_comment || '—'}</td>
                  <td className="py-3.5 text-right">
                    {l.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleOpenAction(l, 'APPROVE')}
                          icon={Check}
                          className="py-1 px-2 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleOpenAction(l, 'REJECT')}
                          icon={X}
                          className="py-1 px-2 text-xs"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Decision Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
      >
        {selectedLeave && (
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-800">{selectedLeave.employee_name} ({selectedLeave.leave_type})</p>
              <p className="text-slate-500 mt-0.5">{selectedLeave.start_date} to {selectedLeave.end_date}</p>
              <p className="text-slate-600 italic mt-1">"{selectedLeave.reason}"</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                {actionType === 'APPROVE' ? 'Approval Note' : 'Rejection Reason'}
              </label>
              <textarea
                rows={3}
                required={actionType === 'REJECT'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setActionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={actionType === 'APPROVE' ? 'success' : 'danger'}
                size="sm"
                isLoading={submitting}
              >
                Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
