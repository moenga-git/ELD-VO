import os
import requests
import time
import math
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on Earth in miles."""
    R = 3959  # Earth's radius in miles
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def create_fallback_route(start: Tuple[float, float], pickup: Tuple[float, float], 
                         dropoff: Tuple[float, float]) -> Dict:
    """Create a fallback route using straight-line distances and 55mph speed."""
    start_lat, start_lng = start
    pickup_lat, pickup_lng = pickup
    dropoff_lat, dropoff_lng = dropoff
    
    # Calculate distances
    dist_to_pickup = haversine_distance(start_lat, start_lng, pickup_lat, pickup_lng)
    dist_pickup_to_dropoff = haversine_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    
    total_distance = dist_to_pickup + dist_pickup_to_dropoff
    
    # Calculate durations at 55mph
    duration_to_pickup = int((dist_to_pickup / 55) * 60)
    duration_pickup_to_dropoff = int((dist_pickup_to_dropoff / 55) * 60)
    total_duration = duration_to_pickup + duration_pickup_to_dropoff
    
    # Create simple LineString geometries
    leg1_geometry = {
        "type": "LineString",
        "coordinates": [[start_lng, start_lat], [pickup_lng, pickup_lat]]
    }
    
    leg2_geometry = {
        "type": "LineString", 
        "coordinates": [[pickup_lng, pickup_lat], [dropoff_lng, dropoff_lat]]
    }
    
    return {
        "total_distance_mi": total_distance,
        "total_duration_min": total_duration,
        "legs": [
            {
                "leg_index": 0,
                "start_lat": start_lat,
                "start_lng": start_lng,
                "end_lat": pickup_lat,
                "end_lng": pickup_lng,
                "distance_miles": dist_to_pickup,
                "duration_minutes": duration_to_pickup,
                "geometry": leg1_geometry,
                "is_pickup": True,
                "is_dropoff": False
            },
            {
                "leg_index": 1,
                "start_lat": pickup_lat,
                "start_lng": pickup_lng,
                "end_lat": dropoff_lat,
                "end_lng": dropoff_lng,
                "distance_miles": dist_pickup_to_dropoff,
                "duration_minutes": duration_pickup_to_dropoff,
                "geometry": leg2_geometry,
                "is_pickup": False,
                "is_dropoff": True
            }
        ]
    }


def get_route(start: Tuple[float, float], pickup: Tuple[float, float], 
              dropoff: Tuple[float, float]) -> Dict:
    """
    Get route from Mapbox Directions API with retry logic and fallback.
    
    Args:
        start: (lat, lng) tuple for starting location
        pickup: (lat, lng) tuple for pickup location  
        dropoff: (lat, lng) tuple for dropoff location
        
    Returns:
        Dict with route information including legs and geometry
    """
    mapbox_token = os.environ.get('MAPBOX_TOKEN')
    if not mapbox_token:
        logger.warning("MAPBOX_TOKEN not found, using fallback route")
        return create_fallback_route(start, pickup, dropoff)
    
    start_lat, start_lng = start
    pickup_lat, pickup_lng = pickup
    dropoff_lat, dropoff_lng = dropoff
    
    # Create waypoints for Mapbox
    coordinates = f"{start_lng},{start_lat};{pickup_lng},{pickup_lat};{dropoff_lng},{dropoff_lat}"
    
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{coordinates}"
    params = {
        'access_token': mapbox_token,
        'overview': 'full',
        'geometries': 'geojson',
        'annotations': 'distance,duration'
    }
    
    # Retry logic with exponential backoff
    max_retries = 3
    base_delay = 1
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Mapbox API attempt {attempt + 1}/{max_retries}")
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('routes') and len(data['routes']) > 0:
                route = data['routes'][0]
                legs = data['legs']
                
                total_distance = route['distance'] * 0.000621371  # Convert meters to miles
                total_duration = route['duration'] / 60  # Convert seconds to minutes
                
                result_legs = []
                for i, leg in enumerate(legs):
                    leg_distance = leg['distance'] * 0.000621371
                    leg_duration = leg['duration'] / 60
                    
                    # Get coordinates for this leg
                    if i == 0:
                        leg_start_lat, leg_start_lng = start_lat, start_lng
                    else:
                        leg_start_lat, leg_start_lng = pickup_lat, pickup_lng
                    
                    if i == len(legs) - 1:
                        leg_end_lat, leg_end_lng = dropoff_lat, dropoff_lng
                    else:
                        leg_end_lat, leg_end_lng = pickup_lat, pickup_lng
                    
                    # Extract geometry for this leg from the route geometry
                    geometry = {
                        "type": "LineString",
                        "coordinates": route['geometry']['coordinates'][i:i+2] if i < len(route['geometry']['coordinates']) - 1 else route['geometry']['coordinates'][i:]
                    }
                    
                    result_legs.append({
                        "leg_index": i,
                        "start_lat": leg_start_lat,
                        "start_lng": leg_start_lng,
                        "end_lat": leg_end_lat,
                        "end_lng": leg_end_lng,
                        "distance_miles": leg_distance,
                        "duration_minutes": int(leg_duration),
                        "geometry": geometry,
                        "is_pickup": i == 0,
                        "is_dropoff": i == len(legs) - 1
                    })
                
                logger.info(f"Mapbox API successful: {total_distance:.2f} miles, {total_duration:.1f} minutes")
                return {
                    "total_distance_mi": total_distance,
                    "total_duration_min": int(total_duration),
                    "legs": result_legs
                }
            else:
                logger.warning(f"Mapbox API returned no routes on attempt {attempt + 1}")
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Mapbox API request failed on attempt {attempt + 1}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
        
        if attempt < max_retries - 1:
            delay = base_delay * (2 ** attempt)
            logger.info(f"Retrying in {delay} seconds...")
            time.sleep(delay)
    
    # All retries failed, use fallback
    logger.warning("All Mapbox API attempts failed, using fallback route")
    return create_fallback_route(start, pickup, dropoff)
