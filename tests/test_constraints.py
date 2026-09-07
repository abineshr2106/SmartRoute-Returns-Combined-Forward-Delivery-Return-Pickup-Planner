import pytest
from backend.services.optimizer import run_combined_optimization, check_time_windows

def test_feasible_return_assignment():
    """TEST 1: Normal feasible return assigned successfully."""
    deliveries = [{
        "delivery_id": "D001", "route_id": "R01", "customer_id": "C101", "vehicle_id": "V01",
        "latitude": 13.050, "longitude": 80.250, "item_type": "Television", "item_size": "Large",
        "item_weight_kg": 20.0, "delivery_time_start": "09:00", "delivery_time_end": "17:00",
        "service_time_minutes": 10, "priority": "Normal", "sequence": 1
    }]
    
    returns = [{
        "return_id": "RET001", "customer_id": "C102", "latitude": 13.052, "longitude": 80.252,
        "item_type": "Smartphone", "item_size": "Small", "item_weight_kg": 1.0,
        "return_type": "Warranty", "priority": "High", "pickup_time_start": "09:00",
        "pickup_time_end": "17:00", "service_time_minutes": 10, "status": "Unassigned"
    }]
    
    vehicles = [{
        "vehicle_id": "V01", "driver_id": "DRIVER01", "weight_capacity_kg": 500.0,
        "volume_capacity_m3": 10.0, "working_hours": 8.0, "start_depot": "DEPOT",
        "end_depot": "DEPOT", "availability": "Available"
    }]
    
    routes, proc_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    
    assert len(proc_returns) == 1
    assert proc_returns[0]["status"] == "Assigned"
    assert proc_returns[0]["assigned_route_id"] == "R01"

def test_return_capacity_exceeded_blocked():
    """TEST 2: Return exceeds vehicle capacity -> Blocked."""
    deliveries = [{
        "delivery_id": "D001", "route_id": "R01", "customer_id": "C101", "vehicle_id": "V01",
        "latitude": 13.050, "longitude": 80.250, "item_type": "Refrigerator", "item_size": "Extra Large",
        "item_weight_kg": 400.0, "delivery_time_start": "09:00", "delivery_time_end": "17:00",
        "service_time_minutes": 10, "priority": "Normal", "sequence": 1
    }]
    
    returns = [{
        "return_id": "RET002", "customer_id": "C103", "latitude": 13.055, "longitude": 80.255,
        "item_type": "Heavy Machine", "item_size": "Extra Large", "item_weight_kg": 200.0,  # 400 + 200 = 600kg > 500kg
        "return_type": "Customer Return", "priority": "Normal", "pickup_time_start": "09:00",
        "pickup_time_end": "17:00", "service_time_minutes": 10, "status": "Unassigned"
    }]
    
    vehicles = [{
        "vehicle_id": "V01", "driver_id": "DRIVER01", "weight_capacity_kg": 500.0,
        "volume_capacity_m3": 10.0, "working_hours": 8.0, "start_depot": "DEPOT",
        "end_depot": "DEPOT", "availability": "Available"
    }]
    
    routes, proc_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    
    assert len(proc_returns) == 1
    assert proc_returns[0]["status"] == "BLOCKED"
    assert proc_returns[0]["blocked_reason"] == "Capacity conflict"

def test_return_impossible_time_window_blocked():
    """TEST 3: Return has impossible time window -> Blocked."""
    deliveries = [{
        "delivery_id": "D001", "route_id": "R01", "customer_id": "C101", "vehicle_id": "V01",
        "latitude": 13.050, "longitude": 80.250, "item_type": "Laptop", "item_size": "Small",
        "item_weight_kg": 3.0, "delivery_time_start": "09:00", "delivery_time_end": "17:00",
        "service_time_minutes": 10, "priority": "Normal", "sequence": 1
    }]
    
    returns = [{
        "return_id": "RET003", "customer_id": "C104", "latitude": 13.050, "longitude": 80.250,
        "item_type": "Laptop", "item_size": "Small", "item_weight_kg": 3.0,
        "return_type": "Warranty", "priority": "Urgent", "pickup_time_start": "08:00",
        "pickup_time_end": "08:05",  # Arrival will be after 08:05 due to travel time from depot
        "service_time_minutes": 10, "status": "Unassigned"
    }]
    
    vehicles = [{
        "vehicle_id": "V01", "driver_id": "DRIVER01", "weight_capacity_kg": 500.0,
        "volume_capacity_m3": 10.0, "working_hours": 8.0, "start_depot": "DEPOT",
        "end_depot": "DEPOT", "availability": "Available"
    }]
    
    routes, proc_returns, _ = run_combined_optimization(deliveries, returns, vehicles)
    
    assert len(proc_returns) == 1
    assert proc_returns[0]["status"] == "BLOCKED"
    assert proc_returns[0]["blocked_reason"] == "Time-window conflict"
