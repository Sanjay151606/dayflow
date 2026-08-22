import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { CalendarCheck, Search, Filter, Edit2, Download } from 'lucide-react';

export const AttendanceManager = () => {
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getAllAttendance({
        target_date: targetDate || undefined,
        department: department || undefined
      });
      setAttendance(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [targetDate, department]);

  const handleOpenEdit = (rec) => {
    setSelectedRecord(rec);
    setEditModalOpen(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      await attendanceService.updateAttendance(selectedRecord.id, {
        status: selectedRecord.status,
        working_hours: parseFloat(selectedRecord.working_hours),
        remarks: selectedRecord.remarks
      });
      addToast('Attendance record updated!', 'success');
      setEditModalOpen(false);
      fetchAttendance();
    } catch (err) {
      addToast('Failed to update attendance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Attendance Hub</h2>
          <p className="text-xs text-slate-500 mt-1">Audit daily punches, rectify anomalies, and monitor workforce turnout.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product Design">Product Design</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>

        <Button size="sm" variant="secondary" onClick={() => { setTargetDate(''); setDepartment(''); }}>
          Reset Filters
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Employee ID</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Punch In</th>
                <th className="pb-3">Punch Out</th>
                <th className="pb-3">Hours</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Remarks</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold text-slate-800">EMP #{rec.employee_id}</td>
                  <td className="py-3.5 text-slate-700">{rec.date}</td>
                  <td className="py-3.5 text-slate-600">
                    {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    {rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 font-extrabold text-slate-900">{rec.working_hours} hrs</td>
                  <td className="py-3.5">
                    <Badge
                      variant={
                        rec.status === 'PRESENT'
                          ? 'success'
                          : rec.status === 'HALF_DAY'
                          ? 'warning'
                          : rec.status === 'LEAVE'
                          ? 'info'
                          : 'danger'
                      }
                    >
                      {rec.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-slate-500 italic max-w-xs truncate">{rec.remarks || '—'}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No attendance records found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Record Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Rectify Attendance Record">
        {selectedRecord && (
          <form onSubmit={handleUpdateRecord} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={selectedRecord.status}
                onChange={(e) => setSelectedRecord({ ...selectedRecord, status: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="HALF_DAY">HALF DAY</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LEAVE">LEAVE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Working Hours</label>
              <input
                type="number"
                step="0.1"
                value={selectedRecord.working_hours}
                onChange={(e) => setSelectedRecord({ ...selectedRecord, working_hours: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Remarks / Note</label>
              <input
                type="text"
                value={selectedRecord.remarks || ''}
                onChange={(e) => setSelectedRecord({ ...selectedRecord, remarks: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
