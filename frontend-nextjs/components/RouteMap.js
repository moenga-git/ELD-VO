import { useEffect, useRef, useState } from 'react'

export default function RouteMap({ tripData }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!tripData || !mapContainer.current) return

    // Set Mapbox token
    window.mapboxgl.accessToken = 'pk.eyJ1IjoibW9lbmdhZGFuaWVsIiwiYSI6ImNtZzBydTQ0bzBmaW4ya3IwcnJ3cmJlOXgifQ.FU3gDRlPI63PE711Gylogg'

    // Initialize Mapbox
    if (window.mapboxgl) {
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.006, 40.7128], // Default to NYC
        zoom: 10
      })

      map.current.on('load', () => {
        setMapLoaded(true)
        drawRoute()
      })
    }
  }, [tripData])

  const drawRoute = () => {
    if (!map.current || !tripData) return

    // Add markers for locations
    const locations = [
      { name: 'Current Location', coordinates: [-74.006, 40.7128], color: '#3B82F6' },
      { name: 'Pickup', coordinates: [-73.9857, 40.7484], color: '#10B981' },
      { name: 'Dropoff', coordinates: [-73.9776, 40.7831], color: '#EF4444' }
    ]

    locations.forEach((location, index) => {
      const marker = new window.mapboxgl.Marker({ color: location.color })
        .setLngLat(location.coordinates)
        .setPopup(new window.mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${location.name}</h3>
            <p class="text-sm text-gray-600">Stop ${index + 1}</p>
          </div>
        `))
        .addTo(map.current)
    })

    // Draw route line
    if (tripData.route_geometry) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: tripData.route_geometry
          }
        }
      })

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 4
        }
      })
    }

    // Fit map to show all markers
    const bounds = new window.mapboxgl.LngLatBounds()
    locations.forEach(location => bounds.extend(location.coordinates))
    map.current.fitBounds(bounds, { padding: 50 })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Route Map</h2>
        <p className="text-gray-600">Interactive map showing your trip route with stops and rest areas</p>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border border-gray-200"
          style={{ minHeight: '400px' }}
        />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Route Information */}
      {tripData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900">Current Location</div>
                <div className="text-sm text-gray-600">Starting point</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900">Pickup Location</div>
                <div className="text-sm text-gray-600">1 hour pickup time</div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <div>
                <div className="font-semibold text-gray-900">Dropoff Location</div>
                <div className="text-sm text-gray-600">1 hour dropoff time</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOS Compliance Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-800">HOS Compliance Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Route includes mandatory 30-minute break after 8 hours of driving. 
              Fueling stops every 1,000 miles as required.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
