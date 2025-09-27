# ELD System Demo Script (3-5 minutes)

## Introduction (30 seconds)
- "This is a full-stack ELD (Electronic Logging Device) system built with Django, Next.js, and Supabase"
- "It implements FMCSA Hours of Service rules for commercial truck drivers"
- "Let me show you the key features"

## Backend Demo (1 minute)
1. Show health endpoint: `GET /health/` returns `{"status":"ok"}`
2. Demonstrate trip creation API:
   - POST to `/api/trips/` with location data
   - Show route calculation with Mapbox integration
   - Display ELD log generation with HOS compliance

## Frontend Demo (2 minutes)
1. **Authentication**: Show Supabase Auth integration
2. **Trip Creation**: 
   - Fill out trip form with current location, pickup, dropoff
   - Show real-time route calculation
3. **Map Visualization**: 
   - Display route on Mapbox map
   - Show markers for start, pickup, dropoff points
4. **ELD Logs**:
   - Show 24-hour grid with color-coded duty status
   - Demonstrate daily totals (driving, on-duty, off-duty hours)
   - Show duty entries with rule explanations
5. **PDF Export**:
   - Generate PDF of ELD logs
   - Upload to Supabase Storage
   - Show public URL for download

## FMCSA Compliance Demo (1 minute)
1. **14-Hour Rule**: Show how system enforces 14-hour on-duty limit
2. **11-Hour Driving**: Demonstrate 11-hour driving limit per 14-hour window
3. **30-Minute Break**: Show automatic break scheduling after 8 hours driving
4. **70-Hour Rule**: Display 70-hour/8-day cycle tracking
5. **Audit Trail**: Show rule_applied and explanation fields for compliance

## Technical Highlights (30 seconds)
- "Built with Django 4.x + DRF backend"
- "Next.js frontend with glassmorphic UI"
- "Supabase for auth and storage"
- "Mapbox for routing and visualization"
- "FMCSA-compliant HOS algorithm"
- "Deployed on Render + Vercel"

## Conclusion
- "This system provides a complete ELD solution for commercial drivers"
- "All code is available on GitHub with full documentation"
- "Ready for production deployment with proper environment variables"
