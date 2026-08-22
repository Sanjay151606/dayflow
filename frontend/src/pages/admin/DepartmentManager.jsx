import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { departmentService } from '../../services';
import { Card, Button, Badge, Modal } from '../../components/common/UIComponents';
import { Building, Plus, Users, Layers, Edit2 } from 'lucide-react';

export const DepartmentManager = () => {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [desigModalOpen, setDesigModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Dept Form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Desig Form
  const [desigTitle, setDesigTitle] = useState('');
  const [desigLevel, setDesigLevel] = useState('Mid-Level');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await departmentService.createDepartment({
        name: deptName,
        code: deptCode,
        description: deptDesc,
        status: 'ACTIVE'
      });
      addToast('Department created successfully!', 'success');
      setDeptModalOpen(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      fetchDepartments();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create department.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDesig = async (e) => {
    e.preventDefault();
    if (!selectedDeptId) return;
    setSubmitting(true);
    try {
      await departmentService.createDesignation({
        department_id: selectedDeptId,
        title: desigTitle,
        level: desigLevel,
        status: 'ACTIVE'
      });
      addToast('Designation created!', 'success');
      setDesigModalOpen(false);
      setDesigTitle('');
      fetchDepartments();
    } catch (err) {
      addToast('Failed to create designation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department & Designation Hierarchy</h2>
          <p className="text-xs text-slate-500 mt-1">Define organization structures, business units, and designation roles.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setDeptModalOpen(true)} className="shadow-glow">
          Create Department
        </Button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((d) => (
          <Card key={d.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{d.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      CODE: {d.code}
                    </span>
                  </div>
                </div>
                <Badge variant={d.status === 'ACTIVE' ? 'success' : 'neutral'}>{d.status}</Badge>
              </div>

              <p className="text-xs text-slate-600 mb-4">{d.description || 'No department description provided.'}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-brand-600" /> {d.employee_count} Employees
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Layers className="w-4 h-4 text-sky-600" /> {d.designations?.length || 0} Designations
                </span>
              </div>

              {/* Designations List */}
              <div className="space-y-1.5 mb-4">
                <p className="text-[11px] font-bold uppercase text-slate-400">Designation Titles</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.designations?.map((des) => (
                    <span key={des.id} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700">
                      {des.title} <span className="text-[9px] text-slate-400">({des.level})</span>
                    </span>
                  ))}
                  {(!d.designations || d.designations.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No designations assigned.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={() => {
                  setSelectedDeptId(d.id);
                  setDesigModalOpen(true);
                }}
                className="text-xs"
              >
                Add Designation Title
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Dept Modal */}
      <Modal isOpen={deptModalOpen} onClose={() => setDeptModalOpen(false)} title="Create New Department">
        <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Department Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Cloud Architecture"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Department Code</label>
            <input
              type="text"
              required
              placeholder="e.g., CLOUD"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={3}
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              placeholder="Scope and purpose of this department..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Designation Modal */}
      <Modal isOpen={desigModalOpen} onClose={() => setDesigModalOpen(false)} title="Add Designation to Department">
        <form onSubmit={handleCreateDesig} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Designation Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Lead Systems Architect"
              value={desigTitle}
              onChange={(e) => setDesigTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Career Level</label>
            <select
              value={desigLevel}
              onChange={(e) => setDesigLevel(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            >
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead / Principal</option>
              <option value="Executive">Executive / Director</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDesigModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Save Designation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
