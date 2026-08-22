import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { payrollService, employeeService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { CreditCard, Plus, FileText, Download, DollarSign, Edit2 } from 'lucide-react';

export const PayrollManager = () => {
  const { addToast } = useToast();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payPeriod, setPayPeriod] = useState('2026-08');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Payroll Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    basic_salary: 6000.0,
    allowances: 800.0,
    deductions: 500.0,
    pay_period: '2026-08',
    status: 'PENDING'
  });

  const fetchPayrollAndEmps = async () => {
    setLoading(true);
    try {
      const [payList, empList] = await Promise.all([
        payrollService.getAllPayroll({ pay_period: payPeriod || undefined }),
        employeeService.getEmployees({ limit: 100 })
      ]);
      setPayrolls(payList);
      setEmployees(empList.items);
      if (empList.items.length > 0 && !formData.employee_id) {
        setFormData((prev) => ({ ...prev, employee_id: empList.items[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollAndEmps();
  }, [payPeriod]);

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payrollService.createPayroll({
        ...formData,
        employee_id: parseInt(formData.employee_id),
        basic_salary: parseFloat(formData.basic_salary),
        allowances: parseFloat(formData.allowances),
        deductions: parseFloat(formData.deductions)
      });
      addToast('Payroll entry generated successfully!', 'success');
      setCreateModalOpen(false);
      fetchPayrollAndEmps();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create payroll entry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSlip = async (id) => {
    try {
      const slip = await payrollService.getSalarySlip(id);
      setSelectedSlip(slip);
      setSlipModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const netCalculated = (parseFloat(formData.basic_salary) || 0) + (parseFloat(formData.allowances) || 0) - (parseFloat(formData.deductions) || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll Administration & Salary Slips</h2>
          <p className="text-xs text-slate-500 mt-1">Disburse salaries, calculate deductions, and generate downloadable salary slips.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setCreateModalOpen(true)} className="shadow-glow">
          Generate Payroll Record
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase">Pay Period</label>
          <select
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Periods</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Statements: <span className="font-bold text-slate-800">{payrolls.length}</span>
        </div>
      </div>

      {/* Payroll Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Basic ($)</th>
                <th className="pb-3">Allowances ($)</th>
                <th className="pb-3">Deductions ($)</th>
                <th className="pb-3">Net Salary ($)</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5">
                    <p className="font-bold text-slate-900">{p.employee_name || 'Employee'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{p.employee_code}</p>
                  </td>
                  <td className="py-3.5 text-slate-700 font-medium">{p.department}</td>
                  <td className="py-3.5 text-slate-800 font-semibold">{p.pay_period}</td>
                  <td className="py-3.5 text-slate-600">${p.basic_salary.toLocaleString()}</td>
                  <td className="py-3.5 text-emerald-600 font-medium">+${p.allowances.toLocaleString()}</td>
                  <td className="py-3.5 text-rose-600 font-medium">-${p.deductions.toLocaleString()}</td>
                  <td className="py-3.5 font-extrabold text-slate-900">${p.net_salary.toLocaleString()}</td>
                  <td className="py-3.5">
                    <Badge variant={p.status === 'PAID' ? 'success' : 'info'}>{p.status}</Badge>
                  </td>
                  <td className="py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewSlip(p.id)}
                      icon={FileText}
                      className="py-1 px-2 text-xs"
                    >
                      Slip
                    </Button>
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No payroll entries found for period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Payroll Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Generate Payroll Entry">
        <form onSubmit={handleCreatePayroll} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Select Employee</label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.user?.employee_id}) — {e.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Pay Period (YYYY-MM)</label>
              <input
                type="text"
                required
                value={formData.pay_period}
                onChange={(e) => setFormData({ ...formData, pay_period: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="PENDING">PENDING</option>
                <option value="PROCESSED">PROCESSED</option>
                <option value="PAID">PAID</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Basic Salary ($)</label>
              <input
                type="number"
                step="50"
                required
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Allowances ($)</label>
              <input
                type="number"
                step="25"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Deductions ($)</label>
              <input
                type="number"
                step="25"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Computed Net Preview */}
          <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl flex items-center justify-between">
            <span className="font-bold text-brand-900">Net Salary Calculation</span>
            <span className="text-base font-extrabold text-brand-700">${Math.max(0, netCalculated).toLocaleString()}</span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Disburse / Create Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Salary Slip Modal */}
      <Modal isOpen={slipModalOpen} onClose={() => setSlipModalOpen(false)} title="Salary Slip View" maxWidth="max-w-xl">
        {selectedSlip && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-brand-600">DAYFLOW HRMS</h3>
                <p className="text-slate-400 text-[10px]">Slip ID: #{selectedSlip.payroll_id}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">{selectedSlip.employee_name}</p>
                <p className="text-slate-400 font-mono">{selectedSlip.employee_id}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-bold text-slate-800">${selectedSlip.basic_salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-emerald-600">
                <span>Allowances</span>
                <span className="font-bold">+${selectedSlip.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-rose-600">
                <span>Deductions</span>
                <span className="font-bold">-${selectedSlip.deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm bg-slate-50 px-3 rounded-lg">
                <span className="text-slate-900">Net Disbursed</span>
                <span className="text-brand-600 font-extrabold">${selectedSlip.net_salary.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-3">
              <Button size="sm" variant="secondary" onClick={() => window.print()} icon={Download}>
                Print Salary Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
