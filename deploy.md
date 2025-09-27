# Deployment Guide

## Backend Deployment (Render)

1. Connect GitHub repository to Render
2. Create new Web Service
3. Set build command: `cd backend-django && pip install -r requirements.txt`
4. Set start command: `cd backend-django && gunicorn eld_app.wsgi --bind 0.0.0.0:$PORT`
5. Set health check path: `/health/`
6. Configure environment variables:
   - `DATABASE_URL`: PostgreSQL connection string from Supabase
   - `DJANGO_SECRET_KEY`: Generate a secure secret key
   - `MAPBOX_TOKEN`: Mapbox server token
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Frontend Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Set root directory to `frontend-nextjs`
3. Configure environment variables:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox client token
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
   - `NEXT_PUBLIC_API_BASE`: Backend API URL (from Render)

## Environment Variables Setup

### Backend (Render)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
DJANGO_SECRET_KEY=your-secret-key-here
MAPBOX_TOKEN=your-mapbox-server-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-client-token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE=https://your-render-app.onrender.com
```

## Testing

1. Backend health check: `GET https://your-render-app.onrender.com/health/`
2. Frontend: Visit your Vercel URL
3. Test trip creation and ELD log generation
4. Test PDF export and upload functionality
