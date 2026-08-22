import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employeeService, documentService, authService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import {
  User, Mail, Phone, MapPin, Briefcase, Calendar, ShieldCheck,
  FileText, Upload, Trash2, CheckCircle2, Lock, Landmark, HeartHandshake
} from 'lucide-react';

export const MyProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Edit fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  // Password fields
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Document upload
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
      setBankName(prof.bank_name || '');
      setAccountNumber(prof.account_number || '');
      setRoutingNumber(prof.routing_number || '');
      setEmergencyName(prof.emergency_contact_name || '');
      setEmergencyPhone(prof.emergency_contact_phone || '');
      setEmergencyRelation(prof.emergency_contact_relation || '');
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
      await employeeService.updateMyProfile({
        phone,
        address,
        bank_name: bankName,
        account_number: accountNumber,
        routing_number: routingNumber,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        emergency_contact_relation: emergencyRelation,
        onboarding_status: 'COMPLETED'
      });
      addToast('Profile & onboarding information updated!', 'success');
      fetchProfileAndDocs();
    } catch (err) {
      addToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPass(true);
    try {
      await authService.changePassword(currPassword, newPassword);
      addToast('Password changed successfully!', 'success');
      setCurrPassword('');
      setNewPassword('');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setChangingPass(false);
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

  // Calculate onboarding progress %
  let completedSteps = 1; // User account creation
  if (profile?.phone && profile?.address) completedSteps++;
  if (profile?.bank_name && profile?.account_number) completedSteps++;
  if (profile?.emergency_contact_name) completedSteps++;
  if (documents.length > 0) completedSteps++;
  const onboardingPct = Math.round((completedSteps / 5) * 100);

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

      {/* Onboarding Checklist Tracker */}
      <Card title="Onboarding Progress Indicator" subtitle="Complete all required stages for full employee certification">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Completion Status ({completedSteps}/5 steps verified)</span>
            <span className="text-brand-600">{onboardingPct}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-brand-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${onboardingPct}%` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-semibold text-center">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Account Setup
            </div>
            <div className={`p-2 rounded-xl border ${profile?.phone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
              {profile?.phone ? '✓' : '○'} Contact Details
            </div>
            <div className={`p-2 rounded-xl border ${profile?.bank_name ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
              {profile?.bank_name ? '✓' : '○'} Direct Deposit
            </div>
            <div className={`p-2 rounded-xl border ${profile?.emergency_contact_name ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
              {profile?.emergency_contact_name ? '✓' : '○'} Emergency Info
            </div>
            <div className={`p-2 rounded-xl border ${documents.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
              {documents.length > 0 ? '✓' : '○'} Document Vault
            </div>
          </div>
        </div>
      </Card>

      {/* Editable Info Forms */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <Card title="Personal & Residential Details" subtitle="Your phone number and physical address">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
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
                <label className="block font-semibold text-slate-600 uppercase mb-1">Residential Address</label>
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
            </div>
          </Card>

          {/* Direct Deposit / Banking */}
          <Card title="Bank & Direct Deposit Information" subtitle="Used for salary disbursal and tax slips">
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Chase / Silicon Valley Bank"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="••••••••4921"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Routing Code</label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="021000021"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <Card title="Emergency Contact Information" subtitle="Authorized emergency contact personnel">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1 (555) 999-8888"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Relationship</label>
              <input
                type="text"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="Spouse / Parent / Sibling"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={saving}>
              Save Profile & Onboarding Data
            </Button>
          </div>
        </Card>
      </form>

      {/* Security & Change Password Card */}
      <Card title="Security & Credentials" subtitle="Update your sign-in password">
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-end">
          <div>
            <label className="block font-semibold text-slate-600 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currPassword}
              onChange={(e) => setCurrPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 uppercase mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 symbol"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <Button type="submit" variant="secondary" size="md" isLoading={changingPass} icon={Lock}>
            Update Password
          </Button>
        </form>
      </Card>

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
