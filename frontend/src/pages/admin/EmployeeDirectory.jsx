import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Power,
  Eye,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Building
} from 'lucide-react';

export const EmployeeDirectory = () => {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Employee Form State
  const [newEmpData, setNewEmpData] = useState({
    employee_id: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Software Engineer',
    phone: '',
    employment_type: 'Full-Time',
    joining_date: new Date().toISOString().split('T')[0]
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees({
        page,
        limit: 15,
        search: search || undefined,
        department: department || undefined
      });
      setEmployees(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, department]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await employeeService.createEmployee(newEmpData);
      addToast('Employee onboarded successfully!', 'success');
      setCreateModalOpen(false);
      fetchEmployees();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create employee.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await employeeService.toggleStatus(id);
      addToast(res.message, 'info');
      fetchEmployees();
    } catch (err) {
      addToast('Failed to toggle status', 'error');
    }
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp);
    setEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSubmitting(true);
    try {
      await employeeService.updateEmployee(selectedEmp.id, {
        first_name: selectedEmp.first_name,
        last_name: selectedEmp.last_name,
        department: selectedEmp.department,
        designation: selectedEmp.designation,
        employment_type: selectedEmp.employment_type,
        phone: selectedEmp.phone,
        address: selectedEmp.address
      });
      addToast('Employee updated successfully!', 'success');
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      addToast('Failed to update employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage personnel, onboard new hires, and review employee files.</p>
        </div>
        <Button variant="primary" size="md" icon={UserPlus} onClick={() => setCreateModalOpen(true)} className="shadow-glow">
          Onboard New Employee
        </Button>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, ID, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product Design">Product Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Marketing">Marketing</option>
            <option value="Executive Management">Executive Management</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Department & Role</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-sky-400 text-white font-bold flex items-center justify-center text-xs">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.user?.employee_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <p className="font-semibold text-slate-800">{emp.designation}</p>
                    <p className="text-[11px] text-slate-500">{emp.department}</p>
                  </td>
                  <td className="py-3.5">
                    <p className="text-slate-700">{emp.user?.email}</p>
                    <p className="text-[11px] text-slate-400">{emp.phone || 'No phone'}</p>
                  </td>
                  <td className="py-3.5">
                    <Badge variant="neutral">{emp.employment_type}</Badge>
                  </td>
                  <td className="py-3.5">
                    <Badge variant={emp.user?.is_active ? 'success' : 'danger'}>
                      {emp.user?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp.id)}
                        className={`p-1.5 rounded-lg transition ${
                          emp.user?.is_active
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={emp.user?.is_active ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No employees matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Onboard Employee Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Onboard New Employee">
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">First Name</label>
              <input
                type="text"
                required
                value={newEmpData.first_name}
                onChange={(e) => setNewEmpData({ ...newEmpData, first_name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Last Name</label>
              <input
                type="text"
                required
                value={newEmpData.last_name}
                onChange={(e) => setNewEmpData({ ...newEmpData, last_name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Employee ID Code</label>
              <input
                type="text"
                required
                value={newEmpData.employee_id}
                onChange={(e) => setNewEmpData({ ...newEmpData, employee_id: e.target.value })}
                placeholder="EMP-005"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Role</label>
              <select
                value={newEmpData.role}
                onChange={(e) => setNewEmpData({ ...newEmpData, role: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR Specialist</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Work Email</label>
            <input
              type="email"
              required
              value={newEmpData.email}
              onChange={(e) => setNewEmpData({ ...newEmpData, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                required
                value={newEmpData.department}
                onChange={(e) => setNewEmpData({ ...newEmpData, department: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Designation</label>
              <input
                type="text"
                required
                value={newEmpData.designation}
                onChange={(e) => setNewEmpData({ ...newEmpData, designation: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={newEmpData.phone}
                onChange={(e) => setNewEmpData({ ...newEmpData, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Employment Type</label>
              <select
                value={newEmpData.employment_type}
                onChange={(e) => setNewEmpData({ ...newEmpData, employment_type: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Employee Record">
        {selectedEmp && (
          <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={selectedEmp.first_name}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, first_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={selectedEmp.last_name}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, last_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={selectedEmp.department}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, department: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={selectedEmp.designation}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, designation: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={selectedEmp.phone || ''}
                onChange={(e) => setSelectedEmp({ ...selectedEmp, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
