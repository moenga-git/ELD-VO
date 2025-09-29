"""
URL configuration for trips app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('trips/', views.create_trip, name='create_trip'),
    path('trips/<uuid:trip_id>/route/', views.get_trip_route, name='get_trip_route'),
    path('trips/<uuid:trip_id>/logs/', views.get_trip_logs, name='get_trip_logs'),
    path('trips/<uuid:trip_id>/recalculate/', views.recalculate_trip, name='recalculate_trip'),
    path('trips/<uuid:trip_id>/upload-url/', views.get_upload_url, name='get_upload_url'),
]
