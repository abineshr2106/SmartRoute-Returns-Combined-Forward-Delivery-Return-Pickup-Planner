import copy
from typing import List, Dict, Tuple, Optional
from backend.services.distance import (
    haversine_km, calculate_route_distance, travel_time_minutes,
    parse_time_to_minutes, format_minutes_to_time, DEPOT_LAT, DEPOT_LNG
)

VOLUME_MAP = {
    "Small": 0.02,
    "Medium": 0.08,
    "Large": 0.30,
    "Extra Large": 0.60
}

def get_item_volume(size_str: str) -> float:
    return VOLUME_MAP.get(size_str, 0.08)

def check_time_windows(stops: List[Dict]) -> Tuple[bool, List[Dict]]:
    """
    Simulate route traversal from 08:00 AM.
    Calculate estimated arrival and departure times for each stop.
    Verify if arrival time is <= pickup/delivery time_window_end.
    Returns (is_feasible, updated_stops_with_arrival_times).
    """
    current_minutes = parse_time_to_minutes("08:00")
    prev_lat = DEPOT_LAT
    prev_lng = DEPOT_LNG
    
    updated_stops = []
    feasible = True
    
    for s in stops:
        s_copy = copy.deepcopy(s)
        lat = float(s_copy["latitude"])
        lng = float(s_copy["longitude"])
        
        # Calculate travel time from previous stop
        dist = haversine_km(prev_lat, prev_lng, lat, lng)
        travel_mins = travel_time_minutes(dist)
        
        current_minutes += int(round(travel_mins))
        arrival_str = format_minutes_to_time(current_minutes)
        s_copy["estimated_arrival"] = arrival_str
        
        # Time window check
        tw_start = parse_time_to_minutes(s_copy.get("delivery_time_start") or s_copy.get("pickup_time_start") or "08:00")
        tw_end = parse_time_to_minutes(s_copy.get("delivery_time_end") or s_copy.get("pickup_time_end") or "18:00")
        
        # If arrived before start of time window, wait until start
        if current_minutes < tw_start:
            current_minutes = tw_start
            
        if current_minutes > tw_end:
            feasible = False
            s_copy["status"] = "Time Window Violation"
        else:
            s_copy["status"] = "Feasible"
            
        # Add service time
        service_mins = s_copy.get("service_time_minutes", 10)
        current_minutes += service_mins
        
        prev_lat, prev_lng = lat, lng
        updated_stops.append(s_copy)
        
    return feasible, updated_stops

