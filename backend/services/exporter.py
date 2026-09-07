import io
import csv
from typing import List, Dict

def export_routes_csv(routes: List[Dict]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Route ID", "Vehicle ID", "Driver ID", "Deliveries Count", "Returns Count",
        "Original KM", "Combined KM", "Incremental KM", "Total Weight (kg)",
        "Weight Util %", "Total Volume (m3)", "Volume Util %", "Duration (hrs)", "Workload Status", "Status"
    ])
    for r in routes:
        writer.writerow([
            r["route_id"], r["vehicle_id"], r["driver_id"], r["deliveries_count"], r["returns_count"],
            r["original_distance_km"], r["combined_distance_km"], r["incremental_km"], r["total_weight_kg"],
            r["weight_utilization_pct"], r["total_volume_m3"], r["volume_utilization_pct"], r["total_duration_hours"],
            r["workload_status"], r["status"]
        ])
    return output.getvalue()

def export_returns_csv(returns: List[Dict]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Return ID", "Customer ID", "Item Type", "Item Size", "Weight (kg)",
        "Return Type", "Priority", "Pickup Start", "Pickup End", "Status",
        "Assigned Route", "Insertion Seq", "Incremental KM", "Blocked Reason"
    ])
    for ret in returns:
        writer.writerow([
            ret["return_id"], ret["customer_id"], ret["item_type"], ret["item_size"], ret["item_weight_kg"],
            ret["return_type"], ret["priority"], ret["pickup_time_start"], ret["pickup_time_end"], ret["status"],
            ret.get("assigned_route_id") or "Unassigned", ret.get("insertion_sequence") or "-",
            ret.get("incremental_km") or 0.0, ret.get("blocked_reason") or "-"
        ])
    return output.getvalue()

def export_benchmark_csv(benchmark_summary: Dict, experiments: List[Dict]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["SMARTROUTE RETURNS - BENCHMARK & EXPERIMENT REPORT"])
    writer.writerow([])
    writer.writerow(["PRIMARY KPI BENCHMARK"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Baseline Return Collection KM", benchmark_summary.get("baseline_return_km", 0)])
    writer.writerow(["Combined Incremental KM", benchmark_summary.get("combined_incremental_km", 0)])
    writer.writerow(["KM Saved", benchmark_summary.get("km_saved", 0)])
    writer.writerow(["Percentage Improvement", f"{benchmark_summary.get('percentage_improvement', 0)}%"])
    writer.writerow(["Return Pickup Assignment Rate", f"{benchmark_summary.get('assignment_rate_pct', 0)}%"])
    writer.writerow([])
    writer.writerow(["PERFORMANCE EXPERIMENT SCENARIOS"])
    writer.writerow(["Scenario", "Deliveries", "Returns", "Baseline Return KM", "Combined Inc KM", "KM Saved", "Improvement %", "Assignment Rate %", "Runtime (ms)"])
    for exp in experiments:
        writer.writerow([
            exp["scenario"], exp["total_deliveries"], exp["returns_count"], exp["baseline_return_km"],
            exp["combined_incremental_km"], exp["km_saved"], f"{exp['improvement_pct']}%",
            f"{exp['assignment_rate_pct']}%", exp["runtime_ms"]
        ])
    return output.getvalue()
