import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { attendanceService, wfhService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { AttendanceVisualCalendar } from '../../components/attendance/AttendanceVisualCalendar';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, Home, Plus } from 'lucide-react';

export const MyAttendance = () => {
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [wfhList, setWfhList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [wfhModalOpen, setWfhModalOpen] = useState(false);
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // WFH Form State
  const [wfhStartDate, setWfhStartDate] = useState('');
  const [wfhEndDate, setWfhEndDate] = useState('');
  const [wfhReason, setWfhReason] = useState('');
  const [submittingWfh, setSubmittingWfh] = useState(false);

  const fetchAttendanceData = async () => {
    try {
      const [list, sum, wfh] = await Promise.all([
        attendanceService.getMyAttendance(),
        attendanceService.getMySummary(),
        wfhService.getMyWFH()
      ]);
      setAttendance(list);
      setSummary(sum);
      setWfhList(wfh);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find((a) => a.date === todayStr);
  const isCheckedIn = todayRecord && todayRecord.check_in;
  const isCheckedOut = todayRecord && todayRecord.check_out;

  const handlePunchIn = async () => {
    setPunching(true);
    try {
      await attendanceService.checkIn('Daily Punch');
      addToast('Punch in successful!', 'success');
      fetchAttendanceData();
    } catch (e) {
      addToast(e.response?.data?.detail || 'Punch in failed', 'error');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setPunching(true);
    try {
      await attendanceService.checkOut('Daily Punch');
      addToast('Punch out successful!', 'success');
      fetchAttendanceData();
    } catch (e) {
      addToast(e.response?.data?.detail || 'Punch out failed', 'error');
    } finally {
      setPunching(false);
    }
  };

  const handleApplyWFH = async (e) => {
    e.preventDefault();
    setSubmittingWfh(true);
    try {
      await wfhService.applyWFH({
        start_date: wfhStartDate,
        end_date: wfhEndDate,
        reason: wfhReason
      });
      addToast('Work From Home request submitted!', 'success');
      setWfhModalOpen(false);
      setWfhReason('');
      fetchAttendanceData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'WFH request failed.', 'error');
    } finally {
      setSubmittingWfh(false);
    }
  };

  const handleSelectCalendarDate = (rec) => {
    setSelectedDayRecord(rec);
    setDetailModalOpen(true);
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
      {/* Punch Action Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Punch Station</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Today's Log:{' '}
            <span className="font-semibold text-slate-700">
              {!isCheckedIn ? 'Not Clocked In' : isCheckedOut ? 'Clocked Out for the day' : 'Active on duty'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" icon={Home} onClick={() => setWfhModalOpen(true)}>
            Request WFH
          </Button>

          {!isCheckedIn ? (
            <Button variant="primary" size="md" onClick={handlePunchIn} isLoading={punching} className="shadow-glow">
              Clock In Now
            </Button>
          ) : !isCheckedOut ? (
            <Button variant="danger" size="md" onClick={handlePunchOut} isLoading={punching}>
              Clock Out
            </Button>
          ) : (
            <Badge variant="success" size="md">
              Completed • {todayRecord?.working_hours} hours
            </Badge>
          )}
        </div>
      </div>

      {/* Monthly Statistics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Days</p>
          <h4 className="text-xl font-bold text-slate-800 mt-1">{summary?.total_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Present</p>
          <h4 className="text-xl font-bold text-emerald-700 mt-1">{summary?.present_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-purple-600 uppercase">WFH</p>
          <h4 className="text-xl font-bold text-purple-700 mt-1">
            {attendance.filter((a) => a.status === 'WORK_FROM_HOME').length}
          </h4>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-sky-600 uppercase">Leaves</p>
          <h4 className="text-xl font-bold text-sky-700 mt-1">{summary?.leave_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Half Day</p>
          <h4 className="text-xl font-bold text-amber-700 mt-1">{summary?.half_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center bg-brand-50/60 border-brand-200/60">
          <p className="text-[11px] font-semibold text-brand-700 uppercase">Rate</p>
          <h4 className="text-xl font-extrabold text-brand-700 mt-1">{summary?.attendance_rate ?? 100}%</h4>
        </Card>
      </div>

      {/* Visual Attendance Calendar */}
      <AttendanceVisualCalendar records={attendance} onSelectDate={handleSelectCalendarDate} />

      {/* Attendance Log History Table */}
      <Card title="Attendance Log History" subtitle="Detailed breakdown of check-in, check-out, and total working hours">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Working Hours</th>
                <th className="pb-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-semibold text-slate-800">{record.date}</td>
                  <td className="py-3.5">
                    <Badge
                      variant={
                        record.status === 'PRESENT'
                          ? 'success'
                          : record.status === 'HALF_DAY'
                          ? 'warning'
                          : record.status === 'LEAVE'
                          ? 'info'
                          : record.status === 'WORK_FROM_HOME'
                          ? 'brand'
                          : 'danger'
                      }
                    >
                      {record.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-slate-600">
                    {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    {record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 font-bold text-slate-800">{record.working_hours} hrs</td>
                  <td className="py-3.5 text-slate-500 italic">{record.remarks || '—'}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply WFH Modal */}
      <Modal isOpen={wfhModalOpen} onClose={() => setWfhModalOpen(false)} title="Request Work From Home (WFH)">
        <form onSubmit={handleApplyWFH} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={wfhStartDate}
                onChange={(e) => setWfhStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">End Date</label>
              <input
                type="date"
                required
                value={wfhEndDate}
                onChange={(e) => setWfhEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Reason for Remote Work</label>
            <textarea
              required
              rows={3}
              value={wfhReason}
              onChange={(e) => setWfhReason(e.target.value)}
              placeholder="Describe your remote work plan..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setWfhModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submittingWfh}>
              Submit WFH Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Day Details Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Attendance Day Details">
        {selectedDayRecord && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Date</span>
              <span className="font-bold text-slate-800">{selectedDayRecord.date}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Status</span>
              <Badge variant="brand">{selectedDayRecord.status}</Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Punch In</span>
              <span className="font-mono text-slate-800">{selectedDayRecord.check_in || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Punch Out</span>
              <span className="font-mono text-slate-800">{selectedDayRecord.check_out || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-semibold">Working Hours</span>
              <span className="font-extrabold text-brand-600 text-sm">{selectedDayRecord.working_hours} hrs</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