def run_combined_optimization(
    deliveries: List[Dict],
    returns: List[Dict],
    vehicles: List[Dict]
) -> Tuple[List[Dict], List[Dict], Dict]:
    """
    Combined Forward Delivery + Return Pickup Planner
    Integrates return pickups into active forward delivery routes while checking:
    1. Vehicle weight capacity (500kg)
    2. Vehicle volume capacity (10m3)
    3. Basic time-window feasibility
    4. Vehicle availability
    Minimizes incremental distance added for returns.
    """
    # Parse vehicles
    vehicles_dict = {v["vehicle_id"]: v for v in vehicles}
    
    # Group deliveries into initial forward routes
    route_deliveries: Dict[str, List[Dict]] = {}
    for d in deliveries:
        r_id = d["route_id"]
        if r_id not in route_deliveries:
            route_deliveries[r_id] = []
        route_deliveries[r_id].append(d)
        
    # Build initial route structures
    active_routes: Dict[str, List[Dict]] = {}
    original_distances: Dict[str, float] = {}
    
    for r_id, d_list in route_deliveries.items():
        d_list.sort(key=lambda x: x["sequence"])
        # Standardize stop dictionaries
        stops = []
        for item in d_list:
            stops.append({
                "stop_id": item["delivery_id"],
                "stop_type": "DELIVERY",
                "customer_id": item["customer_id"],
                "latitude": float(item["latitude"]),
                "longitude": float(item["longitude"]),
                "item_type": item["item_type"],
                "item_size": item["item_size"],
                "item_weight_kg": float(item["item_weight_kg"]),
                "item_volume_m3": get_item_volume(item["item_size"]),
                "delivery_time_start": item["delivery_time_start"],
                "delivery_time_end": item["delivery_time_end"],
                "service_time_minutes": int(item["service_time_minutes"]),
                "priority": item["priority"],
                "status": "Feasible"
            })
        active_routes[r_id] = stops
        
        # Calculate original forward route distance
        coords = [(DEPOT_LAT, DEPOT_LNG)] + [(s["latitude"], s["longitude"]) for s in stops] + [(DEPOT_LAT, DEPOT_LNG)]
        original_distances[r_id] = calculate_route_distance(coords)

    # Process return requests
    # Sort returns by priority (Urgent > High > Normal)
    priority_map = {"Urgent": 3, "High": 2, "Normal": 1}
    sorted_returns = sorted(returns, key=lambda x: priority_map.get(x.get("priority", "Normal"), 1), reverse=True)
    
    processed_returns = []
    
    for ret in sorted_returns:
        ret_copy = copy.deepcopy(ret)
        r_lat = float(ret_copy["latitude"])
        r_lng = float(ret_copy["longitude"])
        r_weight = float(ret_copy["item_weight_kg"])
        r_volume = get_item_volume(ret_copy["item_size"])
        
        best_candidate = None
        best_incremental_km = float('inf')
        best_insertion_idx = None
        best_route_id = None
        
        capacity_blocked = False
        time_window_blocked = False
        
        # Search all active routes for best insertion position
        for r_id, stops in active_routes.items():
            veh_id = f"V{int(r_id[1:]):02d}"
            veh = vehicles_dict.get(veh_id, {})
            
            # Check vehicle availability
            if veh.get("availability") != "Available":
                continue
                
            weight_limit = float(veh.get("weight_capacity_kg", 500.0))
            volume_limit = float(veh.get("volume_capacity_m3", 10.0))
            
            # 1. Weight capacity check
            current_weight = sum(s["item_weight_kg"] for s in stops)
            if current_weight + r_weight > weight_limit:
                capacity_blocked = True
                continue
                
            # 2. Volume capacity check
            current_volume = sum(s["item_volume_m3"] for s in stops)
            if current_volume + r_volume > volume_limit:
                capacity_blocked = True
                continue
                
            # Test every insertion index (from index 0 up to len(stops))
            ret_stop = {
                "stop_id": ret_copy["return_id"],
                "stop_type": "RETURN",
                "customer_id": ret_copy["customer_id"],
                "latitude": r_lat,
                "longitude": r_lng,
                "item_type": ret_copy["item_type"],
                "item_size": ret_copy["item_size"],
                "item_weight_kg": r_weight,
                "item_volume_m3": r_volume,
                "pickup_time_start": ret_copy["pickup_time_start"],
                "pickup_time_end": ret_copy["pickup_time_end"],
                "service_time_minutes": int(ret_copy.get("service_time_minutes", 10)),
                "priority": ret_copy["priority"],
                "status": "Feasible"
            }
            
            for idx in range(len(stops) + 1):
                candidate_stops = stops[:idx] + [ret_stop] + stops[idx:]
                
                # Check time windows for updated sequence
                tw_feasible, _ = check_time_windows(candidate_stops)
                if not tw_feasible:
                    time_window_blocked = True
                    continue
                    
                # Calculate incremental distance for candidate route
                cand_coords = [(DEPOT_LAT, DEPOT_LNG)] + [(s["latitude"], s["longitude"]) for s in candidate_stops] + [(DEPOT_LAT, DEPOT_LNG)]
                cand_dist = calculate_route_distance(cand_coords)
                
                curr_coords = [(DEPOT_LAT, DEPOT_LNG)] + [(s["latitude"], s["longitude"]) for s in stops] + [(DEPOT_LAT, DEPOT_LNG)]
                curr_dist = calculate_route_distance(curr_coords)
                
                incremental = cand_dist - curr_dist
                
                if incremental < best_incremental_km:
                    best_incremental_km = incremental
                    best_insertion_idx = idx
                    best_route_id = r_id
                    best_candidate = candidate_stops
                    
        # Apply best insertion if found
        if best_route_id is not None and best_candidate is not None:
            active_routes[best_route_id] = best_candidate
            ret_copy["status"] = "Assigned"
            ret_copy["assigned_route_id"] = best_route_id
            ret_copy["insertion_sequence"] = best_insertion_idx + 1
            ret_copy["incremental_km"] = round(best_incremental_km, 2)
            ret_copy["blocked_reason"] = None
        else:
            ret_copy["status"] = "BLOCKED"
            ret_copy["assigned_route_id"] = None
            ret_copy["incremental_km"] = 0.0
            if capacity_blocked:
                ret_copy["blocked_reason"] = "Capacity conflict"
            elif time_window_blocked:
                ret_copy["blocked_reason"] = "Time-window conflict"
            else:
                ret_copy["blocked_reason"] = "No feasible route"
                
        processed_returns.append(ret_copy)
        
    # Build detailed route metrics
    formatted_routes = []
    for r_id in sorted(active_routes.keys()):
        stops = active_routes[r_id]
        veh_id = f"V{int(r_id[1:]):02d}"
        veh = vehicles_dict.get(veh_id, {
            "driver_id": f"DRIVER{int(r_id[1:]):02d}",
            "weight_capacity_kg": 500.0,
            "volume_capacity_m3": 10.0,
            "working_hours": 8.0
        })
        
        # Assign final sequences and calculate time schedule
        _, evaluated_stops = check_time_windows(stops)
        for seq, s in enumerate(evaluated_stops, start=1):
            s["sequence"] = seq
            
        orig_dist = original_distances[r_id]
        comb_coords = [(DEPOT_LAT, DEPOT_LNG)] + [(s["latitude"], s["longitude"]) for s in evaluated_stops] + [(DEPOT_LAT, DEPOT_LNG)]
        comb_dist = calculate_route_distance(comb_coords)
        inc_dist = round(max(0.0, comb_dist - orig_dist), 2)
        
        tot_weight = sum(s["item_weight_kg"] for s in evaluated_stops)
        tot_volume = sum(s["item_volume_m3"] for s in evaluated_stops)
        
        weight_cap = float(veh["weight_capacity_kg"])
        volume_cap = float(veh["volume_capacity_m3"])
        
        w_util = round((tot_weight / weight_cap) * 100.0, 1)
        v_util = round((tot_volume / volume_cap) * 100.0, 1)
        
        # Calculate duration: travel time + service time
        total_travel_time = travel_time_minutes(comb_dist)
        total_service_time = sum(s.get("service_time_minutes", 10) for s in evaluated_stops)
        duration_hrs = round((total_travel_time + total_service_time) / 60.0, 2)
        
        working_hrs = float(veh.get("working_hours", 8.0))
        workload_pct = (duration_hrs / working_hrs) * 100.0
        
        if workload_pct <= 80.0:
            workload_status = "Normal"
        elif workload_pct <= 95.0:
            workload_status = "Elevated"
        else:
            workload_status = "Risk"
            
        del_count = sum(1 for s in evaluated_stops if s["stop_type"] == "DELIVERY")
        ret_count = sum(1 for s in evaluated_stops if s["stop_type"] == "RETURN")
        
        has_tw_violation = any(s["status"] == "Time Window Violation" for s in evaluated_stops)
        route_status = "WARNING" if has_tw_violation else "FEASIBLE"
        
        formatted_routes.append({
            "route_id": r_id,
            "vehicle_id": veh_id,
            "driver_id": veh.get("driver_id", "DRIVER"),
            "deliveries_count": del_count,
            "returns_count": ret_count,
            "original_distance_km": orig_dist,
            "combined_distance_km": comb_dist,
            "incremental_km": inc_dist,
            "total_weight_kg": round(tot_weight, 1),
            "weight_capacity_kg": weight_cap,
            "weight_utilization_pct": w_util,
            "total_volume_m3": round(tot_volume, 2),
            "volume_capacity_m3": volume_cap,
            "volume_utilization_pct": v_util,
            "total_duration_hours": duration_hrs,
            "workload_status": workload_status,
            "status": route_status,
            "stops": evaluated_stops
        })
        
    return formatted_routes, processed_returns, {}
