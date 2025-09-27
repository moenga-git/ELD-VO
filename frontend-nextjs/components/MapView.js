import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapView({ route }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!route || map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [route.legs[0]?.start_lng || -74.0060, route.legs[0]?.start_lat || 40.7128],
      zoom: 10
    })

    map.current.on('load', () => {
      setMapLoaded(true)
      
      // Add route source
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.legs.flatMap(leg => leg.geometry.coordinates)
          }
        }
      })

      // Add route layer
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00C7B7',
          'line-width': 4
        }
      })

      // Add markers
      route.legs.forEach((leg, index) => {
        const isStart = index === 0
        const isEnd = index === route.legs.length - 1
        
        let color = '#00C7B7'
        let label = 'Waypoint'
        
        if (isStart) {
          color = '#ec4b4b'
          label = 'Start'
        } else if (isEnd) {
          color = '#2ecc71'
          label = 'End'
        } else if (leg.is_pickup) {
          color = '#ff9f43'
          label = 'Pickup'
        } else if (leg.is_dropoff) {
          color = '#3da3ff'
          label = 'Dropoff'
        }

        new mapboxgl.Marker({ color })
          .setLngLat([leg.start_lng, leg.start_lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${label}</h3>
              <p>Distance: ${leg.distance_miles.toFixed(1)} mi</p>
              <p>Duration: ${Math.round(leg.duration_minutes / 60)}h ${leg.duration_minutes % 60}m</p>
            </div>
          `))
          .addTo(map.current)
      })

      // Fit map to route bounds
      if (route.legs.length > 0) {
        const coordinates = route.legs.flatMap(leg => [
          [leg.start_lng, leg.start_lat],
          [leg.end_lng, leg.end_lat]
        ])
        
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord)
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

        map.current.fitBounds(bounds, { padding: 50 })
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [route])

  if (!route) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-white/80">No route data available</p>
      </div>
    )
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
