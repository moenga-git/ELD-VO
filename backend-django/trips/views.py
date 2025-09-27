"""
API views for trips application.
"""
import os
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Trip, Segment, DutyEntry, LogSheetDay
from .serializers import (
    TripCreateSerializer, TripSerializer, RouteResponseSerializer, 
    LogsResponseSerializer, UploadUrlResponseSerializer
)
from .services.routing import get_route
from .eld_algorithm import generate_logs
from .auth import optional_supabase_auth, require_supabase_auth
from supabase import create_client, Client

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
@optional_supabase_auth
def create_trip(request):
    """Create a new trip with routing and ELD logs."""
    serializer = TripCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    current_location = data['current_location']
    pickup = data['pickup']
    dropoff = data['dropoff']
    start_time = data['start_time']
    current_cycle_hours_used = data['current_cycle_hours_used']
    
    # Get route from Mapbox
    try:
        route_data = get_route(
            (current_location['lat'], current_location['lng']),
            (pickup['lat'], pickup['lng']),
            (dropoff['lat'], dropoff['lng'])
        )
    except Exception as e:
        logger.error(f"Routing failed: {e}")
        return Response({
            'error': 'Routing failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Create trip
    trip = Trip.objects.create(
        driver=getattr(request, 'driver', None),
        start_time=start_time,
        start_lat=current_location['lat'],
        start_lng=current_location['lng'],
        pickup_lat=pickup['lat'],
        pickup_lng=pickup['lng'],
        dropoff_lat=dropoff['lat'],
        dropoff_lng=dropoff['lng'],
        cycle_hours_used=current_cycle_hours_used,
        distance_miles=route_data['total_distance_mi'],
        duration_minutes=route_data['total_duration_min']
    )
    
    # Create segments
    for leg_data in route_data['legs']:
        Segment.objects.create(
            trip=trip,
            leg_index=leg_data['leg_index'],
            start_lat=leg_data['start_lat'],
            start_lng=leg_data['start_lng'],
            end_lat=leg_data['end_lat'],
            end_lng=leg_data['end_lng'],
            distance_miles=leg_data['distance_miles'],
            duration_minutes=leg_data['duration_minutes'],
            geometry=leg_data['geometry']
        )
    
    # Generate ELD logs
    try:
        logs_data = generate_logs(
            trip=trip,
            legs=route_data['legs'],
            start_time_iso=start_time.isoformat(),
            current_cycle_hours_used=current_cycle_hours_used
        )
        
        # Create duty entries
        for entry_data in logs_data['duty_entries']:
            DutyEntry.objects.create(
                trip=trip,
                day_index=entry_data['day_index'],
                start=entry_data['start'],
                end=entry_data['end'],
                duty_status=entry_data['duty_status'],
                note=entry_data['note'],
                rule_applied=entry_data['rule_applied'],
                explanation=entry_data['explanation']
            )
        
        # Create log sheet days
        for day_data in logs_data['logsheet_days']:
            LogSheetDay.objects.create(
                trip=trip,
                date=day_data['date'],
                grid_json=day_data['grid_json']
            )
            
    except Exception as e:
        logger.error(f"ELD log generation failed: {e}")
        return Response({
            'error': 'ELD log generation failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'trip_id': str(trip.id),
        'distance_miles': trip.distance_miles,
        'duration_minutes': trip.duration_minutes,
        'summary': {
            'total_distance_mi': route_data['total_distance_mi'],
            'total_duration_min': route_data['total_duration_min'],
            'legs_count': len(route_data['legs'])
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_trip_route(request, trip_id):
    """Get route information for a trip."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({
            'error': 'Trip not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    segments = trip.segments.all().order_by('leg_index')
    
    legs = []
    for segment in segments:
        legs.append({
            'leg_index': segment.leg_index,
            'start_lat': segment.start_lat,
            'start_lng': segment.start_lng,
            'end_lat': segment.end_lat,
            'end_lng': segment.end_lng,
            'distance_miles': segment.distance_miles,
            'duration_minutes': segment.duration_minutes,
            'geometry': segment.geometry,
            'is_pickup': segment.leg_index == 0,
            'is_dropoff': segment.leg_index == len(segments) - 1
        })
    
    return Response({
        'total_distance_mi': trip.distance_miles,
        'total_duration_min': trip.duration_minutes,
        'legs': legs
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_trip_logs(request, trip_id):
    """Get ELD logs for a trip."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({
            'error': 'Trip not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    log_sheet_days = trip.log_sheet_days.all().order_by('date')
    
    logs = []
    for day in log_sheet_days:
        duty_entries = trip.duty_entries.filter(
            start__date=day.date
        ).order_by('start')
        
        logs.append({
            'date': day.date.isoformat(),
            'grid_json': day.grid_json,
            'totals': calculate_daily_totals(day.date, duty_entries),
            'duty_entries': [{
                'start': entry.start.isoformat(),
                'end': entry.end.isoformat(),
                'duty_status': entry.duty_status,
                'note': entry.note,
                'rule_applied': entry.rule_applied,
                'explanation': entry.explanation
            } for entry in duty_entries]
        })
    
    return Response({
        'trip_id': str(trip.id),
        'logs': logs
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@optional_supabase_auth
def recalculate_trip(request, trip_id):
    """Recalculate trip with updated parameters."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({
            'error': 'Trip not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = TripCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    # Clear existing data
    trip.segments.all().delete()
    trip.duty_entries.all().delete()
    trip.log_sheet_days.all().delete()
    
    # Update trip with new data
    trip.start_time = data['start_time']
    trip.start_lat = data['current_location']['lat']
    trip.start_lng = data['current_location']['lng']
    trip.pickup_lat = data['pickup']['lat']
    trip.pickup_lng = data['pickup']['lng']
    trip.dropoff_lat = data['dropoff']['lat']
    trip.dropoff_lng = data['dropoff']['lng']
    trip.cycle_hours_used = data['current_cycle_hours_used']
    
    # Get new route
    try:
        route_data = get_route(
            (data['current_location']['lat'], data['current_location']['lng']),
            (data['pickup']['lat'], data['pickup']['lng']),
            (data['dropoff']['lat'], data['dropoff']['lng'])
        )
        
        trip.distance_miles = route_data['total_distance_mi']
        trip.duration_minutes = route_data['total_duration_min']
        trip.save()
        
        # Create new segments
        for leg_data in route_data['legs']:
            Segment.objects.create(
                trip=trip,
                leg_index=leg_data['leg_index'],
                start_lat=leg_data['start_lat'],
                start_lng=leg_data['start_lng'],
                end_lat=leg_data['end_lat'],
                end_lng=leg_data['end_lng'],
                distance_miles=leg_data['distance_miles'],
                duration_minutes=leg_data['duration_minutes'],
                geometry=leg_data['geometry']
            )
        
        # Generate new ELD logs
        logs_data = generate_logs(
            trip=trip,
            legs=route_data['legs'],
            start_time_iso=data['start_time'].isoformat(),
            current_cycle_hours_used=data['current_cycle_hours_used']
        )
        
        # Create new duty entries
        for entry_data in logs_data['duty_entries']:
            DutyEntry.objects.create(
                trip=trip,
                day_index=entry_data['day_index'],
                start=entry_data['start'],
                end=entry_data['end'],
                duty_status=entry_data['duty_status'],
                note=entry_data['note'],
                rule_applied=entry_data['rule_applied'],
                explanation=entry_data['explanation']
            )
        
        # Create new log sheet days
        for day_data in logs_data['logsheet_days']:
            LogSheetDay.objects.create(
                trip=trip,
                date=day_data['date'],
                grid_json=day_data['grid_json']
            )
            
    except Exception as e:
        logger.error(f"Recalculation failed: {e}")
        return Response({
            'error': 'Recalculation failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'trip_id': str(trip.id),
        'distance_miles': trip.distance_miles,
        'duration_minutes': trip.duration_minutes,
        'summary': {
            'total_distance_mi': route_data['total_distance_mi'],
            'total_duration_min': route_data['total_duration_min'],
            'legs_count': len(route_data['legs'])
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@require_supabase_auth
def get_upload_url(request, trip_id):
    """Get signed upload URL for PDF logs."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({
            'error': 'Trip not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Initialize Supabase client
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        return Response({
            'error': 'Supabase configuration missing'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Generate file path
        file_path = f"logs/{trip_id}.pdf"
        
        # Create signed upload URL
        upload_response = supabase.storage.from_('logs').create_signed_upload_url(file_path)
        
        if 'error' in upload_response:
            logger.error(f"Supabase upload URL creation failed: {upload_response['error']}")
            return Response({
                'error': 'Upload URL creation failed',
                'message': upload_response['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        upload_url = upload_response['signedURL']
        public_url = f"{supabase_url}/storage/v1/object/public/logs/{file_path}"
        
        return Response({
            'upload_url': upload_url,
            'public_url': public_url
        })
        
    except Exception as e:
        logger.error(f"Supabase upload URL creation failed: {e}")
        return Response({
            'error': 'Upload URL creation failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def calculate_daily_totals(day_date, duty_entries):
    """Calculate daily totals for a specific date."""
    from datetime import date
    
    totals = {
        'driving_hours': 0,
        'on_duty_hours': 0,
        'off_duty_hours': 0,
        'sleeper_hours': 0
    }
    
    for entry in duty_entries:
        duration_hours = (entry.end - entry.start).total_seconds() / 3600
        
        if entry.duty_status == 'DRIVING':
            totals['driving_hours'] += duration_hours
            totals['on_duty_hours'] += duration_hours
        elif entry.duty_status == 'ON_DUTY_NOT_DRIVING':
            totals['on_duty_hours'] += duration_hours
        elif entry.duty_status == 'OFF_DUTY':
            totals['off_duty_hours'] += duration_hours
        elif entry.duty_status == 'SLEEPER':
            totals['sleeper_hours'] += duration_hours
    
    return totals
