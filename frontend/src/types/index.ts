export interface WorkloadConfig {
  max_stops?: number;
  normal_threshold_pct?: number;
  elevated_threshold_pct?: number;
}

export interface ObjectiveWeights {
  alpha_km?: number;
  beta_workload?: number;
}

export interface OptimizationRequest {
  workload_config?: WorkloadConfig;
  objective_weights?: ObjectiveWeights;
}

export interface DeliveryItem {
  delivery_id: string;
  route_id: string;
  customer_id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  item_type: string;
  item_size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  item_weight_kg: number;
  delivery_time_start: string;
  delivery_time_end: string;
  service_time_minutes: number;
  priority: 'Normal' | 'High' | 'Urgent';
  sequence: number;
}

export interface ReturnItem {
  return_id: string;
  customer_id: string;
  latitude: number;
  longitude: number;
  item_type: string;
  item_size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  item_weight_kg: number;
  return_type: 'Warranty' | 'Customer Return' | 'Damaged item' | 'Replacement pickup' | 'Repair collection';
  priority: 'Normal' | 'High' | 'Urgent';
  pickup_time_start: string;
  pickup_time_end: string;
  service_time_minutes: number;
  status: 'Assigned' | 'Unassigned' | 'BLOCKED' | 'Feasible';
  assigned_route_id?: string | null;
  insertion_sequence?: number | null;
  incremental_km?: number | null;
  blocked_reason?: string | null;
}

export interface VehicleItem {
  vehicle_id: string;
  driver_id: string;
  weight_capacity_kg: number;
  volume_capacity_m3: number;
  working_hours: number;
  start_depot: string;
  end_depot: string;
  availability: 'Available' | 'Unavailable';
}

export interface RouteStop {
  stop_id: string;
  stop_type: 'DEPOT' | 'DELIVERY' | 'RETURN';
  customer_id?: string;
  latitude: number;
  longitude: number;
  item_type?: string;
  item_size?: string;
  item_weight_kg?: number;
  item_volume_m3?: number;
  time_window_start?: string;
  time_window_end?: string;
  delivery_time_start?: string;
  delivery_time_end?: string;
  pickup_time_start?: string;
  pickup_time_end?: string;
  estimated_arrival?: string;
  service_time_minutes: number;
  sequence: number;
  status: string;
}

export interface RouteDetail {
  route_id: string;
  vehicle_id: string;
  driver_id: string;
  working_hours: number;
  deliveries_count: number;
  returns_count: number;
  original_distance_km: number;
  combined_distance_km: number;
  incremental_km: number;
  total_weight_kg: number;
  weight_capacity_kg: number;
  weight_utilization_pct: number;
  total_volume_m3: number;
  volume_capacity_m3: number;
  volume_utilization_pct: number;
  total_duration_hours: number;
  workload_status: 'Normal' | 'Elevated' | 'Risk';
  status: 'FEASIBLE' | 'WARNING' | 'BLOCKED';
  stops: RouteStop[];
}

export interface ErrorReason {
  reason: string;
  count: number;
}

export interface OptimizationSummary {
  total_deliveries: number;
  total_returns: number;
  total_vehicles: number;
  baseline_return_km: number;
  combined_incremental_km: number;
  km_saved: number;
  percentage_improvement: number;
  assigned_returns_count: number;
  unassigned_returns_count: number;
  time_window_compliance_pct: number;
  avg_weight_utilization_pct: number;
  avg_volume_utilization_pct: number;
  workload_risk_count: number;
  status: string;
  error_analysis: ErrorReason[];
  disruption_scenario?: string;
}

export interface ExperimentScenarioResult {
  scenario: string;
  total_deliveries: number;
  returns_count: number;
  baseline_return_km: number;
  combined_incremental_km: number;
  km_saved: number;
  improvement_pct: number;
  assignment_rate_pct: number;
  runtime_ms: number;
}

export interface CombinedPlanResponse {
  summary: OptimizationSummary;
  routes: RouteDetail[];
  returns: ReturnItem[];
}
