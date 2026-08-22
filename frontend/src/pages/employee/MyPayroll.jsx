import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { CreditCard, Download, FileText, CheckCircle2, DollarSign, Calendar } from 'lucide-react';

export const MyPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [loadingSlip, setLoadingSlip] = useState(false);

  const fetchPayroll = async () => {
    try {
      const data = await payrollService.getMyPayroll();
      setPayrolls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleViewSlip = async (id) => {
    setLoadingSlip(true);
    setSlipModalOpen(true);
    try {
      const slip = await payrollService.getSalarySlip(id);
      setSelectedSlip(slip);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const latest = payrolls[0];

  return (
    <div className="space-y-6">
      {/* Latest Salary Overview */}
      {latest && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider bg-brand-950/60 px-3 py-1 rounded-full border border-brand-500/20">
              Latest Statement • Period {latest.pay_period}
            </span>
            <div className="mt-3">
              <span className="text-xs text-slate-400 uppercase font-semibold">Net Disbursed Salary</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-0.5">
                ${latest.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Payment Date: {latest.payment_date || 'Processed / Pending'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row gap-6">
            <div>
              <p className="text-xs text-slate-300 font-semibold uppercase">Base Compensation</p>
              <p className="text-lg font-bold text-white mt-0.5">${latest.basic_salary.toLocaleString()}</p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-6 pt-3 sm:pt-0">
              <p className="text-xs text-emerald-300 font-semibold uppercase">+ Allowances</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">${latest.allowances.toLocaleString()}</p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-6 pt-3 sm:pt-0">
              <p className="text-xs text-rose-300 font-semibold uppercase">- Deductions</p>
              <p className="text-lg font-bold text-rose-400 mt-0.5">${latest.deductions.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Salary History */}
      <Card title="Compensation & Pay Slip Statements" subtitle="Read-only breakdown of your historical payroll and pay slips">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Pay Period</th>
                <th className="pb-3">Basic Salary</th>
                <th className="pb-3">Allowances</th>
                <th className="pb-3">Deductions</th>
                <th className="pb-3">Net Salary</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold text-slate-800">{pay.pay_period}</td>
                  <td className="py-3.5 text-slate-600">${pay.basic_salary.toLocaleString()}</td>
                  <td className="py-3.5 text-emerald-600 font-medium">+${pay.allowances.toLocaleString()}</td>
                  <td className="py-3.5 text-rose-600 font-medium">-${pay.deductions.toLocaleString()}</td>
                  <td className="py-3.5 font-extrabold text-slate-900">${pay.net_salary.toLocaleString()}</td>
                  <td className="py-3.5">
                    <Badge variant={pay.status === 'PAID' ? 'success' : 'info'}>{pay.status}</Badge>
                  </td>
                  <td className="py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewSlip(pay.id)}
                      icon={FileText}
                      className="text-xs py-1"
                    >
                      View Slip
                    </Button>
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payroll records generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Salary Slip Modal */}
      <Modal isOpen={slipModalOpen} onClose={() => setSlipModalOpen(false)} title="Official Salary Slip" maxWidth="max-w-2xl">
        {loadingSlip || !selectedSlip ? (
          <div className="py-12 text-center text-slate-400">Loading salary slip details...</div>
        ) : (
          <div className="space-y-6 text-xs bg-white p-2">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-600">DAYFLOW HRMS</h2>
                <p className="text-slate-400 text-[11px]">“Every workday, perfectly aligned.”</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-800 text-sm">SLIP #{selectedSlip.payroll_id}</span>
                <p className="text-slate-400 text-[10px]">Period: {selectedSlip.pay_period}</p>
              </div>
            </div>

            {/* Employee Meta */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-slate-400 uppercase text-[10px]">Employee Name</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedSlip.employee_name}</p>
                <p className="text-slate-500 font-mono mt-0.5">{selectedSlip.employee_id}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[10px]">Department & Role</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedSlip.designation}</p>
                <p className="text-slate-500 mt-0.5">{selectedSlip.department}</p>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Earnings Component</th>
                    <th className="p-3 text-right">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 text-slate-700 font-medium">Basic Salary</td>
                    <td className="p-3 text-right font-bold text-slate-800">${selectedSlip.basic_salary.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-700 font-medium">Special Allowances</td>
                    <td className="p-3 text-right font-bold text-emerald-600">+${selectedSlip.allowances.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-700 font-medium">Tax & Statutory Deductions</td>
                    <td className="p-3 text-right font-bold text-rose-600">-${selectedSlip.deductions.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50/80 font-bold">
                    <td className="p-3 text-slate-900 text-sm uppercase">Total Net Disbursed</td>
                    <td className="p-3 text-right text-base text-brand-600 font-extrabold">
                      ${selectedSlip.net_salary.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center pt-2">
              <Button size="sm" variant="secondary" onClick={() => window.print()} icon={Download}>
                Print / Save Salary Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
