import React, { useState, useEffect } from 'react';
import { reportService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { Sparkles, Download, FileSpreadsheet, BarChart2, PieChart as PieIcon, TrendingUp } from 'lucide-react';
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

const COLORS = ['#0c82ea', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const ReportsAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportService.getDashboardMetrics();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Organization Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Export comprehensive HR datasets and analyze macro workforce trends.</p>
        </div>
      </div>

      {/* Export Dataset Vault */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Employees Master</h4>
            <p className="text-xs text-slate-500 mt-0.5">Full personnel roster with job designations & joining dates.</p>
          </div>
          <a
            href={reportService.getExportUrl('employees')}
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Attendance Register</h4>
            <p className="text-xs text-slate-500 mt-0.5">Punch in/out timestamps, daily working hours, and statuses.</p>
          </div>
          <a
            href={reportService.getExportUrl('attendance')}
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Leave Requests Ledger</h4>
            <p className="text-xs text-slate-500 mt-0.5">Applied leaves, approvals, dates, and recorded reasons.</p>
          </div>
          <a
            href={reportService.getExportUrl('leaves')}
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Payroll Expenditure</h4>
            <p className="text-xs text-slate-500 mt-0.5">Basic salary, allowances, deductions, and net payouts.</p>
          </div>
          <a
            href={reportService.getExportUrl('payroll')}
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Attendance Headcount Trend" subtitle="Active present employees logged per month">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.monthly_attendance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
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
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present Headcount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Leave Type Share" subtitle="Proportion of Paid, Sick, and Unpaid leaves requested">
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.leave_distribution || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {(metrics?.leave_distribution || []).map((entry, index) => (
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
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
