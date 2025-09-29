"""
WSGI config for eld_app project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eld_app.settings')

application = get_wsgi_application()
