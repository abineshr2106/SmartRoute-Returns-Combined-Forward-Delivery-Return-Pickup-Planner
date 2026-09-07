from typing import List, Dict, Tuple
from backend.services.distance import haversine_km, calculate_route_distance, DEPOT_LAT, DEPOT_LNG

def calculate_baseline(deliveries: List[Dict], returns: List[Dict], vehicles: List[Dict]) -> Dict:
    """
    Dynamically calculate the baseline distance:
    1. Forward Delivery KM: Sum of 10 independent delivery routes (Depot -> D1 -> ... -> Dn -> Depot)
    2. Separate Return Collection KM: Inefficient current process where return pickups are planned as separate
       dedicated trips from the central depot to return points and back (or clustered separate collection routes).
    """
    # Group deliveries by route
    routes_map: Dict[str, List[Dict]] = {}
    for d in deliveries:
        r_id = d["route_id"]
        if r_id not in routes_map:
            routes_map[r_id] = []
        routes_map[r_id].append(d)
        
    forward_delivery_km = 0.0
    for r_id, stops in routes_map.items():
        # Sort by sequence
        stops.sort(key=lambda x: x["sequence"])
        coords = [(DEPOT_LAT, DEPOT_LNG)]
        for s in stops:
            coords.append((float(s["latitude"]), float(s["longitude"])))
        coords.append((DEPOT_LAT, DEPOT_LNG))
        
        r_dist = calculate_route_distance(coords)
        forward_delivery_km += r_dist
        
    forward_delivery_km = round(forward_delivery_km, 2)
    
    # Calculate separate return collection distance
    # For each return request, compute dedicated depot roundtrip (Depot -> Return -> Depot)
    # or simple greedy TSP return collection routes for separate return collection trips.
    separate_return_km = 0.0
    for ret in returns:
        r_lat = float(ret["latitude"])
        r_lng = float(ret["longitude"])
        # Roundtrip from depot to return location and back to depot
        trip_dist = haversine_km(DEPOT_LAT, DEPOT_LNG, r_lat, r_lng) * 2.0
        separate_return_km += trip_dist
        
    separate_return_km = round(separate_return_km, 2)
    baseline_total_km = round(forward_delivery_km + separate_return_km, 2)
    
    return {
        "forward_delivery_km": forward_delivery_km,
        "separate_return_km": separate_return_km,
        "baseline_total_km": baseline_total_km
    }
