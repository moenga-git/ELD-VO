# ELD (Electronic Logging Device) System

A full-stack application for FMCSA-compliant electronic logging with route planning, HOS (Hours of Service) compliance, and PDF export capabilities.

## Architecture

- **Frontend**: Next.js (React) deployed on Vercel
- **Backend**: Django 4.x + DRF deployed on Render
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for PDF logs
- **Maps**: Mapbox for routing and visualization
- **CI/CD**: GitHub Actions

## Features

- ✅ FMCSA HOS Rules Implementation
  - 14-hour window logic
  - 11-hour driving limit per 14-hour window
  - 30-minute break after 8 hours driving
  - 70-hour/8-day rolling cap
  - Fuel stops and duty time management

- ✅ Route Planning & Visualization
  - Mapbox integration with traffic data
  - Fallback routing for API failures
  - Interactive map with markers and polylines

- ✅ ELD Log Generation
  - Automated duty status calculation
  - 15-minute grid resolution
  - Auditable rule explanations
  - Multi-day log sheets

- ✅ PDF Export & Storage
  - Client-side PDF generation
  - Supabase Storage integration
  - Signed upload URLs

- ✅ Authentication
  - Supabase Auth integration
  - Driver profile management
  - Protected endpoints

## Project Structure

```
├── backend-django/           # Django backend
│   ├── eld_app/             # Django project
│   ├── trips/               # Main app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API endpoints
│   │   ├── serializers.py  # Data serialization
│   │   ├── auth.py         # Supabase auth integration
│   │   ├── eld_algorithm.py # FMCSA HOS rules
│   │   └── services/        # Routing service
│   ├── tests/              # Unit tests
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Container config
│   └── Procfile           # Render deployment
├── frontend-nextjs/        # Next.js frontend
│   ├── pages/             # Next.js pages
│   ├── components/        # React components
│   ├── styles/           # CSS styles
│   └── package.json      # Node dependencies
├── .github/workflows/     # CI/CD
└── README.md             # This file
```

## API Endpoints

### Trip Management
- `POST /api/trips/` - Create new trip with routing
- `GET /api/trips/{id}/route/` - Get route details
- `GET /api/trips/{id}/logs/` - Get ELD logs
- `POST /api/trips/{id}/recalculate/` - Recalculate trip
- `POST /api/trips/{id}/upload-url/` - Get PDF upload URL

### Health Check
- `GET /health/` - Service health status

## Environment Variables

### Backend (Render)
- `DATABASE_URL` - PostgreSQL connection string
- `DJANGO_SECRET_KEY` - Django secret key
- `MAPBOX_TOKEN` - Mapbox server token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Frontend (Vercel)
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox client token
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_API_BASE` - Backend API URL

## Development Setup

### Backend
```bash
cd backend-django
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend-nextjs
npm install
npm run dev
```

## Testing

```bash
# Backend tests
cd backend-django
python manage.py test

# CI runs automatically on PR/push
```

## Deployment

### Backend (Render)
1. Connect GitHub repository
2. Create Web Service pointing to `/backend-django`
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn eld_app.wsgi --bind 0.0.0.0:$PORT`
5. Configure environment variables
6. Set health check: `/health/`

### Frontend (Vercel)
1. Connect GitHub repository
2. Set root directory to `/frontend-nextjs`
3. Configure environment variables
4. Deploy

## FMCSA Compliance

This system implements the following FMCSA Hours of Service rules:

- **14-Hour Rule**: Maximum 14 hours on duty per day
- **11-Hour Rule**: Maximum 11 hours driving per 14-hour window
- **30-Minute Break**: Required after 8 hours driving
- **70-Hour Rule**: Maximum 70 hours in 8-day rolling period
- **34-Hour Restart**: Reset 70-hour clock

All duty entries include:
- Rule applied (FMCSA reference)
- Explanation of compliance logic
- Timestamp and duration
- Status classification

## License

MIT License - see LICENSE file for details.