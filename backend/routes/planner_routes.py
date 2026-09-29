from fastapi import APIRouter, Response, HTTPException, Query
from typing import List, Dict, Optional
import os
import pandas as pd

from backend.services.baseline import calculate_baseline
from backend.services.optimizer import run_combined_optimization
from backend.services.benchmark import run_performance_experiments
from backend.services.exporter import export_routes_csv, export_returns_csv, export_benchmark_csv

from backend.models.schemas import OverrideRequest
from datetime import datetime

router = APIRouter(prefix="/api")

overrides_store: Dict[str, OverrideRequest] = {}
audit_log: List[Dict] = []

@router.post("/override")
def submit_override(req: OverrideRequest):
    overrides_store[req.return_id] = req
    audit_log.append({
        "timestamp": datetime.now().isoformat(),
        "user_id": req.user_id,
        "action": "FORCE_ASSIGNMENT",
        "return_id": req.return_id,
        "route_id": req.route_id,
        "reason": req.reason,
        "previous_status": "BLOCKED",
        "new_status": "WARNING (Override)"
    })
    return {"status": "success", "message": "Override applied."}

@router.get("/audit-log")
def get_audit_log():
    return {"audit_log": audit_log}

@router.post("/override/clear")
def clear_overrides():
    overrides_store.clear()
    return {"status": "success"}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

def load_csv_data():
    deliv_path = os.path.join(DATA_DIR, "deliveries.csv")
    ret_path = os.path.join(DATA_DIR, "returns.csv")
    veh_path = os.path.join(DATA_DIR, "vehicles.csv")
    
    if not (os.path.exists(deliv_path) and os.path.exists(ret_path) and os.path.exists(veh_path)):
        raise HTTPException(status_code=404, detail="Dataset files not found. Run dataset_generator.py first.")
        
    deliveries = pd.read_csv(deliv_path).to_dict(orient="records")
    returns = pd.read_csv(ret_path).to_dict(orient="records")
    vehicles = pd.read_csv(veh_path).to_dict(orient="records")
    
    return deliveries, returns, vehicles

@router.get("/dataset")
def get_dataset_summary():
    deliveries, returns, vehicles = load_csv_data()
    return {
        "status": "Demo Dataset Ready",
        "deliveries_count": len(deliveries),
        "returns_count": len(returns),
        "vehicles_count": len(vehicles),
        "depot": {"latitude": 13.0827, "longitude": 80.2707, "name": "Central Chennai Electronics Depot"}
    }

@router.get("/deliveries")
def get_deliveries():
    deliveries, _, _ = load_csv_data()
    return deliveries

@router.get("/returns")
def get_returns():
    _, returns, _ = load_csv_data()
    return returns

@router.get("/vehicles")
def get_vehicles():
    _, _, vehicles = load_csv_data()
    return vehicles

@router.post("/run-baseline")
def run_baseline_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    res = calculate_baseline(deliveries, returns, vehicles)
    return res

from backend.models.schemas import OptimizationRequest

