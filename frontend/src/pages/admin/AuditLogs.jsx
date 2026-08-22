import React, { useState, useEffect } from 'react';
import { reportService } from '../../services';
import { Card, Badge } from '../../components/common/UIComponents';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await reportService.getAuditLogs({ page, limit: 25 });
      setLogs(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Security & Audit Logs</h2>
        <p className="text-xs text-slate-500 mt-1">Immutable audit trail of all sensitive operations, state changes, and logins.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Entity</th>
                <th className="pb-3">Target ID</th>
                <th className="pb-3">User ID</th>
                <th className="pb-3">IP Address</th>
                <th className="pb-3">Data Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-800">{log.entity}</td>
                  <td className="py-3 font-mono text-slate-600">#{log.entity_id || '—'}</td>
                  <td className="py-3 font-mono text-slate-600">{log.user_id ? `User #${log.user_id}` : 'System'}</td>
                  <td className="py-3 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                  <td className="py-3 text-[11px] text-slate-500 max-w-xs truncate font-mono">
                    {log.new_value || log.old_value || '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
