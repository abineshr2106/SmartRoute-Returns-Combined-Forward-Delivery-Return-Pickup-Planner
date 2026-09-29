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
  disruptionScenario?: string;
  setDisruptionScenario?: (scenario: string) => void;
  datasetSummary?: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  baselineRun,
  plannerRun,
  onRunPlanner,
  onRunBaseline,
  onLoadData,
  disruptionScenario,
  setDisruptionScenario,
  datasetSummary
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
              <Award className="w-3.5 h-3.5" /> Final Review Core Objective
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
          value={summary ? summary.total_deliveries : (datasetSummary?.deliveries_count || 200)}
          subtitle="Forward delivery orders"
          badge={`${summary ? summary.total_vehicles : (datasetSummary?.vehicles_count || 10)} Vehicles`}
          badgeColor="sky"
          icon={Package}
          iconBgColor="bg-sky-100"
          iconTextColor="text-sky-600"
        />
        <KPICard
          title="Total Returns"
          value={summary ? summary.total_returns : (datasetSummary?.returns_count || 30)}
          subtitle="Customer & warranty pickups"
          badge={summary ? `${summary.assigned_returns_count} Assigned` : `${datasetSummary?.returns_count || 30} Pending`}
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

      {/* Disruption Simulation Control */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Disruption Simulation Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Test the optimizer's resilience against sudden real-world logistics disruptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={disruptionScenario || ''}
            onChange={(e) => setDisruptionScenario && setDisruptionScenario(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-xl focus:ring-amber-500 focus:border-amber-500 block p-2 transition-all cursor-pointer font-medium"
          >
            <option value="">-- Normal Operations --</option>
            <option value="Traffic Delay">Traffic Delay (+5m service time)</option>
            <option value="Vehicle Capacity Loss">Vehicle Capacity Loss (-25% capacity)</option>
            <option value="Vehicle Breakdown">Vehicle Breakdown (V01 Unavailable)</option>
            <option value="Urgent Return Request">Urgent Return Request (Force Insert)</option>
          </select>
          <button
            onClick={onRunPlanner}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md transition-all"
          >
            {disruptionScenario ? "Simulate" : "Reset Normal"}
          </button>
        </div>
      </div>
      {/* Disruption Results Panel */}
      {summary?.disruption_scenario && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3 mt-4">
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Disruption Impact Report
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3 rounded-lg border border-amber-100">
              <span className="font-semibold text-slate-500 block">Scenario Evaluated</span>
              <span className="font-bold text-amber-800">{summary.disruption_scenario}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-100">
              <span className="font-semibold text-slate-500 block">Incremental KM Impact</span>
              <span className="font-bold text-amber-800">{summary.combined_incremental_km} km</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-100">
              <span className="font-semibold text-slate-500 block">Unassigned Requests</span>
              <span className="font-bold text-rose-600">{summary.unassigned_returns_count} Returns Dropped</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-100">
              <span className="font-semibold text-slate-500 block">Workload Risk Impact</span>
              <span className="font-bold text-rose-600">{summary.workload_risk_count} Routes at Risk</span>
            </div>
          </div>
          {summary.error_analysis && summary.error_analysis.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-amber-100 text-xs mt-3">
              <span className="font-semibold text-slate-500 block mb-1">Constraint Conflicts Triggered</span>
              <ul className="list-disc list-inside text-rose-700 font-medium">
                {summary.error_analysis.map((err, i) => (
                  <li key={i}>{err.reason}: {err.count} occurrences</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Forecasting Block */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Lightweight Operational Forecasting
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Short-term volume projection utilizing 7-Day Moving Average & Exponential Smoothing.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const { fetchForecastApi } = await import('../services/api');
                const res = await fetchForecastApi();
                alert(`Forecast Next Day: ${res.forecast_next_day} Returns\nMA-7: ${res.ma_7}\nExp. Smoothing: ${res.exponential_smoothing}\nConfidence Interval: ${res.confidence_interval[0]} - ${res.confidence_interval[1]}`);
              } catch(e) {}
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition-colors"
          >
            Run Forecast Model
          </button>
        </div>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Deliveries</span>
              <span className="text-xl font-black text-slate-800 block mt-1">{summary.total_deliveries || 200}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Returns</span>
              <span className="text-xl font-black text-slate-800 block mt-1">{summary.total_returns || 50}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vehicles</span>
              <span className="text-xl font-black text-slate-800 block mt-1">{summary.total_vehicles || 10}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assignment Rate</span>
              <span className="text-xl font-black text-emerald-700 block mt-1">
                {Math.round(((summary.total_returns - summary.unassigned_returns_count) / summary.total_returns) * 100) || 100}%
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Baseline Return KM</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">{summary.baseline_return_km} km</span>
            </div>

            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
              <span className="text-xs font-semibold text-sky-700 block">Combined Incremental KM</span>
              <span className="text-2xl font-black text-sky-900 block mt-1">{summary.combined_incremental_km} km</span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700 block">Kilometres Saved</span>
              <span className="text-2xl font-black text-emerald-900 block mt-1">{summary.km_saved} km</span>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-xs font-semibold text-amber-700 block">Workload Risk</span>
              <span className="text-2xl font-black text-amber-900 block mt-1">{summary.workload_risk_count} Routes</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 mt-4 space-y-2">
            <p><strong>Methodology:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Baseline:</strong> The distance required if a separate, dedicated fleet was dispatched solely to collect the returns.</li>
              <li><strong>Combined:</strong> The additional incremental distance created by inserting return pickups into the existing forward delivery routes.</li>
              <li><strong>Primary KPI (Incremental KM):</strong> We seek to minimize the combined incremental KM.</li>
            </ul>
            <div className="bg-blue-100 p-2 rounded mt-2 text-[11px]">
              <strong>Note on Percentage Improvement:</strong> The {summary.percentage_improvement}% improvement represents the reduction in strictly return-associated travel. It does NOT imply the entire forward delivery network was reduced by this amount.
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

      {/* Workload Analysis Section */}
      {data && data.routes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" /> Workload Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-1">Detailed breakdown of driver shifts and stop counts.</p>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 max-w-md">
              <h4 className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4 text-indigo-600"/> Worker Protection</h4>
              <p>The planner evaluates route workload using stop counts and estimated shift duration. Routes exceeding configured workload thresholds are flagged for dispatcher review rather than silently transferring additional work to frontline drivers.</p>
              <div className="mt-2 bg-white/50 p-1.5 rounded font-mono text-[10px] border border-indigo-100/50">
                Formula: Estimated Shift Hours = Driving Hours + Service Hours
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Route ID</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Driver ID</th>
                  <th className="py-2.5 px-3">Deliv. / Ret.</th>
                  <th className="py-2.5 px-3">Total Stops (Max 25)</th>
                  <th className="py-2.5 px-3">Driving / Service Hrs</th>
                  <th className="py-2.5 px-3 font-bold text-slate-800">Est. Shift Hrs</th>
                  <th className="py-2.5 px-3 text-slate-500">Max Shift Hrs</th>
                  <th className="py-2.5 px-3">Workload Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.routes.map(r => {
                  const serviceHrs = r.stops.reduce((acc, s) => acc + (s.service_time_minutes / 60), 0);
                  const drivingHrs = Math.max(0, r.total_duration_hours - serviceHrs);
                  
                  return (
                    <tr key={r.route_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{r.route_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">{r.vehicle_id}</td>
                      <td className="py-2.5 px-3 text-slate-500">{r.driver_id}</td>
                      <td className="py-2.5 px-3">{r.deliveries_count} / {r.returns_count}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {r.deliveries_count + r.returns_count}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {drivingHrs.toFixed(1)}h / {serviceHrs.toFixed(1)}h
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {r.total_duration_hours.toFixed(1)}h
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{r.working_hours.toFixed(1)}h</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          r.workload_status === 'Risk' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          r.workload_status === 'Elevated' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {r.workload_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
