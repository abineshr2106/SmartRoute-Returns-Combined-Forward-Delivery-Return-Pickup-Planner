import React from 'react';
import { Truck, RefreshCw, Play, Zap, FileSpreadsheet, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'planner' | 'returns' | 'benchmark';
  setActiveTab: (tab: 'dashboard' | 'planner' | 'returns' | 'benchmark') => void;
  datasetLoaded: boolean;
  baselineRun: boolean;
  plannerRun: boolean;
  loading: boolean;
  onLoadData: () => void;
  onRunBaseline: () => void;
  onRunPlanner: () => void;
  optimizationMode: 'distance' | 'workload' | 'balanced';
  setOptimizationMode: (mode: 'distance' | 'workload' | 'balanced') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  datasetLoaded,
  baselineRun,
  plannerRun,
  loading,
  onLoadData,
  onRunBaseline,
  onRunPlanner,
  optimizationMode,
  setOptimizationMode,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">SMARTROUTE</span>
                <span className="bg-sky-500/20 text-sky-400 text-xs font-semibold px-2 py-0.5 rounded border border-sky-500/30 uppercase tracking-wide">
                  RETURNS
                </span>
                <span className="invisible text-xs font-medium px-2 py-0.5 rounded border border-transparent">
                  Final Review | 100% Complete
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Combined Forward Delivery + Return Pickup Planner
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'planner'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Route Planner
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'returns'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Return Requests
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Benchmark
            </button>
          </nav>

          {/* Action Buttons Workflow */}
          <div className="flex items-center space-x-2">
            {!datasetLoaded ? (
              <button
                onClick={onLoadData}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>LOAD DEMO DATA</span>
              </button>
            ) : !baselineRun ? (
              <button
                onClick={onRunBaseline}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>RUN BASELINE</span>
              </button>
            ) : (
              <>
                <select
                  value={optimizationMode}
                  onChange={(e) => setOptimizationMode(e.target.value as 'distance' | 'workload' | 'balanced')}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2 transition-all cursor-pointer"
                  title="Distance weight (Alpha) + Workload weight (Beta) = 1.0"
                >
                  <option value="distance">Distance Priority (α=1.0, β=0.0)</option>
                  <option value="balanced">Balanced Priority (α=0.5, β=0.5)</option>
                  <option value="workload">Workload Priority (α=0.0, β=1.0)</option>
                </select>
                <button
                  onClick={onRunPlanner}
                  disabled={loading}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-sky-500/20 transition-all"
                >
                  <Zap className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>RUN COMBINED PLANNER</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
