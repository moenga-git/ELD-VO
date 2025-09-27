from rest_framework import serializers
from .models import Driver, Trip, Segment, DutyEntry, LogSheetDay


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'supabase_user_id', 'name', 'time_base', 'created_at']


class SegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Segment
        fields = ['leg_index', 'start_lat', 'start_lng', 'end_lat', 'end_lng', 
                 'distance_miles', 'duration_minutes', 'geometry']


class DutyEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DutyEntry
        fields = ['day_index', 'start', 'end', 'duty_status', 'note', 
                 'rule_applied', 'explanation']


class LogSheetDaySerializer(serializers.ModelSerializer):
    duty_entries = DutyEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = LogSheetDay
        fields = ['date', 'grid_json', 'duty_entries']


class TripCreateSerializer(serializers.Serializer):
    current_location = serializers.DictField(child=serializers.FloatField())
    pickup = serializers.DictField(child=serializers.FloatField())
    dropoff = serializers.DictField(child=serializers.FloatField())
    start_time = serializers.DateTimeField()
    current_cycle_hours_used = serializers.FloatField()


class TripSerializer(serializers.ModelSerializer):
    segments = SegmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Trip
        fields = ['id', 'driver', 'start_time', 'start_lat', 'start_lng',
                 'pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng',
                 'cycle_hours_used', 'distance_miles', 'duration_minutes',
                 'pdf_url', 'created_at', 'segments']


class RouteResponseSerializer(serializers.Serializer):
    total_distance_mi = serializers.FloatField()
    total_duration_min = serializers.IntegerField()
    legs = SegmentSerializer(many=True)


class LogsResponseSerializer(serializers.Serializer):
    trip_id = serializers.UUIDField()
    logs = LogSheetDaySerializer(many=True)


class UploadUrlResponseSerializer(serializers.Serializer):
    upload_url = serializers.URLField()
    public_url = serializers.URLField()
