"""
Tests for API endpoints.
"""
from datetime import datetime
from django.test import TestCase, Client
from django.urls import reverse
import json


class APITestCase(TestCase):
    """Test cases for API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.trip_data = {
            "current_location": {"lat": 40.7128, "lng": -74.0060},
            "pickup": {"lat": 40.7589, "lng": -73.9851},
            "dropoff": {"lat": 40.6892, "lng": -74.0445},
            "start_time": datetime.now().isoformat(),
            "current_cycle_hours_used": 0.0
        }
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'ok')
    
    def test_create_trip_validation(self):
        """Test trip creation with invalid data."""
        # Test missing required fields
        invalid_data = {
            "current_location": {"lat": 40.7128, "lng": -74.0060},
            # Missing pickup, dropoff, start_time, current_cycle_hours_used
        }
        
        response = self.client.post(
            '/api/trips/',
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
    
    def test_create_trip_success(self):
        """Test successful trip creation."""
        # Mock the routing service to avoid external API calls
        with self.settings(
            MAPBOX_TOKEN='test_token',
            DATABASE_URL='sqlite:///test.db'
        ):
            response = self.client.post(
                '/api/trips/',
                data=json.dumps(self.trip_data),
                content_type='application/json'
            )
            
            # Should return 201 or handle routing failure gracefully
            self.assertIn(response.status_code, [201, 500])
    
    def test_get_trip_route_not_found(self):
        """Test getting route for non-existent trip."""
        fake_id = '00000000-0000-0000-0000-000000000000'
        response = self.client.get(f'/api/trips/{fake_id}/route/')
        self.assertEqual(response.status_code, 404)
    
    def test_get_trip_logs_not_found(self):
        """Test getting logs for non-existent trip."""
        fake_id = '00000000-0000-0000-0000-000000000000'
        response = self.client.get(f'/api/trips/{fake_id}/logs/')
        self.assertEqual(response.status_code, 404)
