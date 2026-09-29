import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from backend.services.optimizer import run_combined_optimization

def get_base_data():
    deliveries = [
        {
            "delivery_id": "D001",
            "route_id": "R01",
            "customer_id": "C001",
            "vehicle_id": "V01",
            "latitude": 13.0900,
            "longitude": 80.2800,
            "item_type": "Smartphone",
            "item_size": "Small",
            "item_weight_kg": 1.0,
            "delivery_time_start": "09:00",
            "delivery_time_end": "17:00",
            "service_time_minutes": 10,
            "priority": "Normal",
            "sequence": 1
        }
    ]
    
    vehicles = [
        {
            "vehicle_id": "V01",
            "driver_id": "DRIVER01",
            "weight_capacity_kg": 500.0,
            "volume_capacity_m3": 10.0,
            "working_hours": 8.0,
            "start_depot": "DEPOT",
            "end_depot": "DEPOT",
            "availability": "Available"
        }
    ]
    
    return deliveries, vehicles

def test_feasible_return():
    deliveries, vehicles = get_base_data()
    returns = [{
        "return_id": "RET001",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Laptop",
        "item_size": "Small",
        "item_weight_kg": 2.0,
        "return_type": "Warranty",
        "priority": "Normal",
        "pickup_time_start": "09:00",
        "pickup_time_end": "17:00",
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "Assigned"
    assert processed_returns[0]["assigned_route_id"] == "R01"

def test_weight_overflow():
    deliveries, vehicles = get_base_data()
    deliveries[0]["item_weight_kg"] = 499.0
    returns = [{
        "return_id": "RET002",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Refrigerator",
        "item_size": "Extra Large",
        "item_weight_kg": 50.0,
        "pickup_time_start": "09:00",
        "pickup_time_end": "17:00",
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "BLOCKED"
    assert processed_returns[0]["blocked_reason"] == "Capacity conflict"

def test_volume_overflow():
    deliveries, vehicles = get_base_data()
    # Set vehicle volume to something small
    vehicles[0]["volume_capacity_m3"] = 0.5
    deliveries[0]["item_size"] = "Large" # 0.3 m3
    returns = [{
        "return_id": "RET003",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Television",
        "item_size": "Large", # 0.3 m3
        "item_weight_kg": 15.0,
        "pickup_time_start": "09:00",
        "pickup_time_end": "17:00",
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "BLOCKED"
    assert processed_returns[0]["blocked_reason"] == "Capacity conflict"

def test_time_window_violation():
    deliveries, vehicles = get_base_data()
    returns = [{
        "return_id": "RET004",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Smartphone",
        "item_size": "Small",
        "item_weight_kg": 1.0,
        "pickup_time_start": "07:00",
        "pickup_time_end": "07:59", # Impossible to reach since route starts at 08:00
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "BLOCKED"
    assert processed_returns[0]["blocked_reason"] == "Time-window conflict"

def test_vehicle_unavailable():
    deliveries, vehicles = get_base_data()
    vehicles[0]["availability"] = "Unavailable"
    returns = [{
        "return_id": "RET005",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Smartphone",
        "item_size": "Small",
        "item_weight_kg": 1.0,
        "pickup_time_start": "09:00",
        "pickup_time_end": "17:00",
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "BLOCKED"
    assert processed_returns[0]["blocked_reason"] == "No feasible route"

def test_extra_large_item():
    deliveries, vehicles = get_base_data()
    returns = [{
        "return_id": "RET006",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Washing Machine",
        "item_size": "Extra Large", # 0.6 m3, 60kg
        "item_weight_kg": 60.0,
        "pickup_time_start": "09:00",
        "pickup_time_end": "17:00",
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "Assigned"
    # Verify volume and weight
    assert routes[0]["total_volume_m3"] == 0.02 + 0.60
    assert routes[0]["total_weight_kg"] == 61.0

def test_multiple_returns():
    deliveries, vehicles = get_base_data()
    returns = [
        {
            "return_id": "RET007",
            "customer_id": "C002",
            "latitude": 13.0950,
            "longitude": 80.2850,
            "item_type": "Smartphone",
            "item_size": "Small",
            "item_weight_kg": 1.0,
            "pickup_time_start": "09:00",
            "pickup_time_end": "17:00",
            "service_time_minutes": 10,
            "priority": "Urgent" # Urgent handled first
        },
        {
            "return_id": "RET008",
            "customer_id": "C003",
            "latitude": 13.1000,
            "longitude": 80.2900,
            "item_type": "Laptop",
            "item_size": "Small",
            "item_weight_kg": 2.0,
            "pickup_time_start": "09:00",
            "pickup_time_end": "17:00",
            "service_time_minutes": 10,
            "priority": "Normal"
        }
    ]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert len(processed_returns) == 2
    for r in processed_returns:
        assert r["status"] == "Assigned"
        assert r["assigned_route_id"] == "R01"
    
    # Urgent should be processed first, so assigned first
    # In processed_returns they are appended in order of processing
    assert processed_returns[0]["return_id"] == "RET007"
    assert processed_returns[1]["return_id"] == "RET008"

def test_no_feasible_route():
    deliveries, vehicles = get_base_data()
    # No routes defined for this return's constraints, e.g. return requires delivery in non-existent route,
    # but optimizer checks all active routes. So if active route is full:
    deliveries[0]["item_weight_kg"] = 500.0
    returns = [{
        "return_id": "RET009",
        "customer_id": "C002",
        "latitude": 13.0950,
        "longitude": 80.2850,
        "item_type": "Smartphone",
        "item_size": "Small",
        "item_weight_kg": 1.0,
        "pickup_time_start": "09:00",
        "pickup_time_end": "17:00",
        "service_time_minutes": 10
    }]
    routes, processed_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    assert processed_returns[0]["status"] == "BLOCKED"
    assert processed_returns[0]["blocked_reason"] == "Capacity conflict"
