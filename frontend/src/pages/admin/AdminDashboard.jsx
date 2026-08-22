import React, { useState, useEffect } from 'react';
import { reportService, aiService, wfhService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Home,
  Check,
  X,
  Download,
  TrendingDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#0c82ea', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [m, a, w] = await Promise.all([
        reportService.getDashboardMetrics(),
        aiService.getAnomalies(),
        wfhService.getAllWFH({ status_filter: 'PENDING' })
      ]);
      setMetrics(m);
      setAnomalies(a);
      setWfhRequests(w);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApproveWFH = async (id) => {
    try {
      await wfhService.approveWFH(id, 'Approved by Management');
      fetchDashboard();
    } catch (e) {
      console.error(e);
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Operations Command</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Live Intel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Live metrics across attendance, leaves, headcount, and payroll.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={reportService.getExportUrl('employees')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Employees
          </a>
          <a
            href={reportService.getExportUrl('attendance')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition shadow-glow"
          >
            <Download className="w-3.5 h-3.5" /> Export Attendance
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Workforce</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{metrics?.total_employees}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Present Today</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{metrics?.present_today}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Leaves</p>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-slate-900">{metrics?.pending_leaves}</h3>
              {metrics?.pending_leaves > 0 && (
                <Link to="/admin/leaves">
                  <Badge variant="warning" size="sm">Review</Badge>
                </Link>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Disbursed Payroll</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              ${metrics?.total_payroll_month?.toLocaleString() || '0'}
            </h3>
          </div>
        </Card>
      </div>

      {/* AI Attendance Anomaly Radar & Insights */}
      {anomalies.length > 0 && (
        <Card
          title="AI Attendance Anomaly Radar"
          subtitle="Smart pattern recognition detecting unusual absences and frequent tardiness"
          className="border-amber-200/80 bg-amber-50/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {anomalies.map((anom, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-amber-100 shadow-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{anom.employee_name}</span>
                    <Badge variant="warning" size="sm">{anom.type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{anom.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* WFH Pending Quick Approvals */}
      {wfhRequests.length > 0 && (
        <Card title="Pending Work From Home (WFH) Requests" subtitle="Remote work requests awaiting manager confirmation">
          <div className="space-y-2.5">
            {wfhRequests.map((wfh) => (
              <div key={wfh.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900">{wfh.employee_name} ({wfh.department})</p>
                  <p className="text-[11px] text-slate-500">{wfh.start_date} to {wfh.end_date} • "{wfh.reason}"</p>
                </div>
                <Button size="sm" variant="success" icon={Check} onClick={() => handleApproveWFH(wfh.id)}>
                  Approve WFH
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly Attendance Distribution" subtitle="Past 7 days turnout (Present, Absent, Leave)">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.weekly_attendance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="present" fill="#0c82ea" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="leave" fill="#f59e0b" radius={[4, 4, 0, 0]} name="On Leave" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Department Headcount Distribution" subtitle="Staff allocation across company business units">
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.department_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="department"
                >
                  {(metrics?.department_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
