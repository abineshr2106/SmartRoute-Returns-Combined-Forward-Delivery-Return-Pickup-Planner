import os
import random
import pandas as pd
import numpy as np

# Set random seed for reproducible, high-quality dataset
random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
BACKEND_DATA_DIR = os.path.join(BASE_DIR, "backend", "data")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(BACKEND_DATA_DIR, exist_ok=True)

# Central Depot Location (Chennai Electronics Logistics Hub)
DEPOT_LAT = 13.0827
DEPOT_LNG = 80.2707

ITEM_CATALOG = {
    "Smartphone": {"size": "Small", "weight_range": (0.5, 1.5), "volume": 0.02},
    "Laptop": {"size": "Small", "weight_range": (2.0, 4.0), "volume": 0.02},
    "Printer": {"size": "Medium", "weight_range": (6.0, 12.0), "volume": 0.08},
    "Monitor": {"size": "Medium", "weight_range": (5.0, 10.0), "volume": 0.08},
    "Microwave": {"size": "Medium", "weight_range": (10.0, 16.0), "volume": 0.08},
    "Television": {"size": "Large", "weight_range": (15.0, 25.0), "volume": 0.30},
    "Air Conditioner": {"size": "Large", "weight_range": (25.0, 40.0), "volume": 0.30},
    "Washing Machine": {"size": "Extra Large", "weight_range": (45.0, 60.0), "volume": 0.60},
    "Refrigerator": {"size": "Extra Large", "weight_range": (50.0, 65.0), "volume": 0.60},
}

def generate_vehicles():
    vehicles = []
    for i in range(1, 11):
        v_id = f"V{i:02d}"
        d_id = f"DRIVER{i:02d}"
        # V10 set to Available for demo
        avail = "Available"
        vehicles.append({
            "vehicle_id": v_id,
            "driver_id": d_id,
            "weight_capacity_kg": 500.0,
            "volume_capacity_m3": 10.0,
            "working_hours": 8.0,
            "start_depot": "DEPOT",
            "end_depot": "DEPOT",
            "availability": avail
        })
    df = pd.DataFrame(vehicles)
    df.to_csv(os.path.join(DATASET_DIR, "vehicles.csv"), index=False)
    df.to_csv(os.path.join(BACKEND_DATA_DIR, "vehicles.csv"), index=False)
    return df

def generate_deliveries():
    deliveries = []
    item_keys = list(ITEM_CATALOG.keys())
    
    # 10 routes, 20 deliveries each = 200 total
    # Cluster each route around a sector angle from depot so routes are spatially coherent
    for r in range(1, 11):
        route_id = f"R{r:02d}"
        vehicle_id = f"V{r:02d}"
        
        # Sector center angle
        base_angle = (r - 1) * (2 * np.pi / 10)
        # Distance range from depot: 5 km to 25 km
        
        route_stops = []
        for s in range(1, 21):
            cust_id = f"C{(r - 1) * 20 + s + 100}"
            delivery_id = f"D{(r - 1) * 20 + s:03d}"
            
            # Angle variation
            angle = base_angle + np.random.normal(0, 0.15)
            dist_km = np.random.uniform(3.0, 22.0)
            
            # 1 degree approx 111 km
            lat = DEPOT_LAT + (dist_km / 111.0) * np.sin(angle)
            lng = DEPOT_LNG + (dist_km / (111.0 * np.cos(np.radians(DEPOT_LAT)))) * np.cos(angle)
            
            item_name = random.choice(item_keys)
            spec = ITEM_CATALOG[item_name]
            weight = round(random.uniform(*spec["weight_range"]) * 0.5, 1)
            
            # Time window corresponds to route sequence depth (1..20)
            if s <= 6:
                tw_start, tw_end = "09:00", "13:00"
            elif s <= 12:
                tw_start, tw_end = "11:00", "15:00"
            elif s <= 16:
                tw_start, tw_end = "13:00", "17:00"
            else:
                tw_start, tw_end = "09:00", "18:00"
            
            priority = random.choice(["Normal", "Normal", "Normal", "High", "Urgent"])
            
            route_stops.append({
                "delivery_id": delivery_id,
                "route_id": route_id,
                "customer_id": cust_id,
                "vehicle_id": vehicle_id,
                "latitude": round(lat, 5),
                "longitude": round(lng, 5),
                "item_type": item_name,
                "item_size": spec["size"],
                "item_weight_kg": weight,
                "delivery_time_start": tw_start,
                "delivery_time_end": tw_end,
                "service_time_minutes": 10,
                "priority": priority,
                "dist_from_depot": dist_km
            })
        
        # Sort stops by distance from depot to form realistic route sequence 1..20
        route_stops.sort(key=lambda x: x["dist_from_depot"])
        for seq, item in enumerate(route_stops, start=1):
            item["sequence"] = seq
            if seq <= 6:
                item["delivery_time_start"], item["delivery_time_end"] = "09:00", "13:00"
            elif seq <= 12:
                item["delivery_time_start"], item["delivery_time_end"] = "10:00", "15:00"
            elif seq <= 16:
                item["delivery_time_start"], item["delivery_time_end"] = "12:00", "17:00"
            else:
                item["delivery_time_start"], item["delivery_time_end"] = "09:00", "18:00"
            del item["dist_from_depot"]
            deliveries.append(item)
            
    df = pd.DataFrame(deliveries)
    df.to_csv(os.path.join(DATASET_DIR, "deliveries.csv"), index=False)
    df.to_csv(os.path.join(BACKEND_DATA_DIR, "deliveries.csv"), index=False)
    return df

