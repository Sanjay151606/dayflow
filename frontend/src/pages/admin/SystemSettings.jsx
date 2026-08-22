import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { Settings, Save, Shield, Clock, Calendar, DollarSign, Bell } from 'lucide-react';

export const SystemSettings = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable map
  const [settingsMap, setSettingsMap] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
      const sm = {};
      data.forEach((s) => {
        sm[s.key] = s.value;
      });
      setSettingsMap(sm);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateSettings(settingsMap);
      addToast('System settings updated successfully!', 'success');
      fetchSettings();
    } catch (err) {
      addToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, val) => {
    setSettingsMap((prev) => ({ ...prev, [key]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings & Company Policies</h2>
          <p className="text-xs text-slate-500 mt-1">Configure company working hours, annual leave allocations, and notification parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Organization */}
        <Card title="Organization Identity" subtitle="General corporate attributes">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settingsMap['company_name'] || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* Working Hours & Workweek */}
        <Card title="Work Hours & Schedule" subtitle="Expected daily shift and standard working week">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Standard Daily Working Hours</label>
              <input
                type="number"
                step="0.5"
                value={settingsMap['daily_standard_hours'] || '8.0'}
                onChange={(e) => handleChange('daily_standard_hours', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Standard Business Days</label>
              <input
                type="text"
                value={settingsMap['work_week_days'] || 'Monday,Tuesday,Wednesday,Thursday,Friday'}
                onChange={(e) => handleChange('work_week_days', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* Leave Quota Defaults */}
        <Card title="Leave Quota Allocation" subtitle="Annual entitlement for full-time employees">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Annual Paid Leaves (Days)</label>
              <input
                type="number"
                value={settingsMap['annual_paid_leave_quota'] || '15'}
                onChange={(e) => handleChange('annual_paid_leave_quota', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Annual Sick Leaves (Days)</label>
              <input
                type="number"
                value={settingsMap['annual_sick_leave_quota'] || '10'}
                onChange={(e) => handleChange('annual_sick_leave_quota', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* Payroll Policy */}
        <Card title="Compensation & Overtime Policy" subtitle="Multiplier and tax parameters">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Overtime Rate Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={settingsMap['overtime_rate_multiplier'] || '1.5'}
                onChange={(e) => handleChange('overtime_rate_multiplier', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" icon={Save} isLoading={saving} className="shadow-glow">
            Save System Policies
          </Button>
        </div>
      </form>
    </div>
  );
};
