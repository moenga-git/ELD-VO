"""
ELD Algorithm implementing FMCSA Hours of Service rules.
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# FMCSA Constants
MAX_DRIVING_HOURS_PER_14_HOUR_WINDOW = 11
MAX_ON_DUTY_HOURS_PER_14_HOUR_WINDOW = 14
MIN_BREAK_AFTER_8_HOURS_DRIVING = 30  # minutes
MAX_CYCLE_HOURS_8_DAY = 70
FUEL_STOP_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_MINUTES = 20
PICKUP_DROPOFF_DURATION_MINUTES = 60


def generate_logs(trip, legs, start_time_iso: str, current_cycle_hours_used: float, 
                 driver_history: Optional[List] = None, mode: str = 'single_driver') -> Dict:
    """
    Generate ELD logs for a trip following FMCSA HOS rules.
    
    Args:
        trip: Trip model instance
        legs: List of route legs from routing service
        start_time_iso: ISO8601 start time string
        current_cycle_hours_used: Current hours used in 8-day cycle
        driver_history: Optional list of previous duty entries for rolling calculation
        mode: 'single_driver' or 'team_driver'
        
    Returns:
        Dict with duty_entries and logsheet_days
    """
    start_time = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=None)
    
    duty_entries = []
    logsheet_days = {}
    
    current_time = start_time
    total_driving_hours = 0
    total_on_duty_hours = 0
    cycle_hours_used = current_cycle_hours_used
    
    # Process each leg
    for leg_index, leg in enumerate(legs):
        leg_start_time = current_time
        leg_duration_minutes = leg['duration_minutes']
        leg_distance_miles = leg['distance_miles']
        
        # Check if we need fuel stops
        fuel_stops = []
        if leg_distance_miles > FUEL_STOP_INTERVAL_MILES:
            num_fuel_stops = int(leg_distance_miles // FUEL_STOP_INTERVAL_MILES)
            for i in range(num_fuel_stops):
                stop_distance = (i + 1) * FUEL_STOP_INTERVAL_MILES
                stop_time = leg_start_time + timedelta(minutes=(stop_distance / leg_distance_miles) * leg_duration_minutes)
                fuel_stops.append({
                    'time': stop_time,
                    'distance': stop_distance,
                    'duration': FUEL_STOP_DURATION_MINUTES
                })
        
        # Check if this is pickup or dropoff
        is_pickup = leg.get('is_pickup', False)
        is_dropoff = leg.get('is_dropoff', False)
        
        # Add pickup/dropoff duty time
        if is_pickup or is_dropoff:
            duty_entry = {
                'trip': trip,
                'day_index': (current_time.date() - start_time.date()).days,
                'start': current_time,
                'end': current_time + timedelta(minutes=PICKUP_DROPOFF_DURATION_MINUTES),
                'duty_status': 'ON_DUTY_NOT_DRIVING',
                'note': f"{'Pickup' if is_pickup else 'Dropoff'} duty time",
                'rule_applied': 'FMCSA 395.3(a)(2)',
                'explanation': f"Required {PICKUP_DROPOFF_DURATION_MINUTES} minutes for {'pickup' if is_pickup else 'dropoff'} operations"
            }
            duty_entries.append(duty_entry)
            current_time += timedelta(minutes=PICKUP_DROPOFF_DURATION_MINUTES)
            total_on_duty_hours += PICKUP_DROPOFF_DURATION_MINUTES / 60
        
        # Process driving segments with HOS compliance
        remaining_driving_time = leg_duration_minutes
        segment_start_time = current_time
        
        while remaining_driving_time > 0:
            # Check 14-hour rule
            window_start = current_time - timedelta(hours=14)
            recent_entries = [e for e in duty_entries if e['start'] >= window_start]
            
            # Calculate hours in current 14-hour window
            window_driving_hours = sum(
                (e['end'] - e['start']).total_seconds() / 3600 
                for e in recent_entries 
                if e['duty_status'] == 'DRIVING'
            )
            window_on_duty_hours = sum(
                (e['end'] - e['start']).total_seconds() / 3600 
                for e in recent_entries 
                if e['duty_status'] in ['DRIVING', 'ON_DUTY_NOT_DRIVING']
            )
            
            # Check if we can continue driving
            max_driving_this_segment = min(
                remaining_driving_time,
                (MAX_DRIVING_HOURS_PER_14_HOUR_WINDOW - window_driving_hours) * 60,
                (MAX_ON_DUTY_HOURS_PER_14_HOUR_WINDOW - window_on_duty_hours) * 60
            )
            
            # Check 8-hour break rule
            if total_driving_hours >= 8:
                # Need 30-minute break
                break_start = current_time
                break_end = current_time + timedelta(minutes=MIN_BREAK_AFTER_8_HOURS_DRIVING)
                
                break_entry = {
                    'trip': trip,
                    'day_index': (current_time.date() - start_time.date()).days,
                    'start': break_start,
                    'end': break_end,
                    'duty_status': 'OFF_DUTY',
                    'note': 'Required 30-minute break after 8 hours driving',
                    'rule_applied': 'FMCSA 395.3(a)(3)(ii)',
                    'explanation': '30-minute break required after 8 cumulative hours of driving'
                }
                duty_entries.append(break_entry)
                current_time = break_end
                total_driving_hours = 0  # Reset after break
                total_on_duty_hours = 0  # Reset after break
                
                # Recalculate window after break
                window_start = current_time - timedelta(hours=14)
                recent_entries = [e for e in duty_entries if e['start'] >= window_start]
                window_driving_hours = 0
                window_on_duty_hours = 0
            
            # Check 70-hour rule
            if cycle_hours_used >= MAX_CYCLE_HOURS_8_DAY:
                # Need 34-hour restart
                restart_start = current_time
                restart_end = current_time + timedelta(hours=34)
                
                restart_entry = {
                    'trip': trip,
                    'day_index': (current_time.date() - start_time.date()).days,
                    'start': restart_start,
                    'end': restart_end,
                    'duty_status': 'OFF_DUTY',
                    'note': 'Required 34-hour restart after 70-hour cycle',
                    'rule_applied': 'FMCSA 395.3(a)(3)(i)',
                    'explanation': '34-hour restart required after 70 hours in 8-day cycle'
                }
                duty_entries.append(restart_entry)
                current_time = restart_end
                cycle_hours_used = 0  # Reset cycle
                total_driving_hours = 0
                total_on_duty_hours = 0
                
                # Recalculate window after restart
                window_start = current_time - timedelta(hours=14)
                recent_entries = [e for e in duty_entries if e['start'] >= window_start]
                window_driving_hours = 0
                window_on_duty_hours = 0
            
            # Drive for allowed time
            driving_duration = min(max_driving_this_segment, remaining_driving_time)
            if driving_duration > 0:
                driving_start = current_time
                driving_end = current_time + timedelta(minutes=driving_duration)
                
                driving_entry = {
                    'trip': trip,
                    'day_index': (current_time.date() - start_time.date()).days,
                    'start': driving_start,
                    'end': driving_end,
                    'duty_status': 'DRIVING',
                    'note': f"Driving leg {leg_index + 1}",
                    'rule_applied': 'FMCSA 395.3(a)(1)',
                    'explanation': f"Driving for {driving_duration} minutes"
                }
                duty_entries.append(driving_entry)
                
                current_time = driving_end
                total_driving_hours += driving_duration / 60
                total_on_duty_hours += driving_duration / 60
                cycle_hours_used += driving_duration / 60
                remaining_driving_time -= driving_duration
            
            # Add fuel stops if needed
            for fuel_stop in fuel_stops:
                if fuel_stop['time'] <= current_time:
                    fuel_entry = {
                        'trip': trip,
                        'day_index': (fuel_stop['time'].date() - start_time.date()).days,
                        'start': fuel_stop['time'],
                        'end': fuel_stop['time'] + timedelta(minutes=fuel_stop['duration']),
                        'duty_status': 'ON_DUTY_NOT_DRIVING',
                        'note': f"Fuel stop at {fuel_stop['distance']:.0f} miles",
                        'rule_applied': 'FMCSA 395.3(a)(2)',
                        'explanation': f"Fuel stop for {fuel_stop['duration']} minutes"
                    }
                    duty_entries.append(fuel_entry)
                    total_on_duty_hours += fuel_stop['duration'] / 60
                    cycle_hours_used += fuel_stop['duration'] / 60
            
            # If we can't drive more, need rest
            if remaining_driving_time > 0:
                # Need to rest until 14-hour window resets
                rest_start = current_time
                rest_end = current_time + timedelta(hours=10)  # 10-hour rest
                
                rest_entry = {
                    'trip': trip,
                    'day_index': (current_time.date() - start_time.date()).days,
                    'start': rest_start,
                    'end': rest_end,
                    'duty_status': 'OFF_DUTY',
                    'note': 'Required rest to reset 14-hour window',
                    'rule_applied': 'FMCSA 395.3(a)(3)(i)',
                    'explanation': '10-hour rest required to reset 14-hour window'
                }
                duty_entries.append(rest_entry)
                current_time = rest_end
                total_driving_hours = 0
                total_on_duty_hours = 0
    
    # Generate log sheet days
    for entry in duty_entries:
        entry_date = entry['start'].date()
        if entry_date not in logsheet_days:
            logsheet_days[entry_date] = {
                'date': entry_date,
                'grid_json': generate_24_hour_grid(entry_date, duty_entries),
                'totals': calculate_daily_totals(entry_date, duty_entries),
                'duty_entries': [e for e in duty_entries if e['start'].date() == entry_date]
            }
    
    return {
        'duty_entries': duty_entries,
        'logsheet_days': list(logsheet_days.values())
    }


def generate_24_hour_grid(day_date: date, duty_entries: List[Dict]) -> List[Dict]:
    """Generate 15-minute grid blocks for a day."""
    grid = []
    day_entries = [e for e in duty_entries if e['start'].date() == day_date]
    
    # Create 15-minute blocks for 24 hours
    for hour in range(24):
        for quarter in range(4):
            block_start = datetime.combine(day_date, datetime.min.time()) + timedelta(hours=hour, minutes=quarter * 15)
            block_end = block_start + timedelta(minutes=15)
            
            # Find duty status for this block
            status = 'OFF_DUTY'
            for entry in day_entries:
                if entry['start'] <= block_start < entry['end']:
                    status = entry['duty_status']
                    break
            
            grid.append({
                'time': block_start.strftime('%H:%M'),
                'status': status,
                'start': block_start.isoformat(),
                'end': block_end.isoformat()
            })
    
    return grid


def calculate_daily_totals(day_date: date, duty_entries: List[Dict]) -> Dict:
    """Calculate daily totals for a specific date."""
    day_entries = [e for e in duty_entries if e['start'].date() == day_date]
    
    totals = {
        'driving_hours': 0,
        'on_duty_hours': 0,
        'off_duty_hours': 0,
        'sleeper_hours': 0
    }
    
    for entry in day_entries:
        duration_hours = (entry['end'] - entry['start']).total_seconds() / 3600
        
        if entry['duty_status'] == 'DRIVING':
            totals['driving_hours'] += duration_hours
            totals['on_duty_hours'] += duration_hours
        elif entry['duty_status'] == 'ON_DUTY_NOT_DRIVING':
            totals['on_duty_hours'] += duration_hours
        elif entry['duty_status'] == 'OFF_DUTY':
            totals['off_duty_hours'] += duration_hours
        elif entry['duty_status'] == 'SLEEPER':
            totals['sleeper_hours'] += duration_hours
    
    return totals
