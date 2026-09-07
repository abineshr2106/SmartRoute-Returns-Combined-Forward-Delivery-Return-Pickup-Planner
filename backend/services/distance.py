import math

DEPOT_LAT = 13.0827
DEPOT_LNG = 80.2707
AVERAGE_SPEED_KMH = 30.0  # Average urban delivery speed (km/h)

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in Kilometres.
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    # Apply road network tortuosity factor (~1.25 for urban grid)
    return round(distance * 1.25, 2)

def calculate_route_distance(coords: list) -> float:
    """
    Given an ordered list of (lat, lng) coordinates, calculate total route distance.
    """
    if len(coords) < 2:
        return 0.0
    
    total = 0.0
    for i in range(len(coords) - 1):
        total += haversine_km(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    return round(total, 2)

def travel_time_minutes(distance_km: float) -> float:
    """
    Calculate travel time in minutes based on urban delivery speed.
    """
    return round((distance_km / AVERAGE_SPEED_KMH) * 60.0, 1)

def parse_time_to_minutes(time_str: str) -> int:
    """
    Convert "HH:MM" format to minutes past midnight.
    """
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def format_minutes_to_time(minutes: int) -> str:
    """
    Convert minutes past midnight to "HH:MM" format.
    """
    hrs = (minutes // 60) % 24
    mins = minutes % 60
    return f"{hrs:02d}:{mins:02d}"
