"""
Supabase Auth integration for Django.
"""
import os
import requests
import logging
from functools import wraps
from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser
from .models import Driver

logger = logging.getLogger(__name__)


def get_user_from_token(access_token: str) -> dict:
    """
    Get user information from Supabase using access token.
    
    Args:
        access_token: Supabase access token
        
    Returns:
        User dict from Supabase or None if invalid
    """
    supabase_url = os.environ.get('SUPABASE_URL')
    if not supabase_url:
        logger.error("SUPABASE_URL not configured")
        return None
    
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f"{supabase_url}/auth/v1/user",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Supabase auth failed: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Supabase auth request failed: {e}")
        return None


def get_or_create_driver(user_data: dict) -> Driver:
    """
    Get or create Driver record from Supabase user data.
    
    Args:
        user_data: User data from Supabase
        
    Returns:
        Driver instance
    """
    user_id = user_data.get('id')
    if not user_id:
        raise ValueError("User ID not found in Supabase response")
    
    # Try to get existing driver
    try:
        driver = Driver.objects.get(supabase_user_id=user_id)
        return driver
    except Driver.DoesNotExist:
        pass
    
    # Create new driver
    name = user_data.get('user_metadata', {}).get('name', 'Unknown Driver')
    if not name or name == 'Unknown Driver':
        name = user_data.get('email', 'Unknown Driver')
    
    driver = Driver.objects.create(
        supabase_user_id=user_id,
        name=name,
        time_base='local'
    )
    
    logger.info(f"Created new driver: {driver.name} ({driver.id})")
    return driver


def require_supabase_auth(view_func):
    """
    Decorator to require Supabase authentication.
    
    Attaches driver to request.driver if authenticated.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Bearer token required'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        user_data = get_user_from_token(token)
        
        if not user_data:
            return JsonResponse({
                'error': 'Invalid token',
                'message': 'Supabase token validation failed'
            }, status=401)
        
        try:
            driver = get_or_create_driver(user_data)
            request.driver = driver
            return view_func(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Driver creation/retrieval failed: {e}")
            return JsonResponse({
                'error': 'Driver setup failed',
                'message': str(e)
            }, status=500)
    
    return wrapper


def optional_supabase_auth(view_func):
    """
    Decorator for optional Supabase authentication.
    
    Attaches driver to request.driver if authenticated, otherwise None.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            request.driver = None
            return view_func(request, *args, **kwargs)
        
        token = auth_header.split(' ')[1]
        user_data = get_user_from_token(token)
        
        if not user_data:
            request.driver = None
            return view_func(request, *args, **kwargs)
        
        try:
            driver = get_or_create_driver(user_data)
            request.driver = driver
        except Exception as e:
            logger.error(f"Driver creation/retrieval failed: {e}")
            request.driver = None
        
        return view_func(request, *args, **kwargs)
    
    return wrapper
