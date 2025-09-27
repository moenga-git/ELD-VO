from django.db import models
import uuid
import json


class Driver(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supabase_user_id = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255)
    time_base = models.CharField(max_length=10, choices=[('local', 'Local'), ('UTC', 'UTC')], default='local')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.id})"


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField()
    start_lat = models.FloatField()
    start_lng = models.FloatField()
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()
    cycle_hours_used = models.FloatField()
    distance_miles = models.FloatField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    pdf_url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip {self.id} - {self.start_time}"


class Segment(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='segments')
    leg_index = models.IntegerField()
    start_lat = models.FloatField()
    start_lng = models.FloatField()
    end_lat = models.FloatField()
    end_lng = models.FloatField()
    distance_miles = models.FloatField()
    duration_minutes = models.IntegerField()
    geometry = models.JSONField()

    class Meta:
        ordering = ['leg_index']

    def __str__(self):
        return f"Segment {self.leg_index} of Trip {self.trip.id}"


class DutyEntry(models.Model):
    DUTY_STATUS_CHOICES = [
        ('DRIVING', 'Driving'),
        ('ON_DUTY_NOT_DRIVING', 'On Duty Not Driving'),
        ('OFF_DUTY', 'Off Duty'),
        ('SLEEPER', 'Sleeper Berth'),
    ]
    
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='duty_entries')
    day_index = models.IntegerField()
    start = models.DateTimeField()
    end = models.DateTimeField()
    duty_status = models.CharField(max_length=20, choices=DUTY_STATUS_CHOICES)
    note = models.TextField(blank=True)
    rule_applied = models.TextField()
    explanation = models.TextField()

    class Meta:
        ordering = ['start']

    def __str__(self):
        return f"{self.duty_status} from {self.start} to {self.end}"


class LogSheetDay(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='log_sheet_days')
    date = models.DateField()
    grid_json = models.JSONField()

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"Log Sheet for {self.date}"