@router.post("/run-combined")
def run_combined_endpoint(req: Optional[OptimizationRequest] = None):
    deliveries, returns, vehicles = load_csv_data()
    workload_config_dict = req.workload_config.dict() if req and req.workload_config else None
    objective_weights_dict = req.objective_weights.dict() if req and req.objective_weights else None
    
    if req and req.disruption_scenario:
        scenario = req.disruption_scenario
        if scenario == "Traffic Delay":
            # Just simulated as an effect on optimizer? Wait, travel_time_minutes in optimizer uses 30km/h. We'd have to pass a speed factor, or just increase service times.
            # Let's increase all service times by 5 minutes.
            for d in deliveries: d["service_time_minutes"] += 5
            for r in returns: r["service_time_minutes"] += 5
        elif scenario == "Vehicle Capacity Loss":
            # Reduce all vehicle capacities by 25%
            for v in vehicles:
                v["weight_capacity_kg"] = float(v["weight_capacity_kg"]) * 0.75
                v["volume_capacity_m3"] = float(v["volume_capacity_m3"]) * 0.75
        elif scenario == "Vehicle Breakdown":
            # Mark V01 as Unavailable
            if vehicles:
                vehicles[0]["availability"] = "Unavailable"
        elif scenario == "Urgent Return Request":
            # Add an extra urgent return
            returns.append({
                "return_id": "RET-URGENT",
                "customer_id": "CUST-999",
                "latitude": 13.0450,
                "longitude": 80.2000,
                "item_type": "Washing Machine",
                "item_size": "Extra Large",
                "item_weight_kg": 65.0,
                "return_type": "Warranty",
                "priority": "Urgent",
                "pickup_time_start": "09:00",
                "pickup_time_end": "12:00",
                "service_time_minutes": 20
            })
    
    # Run Baseline
    base_res = calculate_baseline(deliveries, returns, vehicles)
    
    # Run Optimizer
    formatted_routes, processed_returns, _ = run_combined_optimization(
        deliveries, returns, vehicles, 
        workload_config=workload_config_dict,
        objective_weights=objective_weights_dict,
        manual_overrides=overrides_store
    )
    
    baseline_return_km = base_res["separate_return_km"]
    combined_inc_km = round(sum(r["incremental_km"] for r in formatted_routes), 2)
    km_saved = round(max(0.0, baseline_return_km - combined_inc_km), 2)
    percentage_improvement = round((km_saved / baseline_return_km * 100.0) if baseline_return_km > 0 else 0.0, 1)
    
    assigned_count = sum(1 for ret in processed_returns if ret["status"] == "Assigned")
    unassigned_count = sum(1 for ret in processed_returns if ret["status"] != "Assigned")
    
    # Time window compliance pct across assigned returns and delivery stops
    all_stops = [stop for r in formatted_routes for stop in r["stops"]]
    tw_compliant = sum(1 for s in all_stops if s["status"] == "Feasible")
    tw_compliance_pct = round((tw_compliant / len(all_stops) * 100.0) if all_stops else 100.0, 1)
    
    avg_weight_util = round(sum(r["weight_utilization_pct"] for r in formatted_routes) / len(formatted_routes), 1)
    avg_volume_util = round(sum(r["volume_utilization_pct"] for r in formatted_routes) / len(formatted_routes), 1)
    
    workload_risk_count = sum(1 for r in formatted_routes if r["workload_status"] == "Risk")
    
    # Error analysis summary
    error_reasons = {}
    for ret in processed_returns:
        if ret["status"] != "Assigned":
            reason = ret.get("blocked_reason") or "No feasible route"
            error_reasons[reason] = error_reasons.get(reason, 0) + 1
            
    error_analysis = [{"reason": k, "count": v} for k, v in error_reasons.items()]
    
    summary = {
        "total_deliveries": len(deliveries),
        "total_returns": len(returns),
        "total_vehicles": len(vehicles),
        "baseline_return_km": baseline_return_km,
        "combined_incremental_km": combined_inc_km,
        "km_saved": km_saved,
        "percentage_improvement": percentage_improvement,
        "assigned_returns_count": assigned_count,
        "unassigned_returns_count": unassigned_count,
        "time_window_compliance_pct": tw_compliance_pct,
        "avg_weight_utilization_pct": avg_weight_util,
        "avg_volume_utilization_pct": avg_volume_util,
        "workload_risk_count": workload_risk_count,
        "status": f"FEASIBLE WITH {unassigned_count} UNASSIGNED RETURNS" if unassigned_count > 0 else "FULLY FEASIBLE",
        "error_analysis": error_analysis,
        "disruption_scenario": req.disruption_scenario if req and req.disruption_scenario else None
    }
    
    return {
        "summary": summary,
        "routes": formatted_routes,
        "returns": processed_returns
    }

_benchmark_cache = None
_pareto_cache = None

