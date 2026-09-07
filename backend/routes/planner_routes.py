from fastapi import APIRouter, Response, HTTPException, Query
from typing import List, Dict, Optional
import os
import pandas as pd

from backend.services.baseline import calculate_baseline
from backend.services.optimizer import run_combined_optimization
from backend.services.benchmark import run_performance_experiments
from backend.services.exporter import export_routes_csv, export_returns_csv, export_benchmark_csv

router = APIRouter(prefix="/api")

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

@router.post("/run-combined")
def run_combined_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    
    # Run Baseline
    base_res = calculate_baseline(deliveries, returns, vehicles)
    
    # Run Optimizer
    formatted_routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    
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
        "error_analysis": error_analysis
    }
    
    return {
        "summary": summary,
        "routes": formatted_routes,
        "returns": processed_returns
    }

@router.get("/benchmark")
def get_benchmark_endpoint():
    deliveries, returns, vehicles = load_csv_data()
    experiments = run_performance_experiments(deliveries, returns, vehicles)
    return {"experiments": experiments}

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
