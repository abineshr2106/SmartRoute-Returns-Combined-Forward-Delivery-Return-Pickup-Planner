import React, { useEffect } from 'react';
import { RouteDetail } from '../types';
import { Truck, Clock, Weight, Box, AlertTriangle, CheckCircle, MapPin, X, Users } from 'lucide-react';

interface RouteDetailModalProps {
  route: RouteDetail | null;
  onClose: () => void;
}

export const RouteDetailModal: React.FC<RouteDetailModalProps> = ({ route, onClose }) => {
  useEffect(() => {
    if (route) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [route]);

  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white">ROUTE {route.route_id}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Vehicle {route.vehicle_id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  route.workload_status === 'Normal' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  route.workload_status === 'Elevated' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  Workload: {route.workload_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Assigned Driver: {route.driver_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Deliveries / Returns</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {route.deliveries_count} <span className="text-slate-400 font-normal">deliv</span> / {route.returns_count} <span className="text-emerald-600 font-semibold">returns</span>
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Combined Distance</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{route.combined_distance_km} km</p>
              <span className="text-xs font-semibold text-sky-600">+{route.incremental_km} km inc.</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Weight Capacity</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{route.total_weight_kg} kg</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, route.weight_utilization_pct)}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">{route.weight_utilization_pct}% of {route.weight_capacity_kg}kg</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Volume Capacity</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{route.total_volume_m3} m³</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, route.volume_utilization_pct)}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">{route.volume_utilization_pct}% of {route.volume_capacity_m3}m³</span>
            </div>
          </div>

          {/* Workload Analysis Grid */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Worker Protection & Workload Analysis
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-xs font-medium text-amber-700 block">Total Stops</span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">{route.stops?.length || 0}</p>
                <span className="text-[10px] text-amber-600 block">Max allowed: 25</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-xs font-medium text-amber-700 block">Est. Shift Hours</span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">{route.total_duration_hours?.toFixed(1) || '0.0'} hrs</p>
                <span className="text-[10px] text-amber-600 block">Max allowed: {route.working_hours?.toFixed(1) || '0.0'} hrs</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-xs font-medium text-amber-700 block">Driving vs Service</span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">
                  {(() => {
                    const svcHrs = (route.stops || []).reduce((acc, s) => acc + ((s.service_time_minutes || 10) / 60), 0);
                    const drvHrs = Math.max(0, (route.total_duration_hours || 0) - svcHrs);
                    return `${drvHrs.toFixed(1)} / ${svcHrs.toFixed(1)}`;
                  })()}
                </p>
                <span className="text-[10px] text-amber-600 block">Hours</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex flex-col justify-center">
                <span className="text-xs font-medium text-amber-700 block">Status</span>
                <span className={`inline-block w-max mt-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                  route.workload_status === 'Normal' ? 'bg-emerald-200 text-emerald-800' :
                  route.workload_status === 'Elevated' ? 'bg-amber-300 text-amber-900' :
                  'bg-rose-500 text-white'
                }`}>
                  {route.workload_status}
                </span>
              </div>
            </div>
          </div>

          {/* Sequence Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Route Sequence Timeline ({route.stops?.length || 0} Stops)
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Seq</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">ID / Customer</th>
                    <th className="py-2.5 px-3">Item & Weight</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3">Est. Arrival</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(route.stops || []).map((stop) => {
                    const isReturn = stop.stop_type === 'RETURN';
                    return (
                      <tr key={stop.stop_id} className={`hover:bg-slate-50/80 ${isReturn ? 'bg-emerald-50/40' : ''}`}>
                        <td className="py-2 px-3 font-bold text-slate-700">#{stop.sequence}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReturn ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}>
                            {stop.stop_type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {stop.stop_id} <span className="text-slate-400 font-normal">({stop.customer_id})</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {stop.item_type} ({stop.item_size}, {stop.item_weight_kg}kg)
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {stop.delivery_time_start || stop.pickup_time_start} - {stop.delivery_time_end || stop.pickup_time_end}
                        </td>
                        <td className="py-2 px-3 font-bold text-amber-600">
                          {stop.estimated_arrival || '-'}
                        </td>
                        <td className="py-2 px-3">
                          {stop.status === 'Feasible' ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Feasible
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> TW Conflict
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            Close Route Details
          </button>
        </div>
      </div>
    </div>
  );
};
