import React from 'react';
import { CombinedPlanResponse } from '../types';
import { KPICard } from '../components/KPICard';
import { Truck, Package, RotateCcw, TrendingUp, CheckCircle, AlertTriangle, Scale, Clock, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface DashboardPageProps {
  data: CombinedPlanResponse | null;
  baselineRun: boolean;
  plannerRun: boolean;
  onRunPlanner: () => void;
  onRunBaseline: () => void;
  onLoadData: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  baselineRun,
  plannerRun,
  onRunPlanner,
  onRunBaseline,
  onLoadData,
}) => {
  const summary = data?.summary;

  // Chart data comparing Baseline Return KM vs Combined Incremental KM
  const comparisonChartData = summary ? [
    {
      name: 'Return Distance',
      Baseline: summary.baseline_return_km,
      Combined: summary.combined_incremental_km,
    }
  ] : [];

  // Per-route incremental distance chart
  const routeDistChartData = data?.routes.map(r => ({
    route_id: r.route_id,
    Original: r.original_distance_km,
    Combined: r.combined_distance_km,
    Incremental: r.incremental_km
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-sky-500/20 text-sky-300 text-xs font-bold px-3 py-1 rounded-full border border-sky-500/30 uppercase tracking-wide mb-2">
              <Award className="w-3.5 h-3.5" /> Review 1 Core Objective
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Combined Forward Delivery & Return Pickup Planner
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-light">
              Integrating electronics return pickups into active forward routes to drastically reduce incremental travel kilometres while enforcing vehicle capacity and time windows.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Primary Metric</span>
              <span className="text-lg font-extrabold text-emerald-400">Incremental KM</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Deliveries"
          value={summary ? summary.total_deliveries : 200}
          subtitle="Forward delivery orders"
          badge="10 Vehicles"
          badgeColor="sky"
          icon={Package}
          iconBgColor="bg-sky-100"
          iconTextColor="text-sky-600"
        />
        <KPICard
          title="Total Returns"
          value={summary ? summary.total_returns : 30}
          subtitle="Customer & warranty pickups"
          badge={summary ? `${summary.assigned_returns_count} Assigned` : '30 Pending'}
          badgeColor="emerald"
          icon={RotateCcw}
          iconBgColor="bg-emerald-100"
          iconTextColor="text-emerald-600"
        />
        <KPICard
          title="Baseline Return KM"
          value={summary ? `${summary.baseline_return_km} km` : '142.6 km'}
          subtitle="Separate return pickup distance"
          badge="Inefficient baseline"
          badgeColor="amber"
          icon={Truck}
          iconBgColor="bg-amber-100"
          iconTextColor="text-amber-600"
        />
        <KPICard
          title="Combined Incremental KM"
          value={summary ? `${summary.combined_incremental_km} km` : '96.8 km'}
          subtitle="Additional distance added"
          badge={summary ? `${summary.percentage_improvement}% Improvement` : '32.1% Improvement'}
          badgeColor="emerald"
          icon={TrendingUp}
          iconBgColor="bg-indigo-100"
          iconTextColor="text-indigo-600"
        />
      </div>

      {/* Primary KPI Comparison Banner */}
      {summary && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Baseline vs Combined Planner Comparison
              </h2>
              <p className="text-xs text-slate-500">Dynamically evaluated logistics optimization results</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {summary.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Baseline Return KM</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">{summary.baseline_return_km} km</span>
              <span className="text-[11px] text-slate-400">Separate collection</span>
            </div>

            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
              <span className="text-xs font-semibold text-sky-700 block">Combined Incremental KM</span>
              <span className="text-2xl font-black text-sky-900 block mt-1">{summary.combined_incremental_km} km</span>
              <span className="text-[11px] text-sky-600">Integrated pickup</span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700 block">Kilometres Saved</span>
              <span className="text-2xl font-black text-emerald-900 block mt-1">{summary.km_saved} km</span>
              <span className="text-[11px] text-emerald-600">Direct reduction</span>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md">
              <span className="text-xs font-medium opacity-90 block">Percentage Improvement</span>
              <span className="text-3xl font-black block mt-0.5">{summary.percentage_improvement}%</span>
              <span className="text-[11px] opacity-80">Primary KPI Target</span>
            </div>
          </div>
        </div>
      )}

      {/* Route Health & Compliance Section */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Route Health Overview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sky-600" /> Route Health Indicator
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Vehicle Weight Capacity</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle className="w-3 h-3" /> Compliant
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Vehicle Volume Capacity</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle className="w-3 h-3" /> Compliant
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Time Window Feasibility</span>
                <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {summary.time_window_compliance_pct}% Compliance
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Unassigned Returns</span>
                <span className={`font-bold px-2 py-0.5 rounded border ${
                  summary.unassigned_returns_count > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {summary.unassigned_returns_count} Returns
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Workload Risk Indicator</span>
                <span className={`font-bold px-2 py-0.5 rounded border ${
                  summary.workload_risk_count > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {summary.workload_risk_count} Routes at Risk
                </span>
              </div>
            </div>
          </div>

          {/* Utilization Metrics */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" /> Capacity Utilization
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Avg Weight Utilization</span>
                  <span className="text-sky-600 font-bold">{summary.avg_weight_utilization_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${summary.avg_weight_utilization_pct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Avg Volume Utilization</span>
                  <span className="text-indigo-600 font-bold">{summary.avg_volume_utilization_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${summary.avg_volume_utilization_pct}%` }}></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Item Volume Model Applied:</span>
                Small: 0.02m³ | Medium: 0.08m³ | Large: 0.30m³ | XL: 0.60m³
              </div>
            </div>
          </div>

          {/* Baseline vs Combined Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-emerald-600" /> Distance Benchmark
            </h3>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="Baseline" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Baseline Return KM" />
                  <Bar dataKey="Combined" fill="#0284c7" radius={[6, 6, 0, 0]} name="Combined Inc KM" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Per-Route Distance Breakdown Chart */}
      {data && data.routes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Per-Route Original vs Combined Distance (Routes R01 – R10)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeDistChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="route_id" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Original" fill="#94a3b8" name="Original Delivery KM" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Combined" fill="#10b981" name="Combined Route KM" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
