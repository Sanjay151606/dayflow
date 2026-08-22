import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceService, leaveService, payrollService, employeeService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import {
  Clock,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentPayroll, setRecentPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [profData, attData, leaveSum, leaves, payrolls] = await Promise.all([
        employeeService.getMyProfile(),
        attendanceService.getMyAttendance(),
        leaveService.getMySummary(),
        leaveService.getMyLeaves(),
        payrollService.getMyPayroll()
      ]);
      setProfile(profData);
      setAttendanceList(attData);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = attData.find((a) => a.date === todayStr);
      setTodayAttendance(todayRecord);

      setLeaveSummary(leaveSum);
      setRecentLeaves(leaves.slice(0, 3));
      setRecentPayroll(payrolls[0] || null);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setPunching(true);
    try {
      await attendanceService.checkIn('Web Punch-in');
      addToast('Checked in successfully! Have a productive day.', 'success');
      loadDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Punch in failed', 'error');
    } finally {
      setPunching(false);
    }
  };

  const handleCheckOut = async () => {
    setPunching(true);
    try {
      await attendanceService.checkOut('Web Punch-out');
      addToast('Checked out successfully. Enjoy your evening!', 'success');
      loadDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Punch out failed', 'error');
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

  const isCheckedIn = todayAttendance && todayAttendance.check_in;
  const isCheckedOut = todayAttendance && todayAttendance.check_out;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 text-white p-6 sm:p-8 shadow-soft">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white/90">
              {profile?.department || 'DAYFLOW Member'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              Good day, {profile?.first_name || user?.employee_id}! 👋
            </h2>
            <p className="text-sm text-sky-100 mt-1 max-w-xl">
              “Every workday, perfectly aligned.” You are logged in as {profile?.designation || 'Team Member'}.
            </p>
          </div>

          {/* Punch Clock Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4">
            <div>
              <p className="text-xs text-sky-200 uppercase font-semibold">Today's Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn && !isCheckedOut ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-sm font-bold">
                  {!isCheckedIn ? 'Not Clocked In' : isCheckedOut ? 'Clocked Out' : 'Active On Duty'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {!isCheckedIn ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCheckIn}
                  isLoading={punching}
                  className="bg-white text-brand-700 hover:bg-sky-50 shadow-md font-bold"
                >
                  Punch In
                </Button>
              ) : !isCheckedOut ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCheckOut}
                  isLoading={punching}
                  className="bg-rose-500 hover:bg-rose-600 font-bold"
                >
                  Punch Out
                </Button>
              ) : (
                <Badge variant="success">Completed ({todayAttendance?.working_hours}h)</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Hours Today</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">
              {todayAttendance?.working_hours ? `${todayAttendance.working_hours} hrs` : '0.0 hrs'}
            </h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Paid Leave Balance</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">
              {leaveSummary?.paid_leave_balance ?? 15} Days
            </h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Sick Leave Balance</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">
              {leaveSummary?.sick_leave_balance ?? 10} Days
            </h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Latest Net Salary</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">
              {recentPayroll ? `$${recentPayroll.net_salary.toLocaleString()}` : '$0.00'}
            </h4>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Activity & Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attendance History */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Recent Attendance Activity"
            subtitle="Past check-in records and logged hours"
            action={
              <Link to="/employee/attendance" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
                View Full Log <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Punch In</th>
                    <th className="pb-3">Punch Out</th>
                    <th className="pb-3 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceList.slice(0, 5).map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-semibold text-slate-800">{att.date}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            att.status === 'PRESENT'
                              ? 'success'
                              : att.status === 'HALF_DAY'
                              ? 'warning'
                              : att.status === 'LEAVE'
                              ? 'info'
                              : 'danger'
                          }
                        >
                          {att.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-600">
                        {att.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 text-slate-600">
                        {att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-800">{att.working_hours} hrs</td>
                    </tr>
                  ))}
                  {attendanceList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">No attendance logs yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Recent Leave Applications & Quick Links */}
        <div className="space-y-6">
          <Card
            title="Recent Leave Requests"
            subtitle="Status of your applied time off"
            action={
              <Link to="/employee/leaves" className="text-xs font-bold text-brand-600 hover:underline">
                Apply Leave
              </Link>
            }
          >
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{leave.leave_type} LEAVE</span>
                    <Badge
                      variant={
                        leave.status === 'APPROVED'
                          ? 'success'
                          : leave.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {leave.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {leave.start_date} to {leave.end_date}
                  </p>
                  <p className="text-[11px] text-slate-600 italic">"{leave.reason}"</p>
                </div>
              ))}
              {recentLeaves.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No recent leave requests.</p>
              )}
            </div>
          </Card>

          {/* Quick Support Card */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" /> Need Assistance?
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Contact HR or update your documents in the Documents vault whenever required.
            </p>
            <Link to="/employee/documents" className="mt-3 inline-block">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">
                Open Documents Vault
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
