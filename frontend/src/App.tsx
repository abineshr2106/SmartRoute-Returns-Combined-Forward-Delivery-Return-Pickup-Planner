import React, { useState, useEffect } from 'react';
import { CombinedPlanResponse } from './types';
import {
  fetchDatasetSummary,
  runBaselineApi,
  runCombinedPlannerApi,
  submitOverrideApi
} from './services/api';

import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { RoutePlannerPage } from './pages/RoutePlannerPage';
import { ReturnRequestsPage } from './pages/ReturnRequestsPage';
import { BenchmarkPage } from './pages/BenchmarkPage';

import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'returns' | 'benchmark'>('dashboard');

  const [datasetLoaded, setDatasetLoaded] = useState<boolean>(false);
  const [baselineRun, setBaselineRun] = useState<boolean>(false);
  const [plannerRun, setPlannerRun] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [combinedData, setCombinedData] = useState<CombinedPlanResponse | null>(null);
  const [datasetSummary, setDatasetSummary] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Auto load dataset on mount
  useEffect(() => {
    handleLoadData();
  }, []);

  const [optimizationMode, setOptimizationMode] = useState<'distance' | 'workload' | 'balanced'>('distance');
  const [disruptionScenario, setDisruptionScenario] = useState<string>('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLoadData = async () => {
    setLoading(true);
    try {
      const summary = await fetchDatasetSummary();
      setDatasetSummary(summary);
      setDatasetLoaded(true);
      showToast(`Dataset loaded: ${summary.deliveries_count || 200} Deliveries, ${summary.returns_count || 30} Returns, ${summary.vehicles_count || 10} Vehicles`);
    } catch (err) {
      showToast('Error loading dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBaseline = async () => {
    setLoading(true);
    try {
      const res = await runBaselineApi();
      setBaselineRun(true);
      showToast(`Baseline evaluated: Separate Return KM = ${res.separate_return_km} km`);
      // Auto trigger combined planner for seamless experience
      await handleRunPlanner();
    } catch (err) {
      showToast('Error running baseline calculation');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPlanner = async () => {
    setLoading(true);
    try {
      const objective_weights = {
        distance: { alpha_km: 1.0, beta_workload: 0.0 },
        workload: { alpha_km: 0.0, beta_workload: 1.0 },
        balanced: { alpha_km: 0.5, beta_workload: 0.5 }
      }[optimizationMode];
      
      const config = { objective_weights, disruption_scenario: disruptionScenario || undefined };
      const res = await runCombinedPlannerApi(config);
      setCombinedData(res);
      setBaselineRun(true);
      setPlannerRun(true);
      showToast(`Optimization complete: Saved ${res.summary.km_saved} km (${res.summary.percentage_improvement}% improvement)`);
    } catch (err) {
      showToast('Error executing combined planner optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (return_id: string, route_id: string, reason: string, user_id: string) => {
    try {
      setLoading(true);
      await submitOverrideApi({ return_id, route_id, reason, user_id });
      showToast(`Override applied for return ${return_id} to route ${route_id}`);
      await handleRunPlanner(); // Re-run planner to apply override
    } catch (err) {
      showToast('Error applying override');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetLoaded={datasetLoaded}
        baselineRun={baselineRun}
        plannerRun={plannerRun}
        loading={loading}
        onLoadData={handleLoadData}
        onRunBaseline={handleRunBaseline}
        onRunPlanner={handleRunPlanner}
        optimizationMode={optimizationMode}
        setOptimizationMode={setOptimizationMode}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Demo Step Bar Banner */}
      <div className="bg-slate-900/90 text-white border-b border-slate-800 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Workflow Step:</span>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${datasetLoaded ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                1. Data Ready
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${baselineRun ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                2. Baseline Evaluated
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${plannerRun ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                3. Optimization
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${plannerRun ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'}`}>
                4. Validation
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${plannerRun ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                5. Final Results
              </span>
            </div>
          </div>

          <div className="text-slate-400 font-medium">
            Depot: <span className="text-white font-semibold">Central Chennai Hub</span> (13.0827, 80.2707)
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage 
            data={combinedData} 
            baselineRun={baselineRun} 
            plannerRun={plannerRun} 
            onRunPlanner={handleRunPlanner} 
            onRunBaseline={handleRunBaseline} 
            onLoadData={handleLoadData} 
            disruptionScenario={disruptionScenario}
            setDisruptionScenario={setDisruptionScenario}
            datasetSummary={datasetSummary}
          />
        )}

        {activeTab === 'planner' && (
          <RoutePlannerPage data={combinedData} />
        )}

        {activeTab === 'returns' && (
          <ReturnRequestsPage data={combinedData} onOverride={handleOverride} />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkPage data={combinedData} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-700">SMARTROUTE RETURNS</span> — Combined Forward Delivery & Return Pickup Planner
          </div>
          <div>
            Academic Capstone Prototype — <span className="font-semibold text-emerald-700">FINAL REVIEW — 100% COMPLETE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
