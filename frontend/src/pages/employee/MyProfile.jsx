import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employeeService, documentService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, ShieldCheck, DollarSign, FileText, Upload, Trash2 } from 'lucide-react';

export const MyProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [docType, setDocType] = useState('RESUME');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchProfileAndDocs = async () => {
    try {
      const [prof, docs] = await Promise.all([
        employeeService.getMyProfile(),
        documentService.getMyDocuments()
      ]);
      setProfile(prof);
      setPhone(prof.phone || '');
      setAddress(prof.address || '');
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndDocs();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await employeeService.updateMyProfile({ phone, address });
      addToast('Profile updated successfully!', 'success');
      fetchProfileAndDocs();
    } catch (err) {
      addToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!selectedFile || !profile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('employee_id', profile.id);
      fd.append('document_type', docType);
      fd.append('file', selectedFile);

      await documentService.uploadDocument(fd);
      addToast('Document uploaded successfully!', 'success');
      setSelectedFile(null);
      fetchProfileAndDocs();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentService.deleteDocument(id);
      addToast('Document deleted.', 'info');
      fetchProfileAndDocs();
    } catch (err) {
      addToast('Failed to delete document', 'error');
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white font-extrabold text-3xl flex items-center justify-center shadow-glow flex-shrink-0">
          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <Badge variant="brand">{profile?.department}</Badge>
            <Badge variant="neutral">{profile?.employment_type}</Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">{profile?.designation}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> {user?.employee_id}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {profile?.joining_date}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editable Personal Contact Information */}
        <Card title="Personal Information (Editable)" subtitle="Manage your phone number and residential address">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Residential Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={saving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Read-Only Employment & Job Info */}
        <Card title="Employment & Job Details (Read-Only)" subtitle="Official company records maintained by HR">
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-bold text-slate-800">{profile?.department}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Designation</span>
              <span className="font-bold text-slate-800">{profile?.designation}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Employment Type</span>
              <span className="font-bold text-slate-800">{profile?.employment_type}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Joining Date</span>
              <span className="font-bold text-slate-800">{profile?.joining_date}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Gender / DOB</span>
              <span className="font-bold text-slate-800">{profile?.gender || 'N/A'} ({profile?.date_of_birth || 'N/A'})</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Salary Information</span>
              <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">View in My Payroll tab</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Documents Vault */}
      <Card title="My Documents Vault" subtitle="Upload and manage your credentials, IDs, and certificates">
        <form onSubmit={handleUploadDoc} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="RESUME">Resume</option>
              <option value="ID_PROOF">ID Proof</option>
              <option value="PAN">PAN Card</option>
              <option value="OFFER_LETTER">Offer Letter</option>
              <option value="JOINING_LETTER">Joining Letter</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Choose File (PDF/Image)</label>
            <input
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" isLoading={uploading} icon={Upload}>
            Upload Document
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center justify-between">
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
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-xs text-slate-400 py-6 text-center col-span-3">No documents uploaded yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
