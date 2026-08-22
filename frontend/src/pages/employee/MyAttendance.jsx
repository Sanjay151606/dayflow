import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, Search, Filter } from 'lucide-react';

export const MyAttendance = () => {
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const fetchAttendanceData = async () => {
    try {
      const [list, sum] = await Promise.all([
        attendanceService.getMyAttendance(),
        attendanceService.getMySummary({ month: filterMonth, year: filterYear })
      ]);
      setAttendance(list);
      setSummary(sum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [filterMonth, filterYear]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Punch Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Punch Station</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Status:{' '}
            <span className="font-semibold text-slate-700">
              {!isCheckedIn ? 'Not Clocked In' : isCheckedOut ? 'Finished for Today' : 'Currently Active'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Half Day</p>
          <h4 className="text-xl font-bold text-amber-700 mt-1">{summary?.half_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-sky-600 uppercase">Leaves</p>
          <h4 className="text-xl font-bold text-sky-700 mt-1">{summary?.leave_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold text-rose-600 uppercase">Absent</p>
          <h4 className="text-xl font-bold text-rose-700 mt-1">{summary?.absent_days ?? 0}</h4>
        </Card>
        <Card className="p-4 text-center bg-brand-50/60 border-brand-200/60">
          <p className="text-[11px] font-semibold text-brand-700 uppercase">Rate</p>
          <h4 className="text-xl font-extrabold text-brand-700 mt-1">{summary?.attendance_rate ?? 100}%</h4>
        </Card>
      </div>

      {/* Attendance History Table */}
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
    </div>
  );
};
