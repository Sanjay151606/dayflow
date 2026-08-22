import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { documentService, employeeService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { FileText, Download, Trash2, Search } from 'lucide-react';

export const DocumentManager = () => {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeeService.getEmployees({ limit: 100 });
        setEmployees(res.items);
        if (res.items.length > 0) {
          setSelectedEmpId(res.items[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const fetchDocsForEmp = async (empId) => {
    if (!empId) return;
    try {
      const docs = await documentService.getEmployeeDocuments(empId);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      fetchDocsForEmp(selectedEmpId);
    }
  }, [selectedEmpId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee document?')) return;
    try {
      await documentService.deleteDocument(id);
      addToast('Document deleted.', 'info');
      fetchDocsForEmp(selectedEmpId);
    } catch (e) {
      addToast('Failed to delete document', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Document Management</h2>
        <p className="text-xs text-slate-500 mt-1">Audit submitted identity proofs, offer letters, resumes, and certificates.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex items-center gap-3">
        <label className="text-xs font-bold text-slate-600 uppercase">Select Employee</label>
        <select
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name} ({e.user?.employee_id}) — {e.department}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{doc.file_name}</p>
                <p className="text-[10px] text-slate-400">{doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg font-semibold"
              >
                View
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {documents.length === 0 && (
          <p className="text-xs text-slate-400 py-8 text-center col-span-3">No documents submitted by this employee.</p>
        )}
      </div>
    </div>
  );
};
