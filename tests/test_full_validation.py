import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import os
import json
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.baseline import calculate_baseline
from backend.services.optimizer import run_combined_optimization, VOLUME_MAP, get_item_volume
from backend.services.exporter import export_routes_csv, export_returns_csv, export_benchmark_csv

client = TestClient(app)

def test_1_demo_data_loading():
    response = client.get("/api/dataset")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveries_count"] == 200
    assert data["returns_count"] == 50
    assert data["vehicles_count"] == 10

    deliv_resp = client.get("/api/deliveries")
    assert deliv_resp.status_code == 200
    assert len(deliv_resp.json()) == 200

    ret_resp = client.get("/api/returns")
    assert ret_resp.status_code == 200
    assert len(ret_resp.json()) == 50

    veh_resp = client.get("/api/vehicles")
    assert veh_resp.status_code == 200
    assert len(veh_resp.json()) == 10

def test_2_baseline_calculation():
    response = client.post("/api/run-baseline")
    assert response.status_code == 200
    data = response.json()
    assert "forward_delivery_km" in data
    assert "separate_return_km" in data
    assert "baseline_total_km" in data
    assert data["forward_delivery_km"] > 0
    assert data["separate_return_km"] > 0
    assert data["baseline_total_km"] == round(data["forward_delivery_km"] + data["separate_return_km"], 2)

def test_3_combined_route_planning():
    response = client.post("/api/run-combined")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "routes" in data
    assert "returns" in data
    assert len(data["routes"]) == 10
    assert len(data["returns"]) == 50

def test_4_vehicle_capacity():
    response = client.post("/api/run-combined")
    data = response.json()
    for route in data["routes"]:
        assert route["total_weight_kg"] <= route["weight_capacity_kg"]
        assert route["total_volume_m3"] <= route["volume_capacity_m3"]
        assert route["weight_utilization_pct"] <= 100.0
        assert route["volume_utilization_pct"] <= 100.0

def test_5_item_size_handling():
    assert get_item_volume("Small") == 0.02
    assert get_item_volume("Medium") == 0.08
    assert get_item_volume("Large") == 0.30
    assert get_item_volume("Extra Large") == 0.60
    assert get_item_volume("Unknown") == 0.08

def test_6_time_window_feasibility():
    response = client.post("/api/run-combined")
    data = response.json()
    # Check return RET030 (which has an impossible 08:00-08:15 time window)
    ret30 = next((r for r in data["returns"] if r["return_id"] == "RET030"), None)
    assert ret30 is not None
    assert ret30["status"] == "BLOCKED"
    assert ret30["blocked_reason"] == "Time-window conflict"

def test_7_incremental_km_calculation():
    response = client.post("/api/run-combined")
    data = response.json()
    summary = data["summary"]
    tot_inc = sum(r["incremental_km"] for r in data["routes"])
    assert round(tot_inc, 2) == summary["combined_incremental_km"]

def test_8_baseline_vs_combined_comparison():
    response = client.post("/api/run-combined")
    data = response.json()
    summary = data["summary"]
    assert summary["km_saved"] == round(summary["baseline_return_km"] - summary["combined_incremental_km"], 2)
    assert summary["percentage_improvement"] > 0.0

def test_9_dashboard_metrics():
    response = client.post("/api/run-combined")
    data = response.json()
    summary = data["summary"]
    assert summary["total_deliveries"] == 200
    assert summary["total_returns"] == 50
    assert summary["total_vehicles"] == 10

def test_10_route_visualisation_stops():
    response = client.post("/api/run-combined")
    data = response.json()
    for route in data["routes"]:
        assert len(route["stops"]) > 0
        for s in route["stops"]:
            assert "latitude" in s
            assert "longitude" in s
            assert s["sequence"] >= 1

def test_11_return_request_table():
    response = client.post("/api/run-combined")
    data = response.json()
    for ret in data["returns"]:
        assert "return_id" in ret
        assert "item_type" in ret
        assert "status" in ret
        assert ret["status"] in ["Assigned", "BLOCKED", "Unassigned"]

def test_12_benchmark_scenarios():
    response = client.get("/api/benchmark")
    assert response.status_code == 200
    data = response.json()
    assert "experiments" in data
    assert len(data["experiments"]) == 5

def test_13_csv_export():
    r_resp = client.get("/api/export/routes")
    assert r_resp.status_code == 200
    assert "Route ID" in r_resp.text

    ret_resp = client.get("/api/export/returns")
    assert ret_resp.status_code == 200
    assert "Return ID" in ret_resp.text

    b_resp = client.get("/api/export/benchmark")
    assert b_resp.status_code == 200
    assert "BENCHMARK" in b_resp.text

def test_14_basic_failure_tests():
    response = client.post("/api/run-combined")
    data = response.json()
    blocked_returns = [r for r in data["returns"] if r["status"] == "BLOCKED"]
    assert len(blocked_returns) > 0
    for b in blocked_returns:
        assert b["blocked_reason"] in ["Capacity conflict", "Time-window conflict", "No feasible route"]
