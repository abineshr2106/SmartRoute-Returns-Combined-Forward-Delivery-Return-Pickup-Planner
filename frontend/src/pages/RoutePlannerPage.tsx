import React, { useState } from 'react';
import { CombinedPlanResponse, RouteDetail } from '../types';
import { RouteMapCanvas } from '../components/RouteMapCanvas';
import { RouteDetailModal } from '../components/RouteDetailModal';
import { Truck, Eye, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, Scale, Box, Users } from 'lucide-react';

interface RoutePlannerPageProps {
  data: CombinedPlanResponse | null;
}

export const RoutePlannerPage: React.FC<RoutePlannerPageProps> = ({ data }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [inspectRoute, setInspectRoute] = useState<RouteDetail | null>(null);

  const routes = data?.routes || [];
  const returns = data?.returns || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600" /> Active Delivery & Return Routes (10 Vehicles)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect individual vehicle routes, combined stop sequences, capacity utilization, and incremental travel distances.
          </p>
        </div>
        {selectedRouteId && (
          <button
            onClick={() => setSelectedRouteId(null)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300"
          >
            Show All Routes on Map
          </button>
        )}
      </div>

      {/* Main Split Layout: Map Visualizer + Route Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Map Canvas (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <RouteMapCanvas
            routes={routes}
            returns={returns}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        </div>

        {/* Right Column: Route Cards Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {routes.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No optimization routes generated yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click "RUN COMBINED PLANNER" in the top bar to evaluate routes.</p>
            </div>
          ) : (
            routes.map((r) => {
              const isSelected = selectedRouteId === r.route_id;

              return (
                <div
                  key={r.route_id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md ${
                    isSelected ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                        {r.route_id}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">Vehicle {r.vehicle_id}</span>
                          <span className="text-xs text-slate-400">({r.driver_id})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.workload_status === 'Normal' ? 'bg-emerald-100 text-emerald-800' :
                            r.workload_status === 'Elevated' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            Workload: {r.workload_status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.deliveries_count} Deliveries + <span className="text-emerald-700 font-semibold">{r.returns_count} Return Pickups</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRouteId(isSelected ? null : r.route_id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Focus Map'}
                      </button>
                      <button
                        onClick={() => setInspectRoute(r)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>

                  {/* Route Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Original KM</span>
                      <span className="font-bold text-slate-800 text-sm">{r.original_distance_km} km</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Combined KM</span>
                      <span className="font-bold text-slate-900 text-sm">{r.combined_distance_km} km</span>
                      <span className="text-[10px] text-sky-600 font-semibold block">+{r.incremental_km} km inc.</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Weight Util.</span>
                      <span className="font-bold text-slate-800 text-sm">{r.weight_utilization_pct}%</span>
                      <span className="text-[10px] text-slate-400 block">{r.total_weight_kg} / {r.weight_capacity_kg}kg</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Volume Util.</span>
                      <span className="font-bold text-slate-800 text-sm">{r.volume_utilization_pct}%</span>
                      <span className="text-[10px] text-slate-400 block">{r.total_volume_m3} / {r.volume_capacity_m3}m³</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inspect Route Detail Modal */}
      <RouteDetailModal route={inspectRoute} onClose={() => setInspectRoute(null)} />
    </div>
  );
};