@router.get("/benchmark")
def get_benchmark_endpoint():
    global _benchmark_cache
    if _benchmark_cache is not None:
        return {"experiments": _benchmark_cache}
    
    deliveries, returns, vehicles = load_csv_data()
    experiments = run_performance_experiments(deliveries, returns, vehicles)
    _benchmark_cache = experiments
    return {"experiments": experiments}

@router.get("/pareto")
def get_pareto_endpoint():
    global _pareto_cache
    if _pareto_cache is not None:
        return {"pareto_points": _pareto_cache}
        
    deliveries, returns, vehicles = load_csv_data()
    weights = [
        {"alpha_km": 1.0, "beta_workload": 0.0, "label": "Min Distance"},
        {"alpha_km": 0.75, "beta_workload": 0.25, "label": "Distance Focus"},
        {"alpha_km": 0.50, "beta_workload": 0.50, "label": "Balanced"},
        {"alpha_km": 0.25, "beta_workload": 0.75, "label": "Workload Focus"},
        {"alpha_km": 0.0, "beta_workload": 1.0, "label": "Min Workload"}
    ]
    
    results = []
    for w in weights:
        routes, processed_returns, _ = run_combined_optimization(
            deliveries, returns, vehicles, objective_weights=w
        )
        
        combined_inc_km = round(sum(r["incremental_km"] for r in routes), 2)
        avg_workload = round(sum(r["total_duration_hours"] / r["working_hours"] * 100 for r in routes) / len(routes), 1) if routes else 0.0
        max_workload = round(max((r["total_duration_hours"] / r["working_hours"] * 100 for r in routes), default=0.0), 1)
        
        results.append({
            "label": w["label"],
            "alpha_km": w["alpha_km"],
            "beta_workload": w["beta_workload"],
            "incremental_km": combined_inc_km,
            "avg_workload_pct": avg_workload,
            "max_workload_pct": max_workload,
            "assignment_rate": round(sum(1 for ret in processed_returns if ret["status"] == "Assigned") / len(returns) * 100, 1) if returns else 0.0
        })
        
    _pareto_cache = results
    return {"pareto_points": results}

from backend.services.forecasting import forecast_return_volume

@router.get("/forecast")
def run_forecast_endpoint():
    return forecast_return_volume()

@router.get("/benchmark")
def run_benchmark_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    results = run_performance_experiments(deliveries, returns, vehicles)
    return {"experiments": results}

@router.get("/export/routes")
def export_routes_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    formatted_routes, _, _ = run_combined_optimization(deliveries, returns, vehicles)
    csv_data = export_routes_csv(formatted_routes)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=routes_plan.csv"})

@router.get("/export/returns")
def export_returns_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    _, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    csv_data = export_returns_csv(processed_returns)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=returns_assignments.csv"})

@router.get("/export/benchmark")
def export_benchmark_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    base_res = calculate_baseline(deliveries, returns, vehicles)
    formatted_routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    
    baseline_return_km = base_res["separate_return_km"]
    combined_inc_km = round(sum(r["incremental_km"] for r in formatted_routes), 2)
    km_saved = round(max(0.0, baseline_return_km - combined_inc_km), 2)
    percentage_improvement = round((km_saved / baseline_return_km * 100.0) if baseline_return_km > 0 else 0.0, 1)
    assigned_count = sum(1 for ret in processed_returns if ret["status"] == "Assigned")
    assign_rate = round((assigned_count / len(returns) * 100.0) if returns else 0.0, 1)
    
    summary = {
        "baseline_return_km": baseline_return_km,
        "combined_incremental_km": combined_inc_km,
        "km_saved": km_saved,
        "percentage_improvement": percentage_improvement,
        "assignment_rate_pct": assign_rate
    }
    
    experiments = run_performance_experiments(deliveries, returns, vehicles)
    csv_data = export_benchmark_csv(summary, experiments)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=benchmark_report.csv"})
