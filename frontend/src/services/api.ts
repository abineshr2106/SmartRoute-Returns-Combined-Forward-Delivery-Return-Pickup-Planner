import {
  CombinedPlanResponse,
  DeliveryItem,
  ReturnItem,
  VehicleItem,
  ExperimentScenarioResult
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
      returns_count: 30,
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

export async function runCombinedPlannerApi(): Promise<CombinedPlanResponse> {
  const res = await fetch(`${API_BASE}/run-combined`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run combined planner');
  return await res.json();
}

export async function fetchBenchmarkApi(): Promise<{ experiments: ExperimentScenarioResult[] }> {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch benchmark');
  return await res.json();
}

export function getExportUrl(type: 'routes' | 'returns' | 'benchmark'): string {
  return `${API_BASE}/export/${type}`;
}
