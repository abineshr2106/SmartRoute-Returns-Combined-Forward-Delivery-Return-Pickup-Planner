import {
  CombinedPlanResponse,
  DeliveryItem,
  ReturnItem,
  VehicleItem,
  ExperimentScenarioResult,
  OptimizationRequest
} from '../types';

const API_BASE = '/api';

export async function fetchDatasetSummary() {
  try {
    const res = await fetch(`${API_BASE}/dataset`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return {
      status: "Demo Dataset Ready",
      deliveries_count: 200,
      returns_count: 50,
      vehicles_count: 10,
      depot: { latitude: 13.0827, longitude: 80.2707, name: "Central Chennai Electronics Depot" }
    };
  }
}

export async function fetchDeliveries(): Promise<DeliveryItem[]> {
  const res = await fetch(`${API_BASE}/deliveries`);
  if (!res.ok) throw new Error('Failed to fetch deliveries');
  return await res.json();
}

export async function fetchReturns(): Promise<ReturnItem[]> {
  const res = await fetch(`${API_BASE}/returns`);
  if (!res.ok) throw new Error('Failed to fetch returns');
  return await res.json();
}

export async function fetchVehicles(): Promise<VehicleItem[]> {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return await res.json();
}

export async function runBaselineApi() {
  const res = await fetch(`${API_BASE}/run-baseline`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run baseline');
  return await res.json();
}

export async function runCombinedPlannerApi(config?: OptimizationRequest): Promise<CombinedPlanResponse> {
  const res = await fetch(`${API_BASE}/run-combined`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: config ? JSON.stringify(config) : undefined
  });
  if (!res.ok) throw new Error('Failed to run combined planner');
  return await res.json();
}

export async function fetchBenchmarkApi(): Promise<{ experiments: ExperimentScenarioResult[] }> {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch benchmark');
  return await res.json();
}

export async function fetchParetoApi() {
  const res = await fetch(`${API_BASE}/pareto`);
  if (!res.ok) throw new Error('Failed to fetch pareto');
  return await res.json();
}

export async function submitOverrideApi(req: { return_id: string, route_id: string, reason: string, user_id: string }) {
  const res = await fetch(`${API_BASE}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error('Failed to submit override');
  return await res.json();
}

export async function fetchAuditLogApi() {
  const res = await fetch(`${API_BASE}/audit-log`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return await res.json();
}

export async function fetchForecastApi() {
  const res = await fetch(`${API_BASE}/forecast`);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return await res.json();
}

export function getExportUrl(type: 'routes' | 'returns' | 'benchmark'): string {
  return `${API_BASE}/export/${type}`;
}