def generate_returns():
    returns = []
    item_keys = list(ITEM_CATALOG.keys())
    return_types = ["Warranty", "Customer Return", "Damaged item", "Replacement pickup", "Repair collection"]
    
    # 30 return requests spread across the city
    for i in range(1, 31):
        ret_id = f"RET{i:03d}"
        cust_id = f"C{300 + i}"
        
        # Angle across 360 degrees
        angle = (i / 30.0) * 2 * np.pi + random.uniform(-0.1, 0.1)
        dist_km = random.uniform(4.0, 20.0)
        
        lat = DEPOT_LAT + (dist_km / 111.0) * np.sin(angle)
        lng = DEPOT_LNG + (dist_km / (111.0 * np.cos(np.radians(DEPOT_LAT)))) * np.cos(angle)
        
        # Special edge cases for testing:
        # RET029 has huge weight (480kg) to trigger Capacity Conflict in tests/demo
        # RET030 has tight past time window (08:00 - 08:15) to trigger Time Window Conflict
        if i == 29:
            item_name = "Refrigerator"
            spec = ITEM_CATALOG[item_name]
            weight = 480.0
            size = "Extra Large"
            tw_start, tw_end = "09:00", "17:00"
            ret_type = "Damaged item"
            priority = "Urgent"
        elif i == 30:
            item_name = "Television"
            spec = ITEM_CATALOG[item_name]
            weight = 25.0
            size = "Large"
            tw_start, tw_end = "08:00", "08:15"
            ret_type = "Warranty"
            priority = "High"
        else:
            item_name = random.choice(item_keys)
            spec = ITEM_CATALOG[item_name]
            weight = round(random.uniform(*spec["weight_range"]) * 0.5, 1)
            size = spec["size"]
            tw_start, tw_end = "09:00", "17:00"
            ret_type = random.choice(return_types)
            priority = random.choice(["Normal", "Normal", "High", "Urgent"])
            
        returns.append({
            "return_id": ret_id,
            "customer_id": cust_id,
            "latitude": round(lat, 5),
            "longitude": round(lng, 5),
            "item_type": item_name,
            "item_size": size,
            "item_weight_kg": weight,
            "return_type": ret_type,
            "priority": priority,
            "pickup_time_start": tw_start,
            "pickup_time_end": tw_end,
            "service_time_minutes": 10,
            "status": "Unassigned"
        })
        
    df = pd.DataFrame(returns)
    df.to_csv(os.path.join(DATASET_DIR, "returns.csv"), index=False)
    df.to_csv(os.path.join(BACKEND_DATA_DIR, "returns.csv"), index=False)
    return df

if __name__ == "__main__":
    generate_vehicles()
    generate_deliveries()
    generate_returns()
    print("Dataset successfully generated in 'dataset/' and 'backend/data/'")
