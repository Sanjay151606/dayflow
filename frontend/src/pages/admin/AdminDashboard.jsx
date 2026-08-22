import React, { useState, useEffect } from 'react';
import { reportService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  UserCheck,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download
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
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const data = await reportService.getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Operations Command</h2>
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
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Employees</p>
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
            <p className="text-xs font-semibold text-slate-500 uppercase">Month Payroll</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              ${metrics?.total_payroll_month?.toLocaleString() || '0'}
            </h3>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
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

        {/* Department Headcount Share */}
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

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/employees"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:border-brand-500 transition group flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition">Manage Employees</h4>
            <p className="text-xs text-slate-500 mt-0.5">Onboard, modify roles, and oversee staff</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition" />
        </Link>

        <Link
          to="/admin/leaves"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:border-brand-500 transition group flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition">Review Leaves</h4>
            <p className="text-xs text-slate-500 mt-0.5">{metrics?.pending_leaves} requests awaiting decision</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition" />
        </Link>

        <Link
          to="/admin/payroll"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:border-brand-500 transition group flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition">Payroll Processing</h4>
            <p className="text-xs text-slate-500 mt-0.5">Generate salary slips & run disbursements</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition" />
        </Link>
      </div>
    </div>
  );
};
