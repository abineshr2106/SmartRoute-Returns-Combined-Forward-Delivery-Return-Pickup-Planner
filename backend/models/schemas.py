from typing import List, Optional
from pydantic import BaseModel

class WorkloadConfig(BaseModel):
    max_stops: int = 25
    normal_threshold_pct: float = 80.0
    elevated_threshold_pct: float = 95.0

class ObjectiveWeights(BaseModel):
    alpha_km: float = 1.0
    beta_workload: float = 0.0

class OverrideRequest(BaseModel):
    return_id: str
    route_id: str
    reason: str
    user_id: str

class OptimizationRequest(BaseModel):
    workload_config: Optional[WorkloadConfig] = None
    objective_weights: Optional[ObjectiveWeights] = None
    manual_overrides: Optional[List[OverrideRequest]] = None
    disruption_scenario: Optional[str] = None

class DeliveryItem(BaseModel):
    delivery_id: str
    route_id: str
    customer_id: str
    vehicle_id: str
    latitude: float
    longitude: float
    item_type: str
    item_size: str
    item_weight_kg: float
    delivery_time_start: str
    delivery_time_end: str
    service_time_minutes: int
    priority: str
    sequence: int

class ReturnItem(BaseModel):
    return_id: str
    customer_id: str
    latitude: float
    longitude: float
    item_type: str
    item_size: str
    item_weight_kg: float
    return_type: str
    priority: str
    pickup_time_start: str
    pickup_time_end: str
    service_time_minutes: int
    status: str = "Unassigned"
    assigned_route_id: Optional[str] = None
    insertion_sequence: Optional[int] = None
    incremental_km: Optional[float] = None
    blocked_reason: Optional[str] = None

class VehicleItem(BaseModel):
    vehicle_id: str
    driver_id: str
    weight_capacity_kg: float
    volume_capacity_m3: float
    working_hours: float
    start_depot: str
    end_depot: str
    availability: str

class RouteStop(BaseModel):
    stop_id: str
    stop_type: str  # "DEPOT", "DELIVERY", "RETURN"
    customer_id: Optional[str] = None
    latitude: float
    longitude: float
    item_type: Optional[str] = None
    item_size: Optional[str] = None
    item_weight_kg: Optional[float] = None
    item_volume_m3: Optional[float] = None
    time_window_start: Optional[str] = None
    time_window_end: Optional[str] = None
    estimated_arrival: Optional[str] = None
    service_time_minutes: int = 10
    sequence: int
    status: str = "Feasible"

class RouteDetail(BaseModel):
    route_id: str
    vehicle_id: str
    driver_id: str
    working_hours: float
    deliveries_count: int
    returns_count: int
    original_distance_km: float
    combined_distance_km: float
    incremental_km: float
    total_weight_kg: float
    weight_capacity_kg: float
    weight_utilization_pct: float
    total_volume_m3: float
    volume_capacity_m3: float
    volume_utilization_pct: float
    total_duration_hours: float
    workload_status: str  # "Normal" (0-80%), "Elevated" (80-95%), "Risk" (>95%)
    status: str  # "FEASIBLE", "WARNING", "BLOCKED"
    stops: List[RouteStop]

class BaselineSummary(BaseModel):
    forward_delivery_km: float
    separate_return_km: float
    baseline_total_km: float

class OptimizationSummary(BaseModel):
    total_deliveries: int
    total_returns: int
    total_vehicles: int
    baseline_return_km: float
    combined_incremental_km: float
    km_saved: float
    percentage_improvement: float
    assigned_returns_count: int
    unassigned_returns_count: int
    time_window_compliance_pct: float
    avg_weight_utilization_pct: float
    avg_volume_utilization_pct: float
    workload_risk_count: int
    status: str
    error_analysis: List[dict]
    disruption_scenario: Optional[str] = None

class ExperimentScenarioResult(BaseModel):
    scenario: str
    total_deliveries: int
    returns_count: int
    baseline_return_km: float
    combined_incremental_km: float
    km_saved: float
    improvement_pct: float
    assignment_rate_pct: float
    runtime_ms: float
