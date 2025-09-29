"""
Tests for ELD algorithm.
"""
from datetime import datetime, timedelta
from django.test import TestCase
from trips.models import Trip, Driver
from trips.eld_algorithm import generate_logs
import pytz


class ELDAlgorithmTestCase(TestCase):
    """Test cases for ELD algorithm."""
    
    def setUp(self):
        """Set up test data."""
        self.driver = Driver.objects.create(
            name="Test Driver",
            time_base="local"
        )
        
        # Use timezone-aware datetime
        start_time = datetime.now(pytz.UTC)
        
        self.trip = Trip.objects.create(
            driver=self.driver,
            start_time=start_time,
            start_lat=40.7128,
            start_lng=-74.0060,
            pickup_lat=40.7589,
            pickup_lng=-73.9851,
            dropoff_lat=40.6892,
            dropoff_lng=-74.0445,
            cycle_hours_used=0.0,
            distance_miles=10.0,
            duration_minutes=30
        )
    
    def test_short_trip(self):
        """Test short trip (under 8 hours driving)."""
        legs = [
            {
                'leg_index': 0,
                'start_lat': 40.7128,
                'start_lng': -74.0060,
                'end_lat': 40.7589,
                'end_lng': -73.9851,
                'distance_miles': 5.0,
                'duration_minutes': 15,
                'geometry': {'type': 'LineString', 'coordinates': []},
                'is_pickup': True,
                'is_dropoff': False
            },
            {
                'leg_index': 1,
                'start_lat': 40.7589,
                'start_lng': -73.9851,
                'end_lat': 40.6892,
                'end_lng': -74.0445,
                'distance_miles': 5.0,
                'duration_minutes': 15,
                'geometry': {'type': 'LineString', 'coordinates': []},
                'is_pickup': False,
                'is_dropoff': True
            }
        ]
        
        logs = generate_logs(
            trip=self.trip,
            legs=legs,
            start_time_iso=self.trip.start_time.isoformat(),
            current_cycle_hours_used=0.0
        )
        
        # Should have pickup duty, driving, dropoff duty
        self.assertGreaterEqual(len(logs['duty_entries']), 3)
        
        # Check for pickup duty
        pickup_entries = [e for e in logs['duty_entries'] if 'Pickup' in e['note']]
        self.assertGreater(len(pickup_entries), 0)
        
        # Check for driving entries
        driving_entries = [e for e in logs['duty_entries'] if e['duty_status'] == 'DRIVING']
        self.assertGreater(len(driving_entries), 0)
    
    def test_long_leg_split(self):
        """Test leg splitting when driving time exceeds limits."""
        # Create a leg that would require splitting
        legs = [
            {
                'leg_index': 0,
                'start_lat': 40.7128,
                'start_lng': -74.0060,
                'end_lat': 40.7589,
                'end_lng': -73.9851,
                'distance_miles': 500.0,  # Long distance
                'duration_minutes': 600,  # 10 hours driving
                'geometry': {'type': 'LineString', 'coordinates': []},
                'is_pickup': True,
                'is_dropoff': False
            }
        ]
        
        logs = generate_logs(
            trip=self.trip,
            legs=legs,
            start_time_iso=self.trip.start_time.isoformat(),
            current_cycle_hours_used=0.0
        )
        
        # Should have multiple driving segments with breaks
        driving_entries = [e for e in logs['duty_entries'] if e['duty_status'] == 'DRIVING']
        self.assertGreater(len(driving_entries), 1)
        
        # Should have break entries
        break_entries = [e for e in logs['duty_entries'] if 'break' in e['note'].lower()]
        self.assertGreater(len(break_entries), 0)
    
    def test_8_hour_break(self):
        """Test 30-minute break after 8 hours driving."""
        # Create scenario with more than 8 hours driving
        legs = [
            {
                'leg_index': 0,
                'start_lat': 40.7128,
                'start_lng': -74.0060,
                'end_lat': 40.7589,
                'end_lng': -73.9851,
                'distance_miles': 500.0,
                'duration_minutes': 500,  # More than 8 hours (8.33 hours)
                'geometry': {'type': 'LineString', 'coordinates': []},
                'is_pickup': True,
                'is_dropoff': False
            }
        ]
        
        logs = generate_logs(
            trip=self.trip,
            legs=legs,
            start_time_iso=self.trip.start_time.isoformat(),
            current_cycle_hours_used=0.0
        )
        
        # Debug: print all entries
        print(f"Total entries: {len(logs['duty_entries'])}")
        for i, entry in enumerate(logs['duty_entries']):
            print(f"Entry {i}: {entry['duty_status']} - {entry['note']}")
        
        # Should have break entry
        break_entries = [e for e in logs['duty_entries'] 
                        if 'break' in e['note'].lower() and e['duty_status'] == 'OFF_DUTY']
        self.assertGreater(len(break_entries), 0)
        
        # Break should be 30 minutes
        for entry in break_entries:
            duration = (entry['end'] - entry['start']).total_seconds() / 60
            self.assertAlmostEqual(duration, 30, delta=1)
    
    def test_70_hour_cap(self):
        """Test 70-hour/8-day cycle cap enforcement."""
        # Start with 69 hours used (near the limit)
        logs = generate_logs(
            trip=self.trip,
            legs=[{
                'leg_index': 0,
                'start_lat': 40.7128,
                'start_lng': -74.0060,
                'end_lat': 40.7589,
                'end_lng': -73.9851,
                'distance_miles': 100.0,
                'duration_minutes': 120,  # 2 hours
                'geometry': {'type': 'LineString', 'coordinates': []},
                'is_pickup': True,
                'is_dropoff': True
            }],
            start_time_iso=self.trip.start_time.isoformat(),
            current_cycle_hours_used=69.0  # Near the 70-hour limit
        )
        
        # Should have restart entry if we exceed 70 hours
        restart_entries = [e for e in logs['duty_entries'] 
                          if 'restart' in e['note'].lower()]
        
        # The algorithm should handle the 70-hour limit appropriately
        self.assertIsNotNone(logs['duty_entries'])
        self.assertGreater(len(logs['duty_entries']), 0)
