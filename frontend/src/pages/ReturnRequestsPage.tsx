import React, { useState, useMemo } from 'react';
import { CombinedPlanResponse, ReturnItem } from '../types';
import { fetchAuditLogApi } from '../services/api';
import { ReturnDetailModal } from '../components/ReturnDetailModal';
import { RotateCcw, Search, Filter, AlertTriangle, CheckCircle2, Info, Eye, ShieldAlert, X } from 'lucide-react';

interface ReturnRequestsPageProps {
  data: CombinedPlanResponse | null;
  onOverride?: (return_id: string, route_id: string, reason: string, user_id: string) => void;
}

export const ReturnRequestsPage: React.FC<ReturnRequestsPageProps> = ({ data, onOverride }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [overrideModal, setOverrideModal] = useState<{ isOpen: boolean; returnId: string }>({ isOpen: false, returnId: '' });
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [overrideRoute, setOverrideRoute] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideUserId, setOverrideUserId] = useState<string>('DISPATCHER-001');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);

  const returns = data?.returns || [];

  const filteredReturns = useMemo(() => {
    return returns.filter((ret) => {
      // Search query matching
      const matchesSearch =
        ret.return_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.item_type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter tabs
      if (filterType === 'ALL') return true;
      if (filterType === 'WARRANTY') return ret.return_type === 'Warranty';
      if (filterType === 'CUSTOMER_RETURN') return ret.return_type === 'Customer Return';
      if (filterType === 'URGENT') return ret.priority === 'Urgent';
      if (filterType === 'LARGE') return ret.item_size === 'Large' || ret.item_size === 'Extra Large';
      if (filterType === 'UNASSIGNED') return ret.status !== 'Assigned';
      if (filterType === 'BLOCKED') return ret.status === 'BLOCKED';

      return true;
    });
  }, [returns, filterType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-emerald-600" /> Return Requests Directory ({returns.length} Requests)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect, and audit electronics return requests, route insertion feasibility, and blockage reasons.
          </p>
        </div>

        {/* Search bar and actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={async () => {
              setAuditModalOpen(true);
              try {
                const res = await fetchAuditLogApi();
                setAuditLogs(res.audit_log || []);
              } catch(e) {}
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Audit Log</span>
          </button>
          
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search return ID, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'WARRANTY', label: 'Warranty' },
          { id: 'CUSTOMER_RETURN', label: 'Customer Return' },
          { id: 'URGENT', label: 'Urgent Priority' },
          { id: 'LARGE', label: 'Large / XL Items' },
          { id: 'UNASSIGNED', label: 'Unassigned' },
          { id: 'BLOCKED', label: 'Blocked / Conflicts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all border ${
              filterType === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Return ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item & Size</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Assigned Route</th>
                <th className="py-3 px-4">Incremental KM</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No return requests matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => {
                  const isAssigned = ret.status === 'Assigned';
                  const isBlocked = ret.status === 'BLOCKED';

                  return (
                    <tr key={ret.return_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{ret.return_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{ret.customer_id}</td>
                      <td className="py-3 px-4 text-slate-800">
                        <span className="font-semibold block">{ret.item_type}</span>
                        <span className="text-[10px] text-slate-400">{ret.item_size}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ret.return_type}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{ret.item_weight_kg} kg</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ret.priority === 'Urgent' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          ret.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ret.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {ret.pickup_time_start} - {ret.pickup_time_end}
                      </td>
                      <td className="py-3 px-4 font-bold text-sky-700">
                        {ret.assigned_route_id ? `Route ${ret.assigned_route_id}` : '-'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {isAssigned ? `+${ret.incremental_km} km` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {isAssigned ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Assigned
                          </span>
                        ) : isBlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1" title={ret.blocked_reason || ''}>
                            <AlertTriangle className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isBlocked && (
                            <button
                              onClick={() => setOverrideModal({ isOpen: true, returnId: ret.return_id })}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold text-[11px] transition-colors border border-rose-300 inline-flex items-center gap-1"
                              title="Authorized Override"
                            >
                              <ShieldAlert className="w-3 h-3" /> Override
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReturn(ret)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors border border-slate-300 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Detail Modal */}
      <ReturnDetailModal returnItem={selectedReturn} onClose={() => setSelectedReturn(null)} />
      {/* Override Modal */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-rose-500 px-5 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Authorized Dispatch Override
              </h3>
              <button 
                onClick={() => setOverrideModal({ isOpen: false, returnId: '' })}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 font-medium">
                You are about to force assignment of <span className="font-bold">{overrideModal.returnId}</span> to a route. <br/><br/>
                <span className="font-bold uppercase">Warning:</span> Override bypasses normal planning restrictions and should be used only by authorized personnel.
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Route ID</label>
                  <select 
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500"
                    value={overrideRoute}
                    onChange={(e) => setOverrideRoute(e.target.value)}
                  >
                    <option value="">-- Select Route --</option>
                    {data?.routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>Route {r.route_id} (Vehicle {r.vehicle_id})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reason for Override</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="e.g., VIP Customer, Manager Approved"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dispatcher ID</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500"
                    value={overrideUserId}
                    onChange={(e) => setOverrideUserId(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setOverrideModal({ isOpen: false, returnId: '' })}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (overrideRoute && overrideReason && overrideUserId && onOverride) {
                    onOverride(overrideModal.returnId, overrideRoute, overrideReason, overrideUserId);
                    setOverrideModal({ isOpen: false, returnId: '' });
                    setOverrideRoute('');
                    setOverrideReason('');
                  }
                }}
                disabled={!overrideRoute || !overrideReason || !overrideUserId}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" /> Execute Override
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Audit Log Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-800 px-5 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-white font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" /> Authorized Override Audit Log
              </h3>
              <button 
                onClick={() => setAuditModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto grow">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">User ID</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Return ID</th>
                    <th className="py-2.5 px-4">Route ID</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Prev Status</th>
                    <th className="py-2.5 px-4">New Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No authorization overrides have been executed.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{log.user_id}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-sky-700 font-bold">{log.return_id}</td>
                        <td className="py-2.5 px-4 font-mono text-indigo-700 font-bold">{log.route_id}</td>
                        <td className="py-2.5 px-4 text-slate-600 truncate max-w-[150px]" title={log.reason}>{log.reason}</td>
                        <td className="py-2.5 px-4 text-slate-500 line-through">{log.previous_status}</td>
                        <td className="py-2.5 px-4 font-bold text-amber-600">{log.new_status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
