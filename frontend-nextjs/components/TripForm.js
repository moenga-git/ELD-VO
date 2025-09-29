import { useState, useEffect, useRef } from 'react'

export default function TripForm({ onTripCreated, loading, setLoading }) {
  const [formData, setFormData] = useState({
    current_location: '',
    pickup: '',
    dropoff: '',
    start_time: new Date().toISOString().slice(0, 16),
    current_cycle_used: 0
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const currentLocationRef = useRef(null)
  const pickupRef = useRef(null)
  const dropoffRef = useRef(null)

  const [suggestions, setSuggestions] = useState({
    current_location: [],
    pickup: [],
    dropoff: []
  })
  const [activeField, setActiveField] = useState(null)

  const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9lbmdhZGFuaWVsIiwiYSI6ImNtZzBydTQ0bzBmaW4ya3IwcnJ3cmJlOXgifQ.FU3gDRlPI63PE711Gylogg'

  const searchAddress = async (query, field) => {
    if (query.length < 3) {
      setSuggestions(prev => ({ ...prev, [field]: [] }))
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=US`
      )
      const data = await response.json()
      
      if (data.features) {
        setSuggestions(prev => ({
          ...prev,
          [field]: data.features.map(feature => ({
            id: feature.id,
            place_name: feature.place_name,
            coordinates: feature.center
          }))
        }))
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setActiveField(name)
    searchAddress(value, name)
  }

  const selectSuggestion = (suggestion, field) => {
    setFormData(prev => ({ ...prev, [field]: suggestion.place_name }))
    setSuggestions(prev => ({ ...prev, [field]: [] }))
    setActiveField(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

              const handleSubmit = async (e) => {
                e.preventDefault()
                setIsSubmitting(true)
                setError('')

                // Validate required fields
                if (!formData.current_location || !formData.pickup || !formData.dropoff) {
                  setError('Please fill in all location fields')
                  setIsSubmitting(false)
                  return
                }

                try {
                  // Geocode addresses to get lat/lng coordinates
                  const geocodeAddress = async (address) => {
                    const response = await fetch(
                      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`
                    )
                    const data = await response.json()
                    if (data.features && data.features.length > 0) {
                      const [lng, lat] = data.features[0].center
                      return { lat, lng }
                    }
                    throw new Error(`Could not geocode: ${address}`)
                  }

                  const [currentCoords, pickupCoords, dropoffCoords] = await Promise.all([
                    geocodeAddress(formData.current_location),
                    geocodeAddress(formData.pickup),
                    geocodeAddress(formData.dropoff)
                  ])

                  // Call real backend API with proper format
                  const response = await fetch('https://eld-backend-d0tz.onrender.com/api/trips/', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      current_location: {
                        lat: currentCoords.lat,
                        lng: currentCoords.lng
                      },
                      pickup: {
                        lat: pickupCoords.lat,
                        lng: pickupCoords.lng
                      },
                      dropoff: {
                        lat: dropoffCoords.lat,
                        lng: dropoffCoords.lng
                      },
                      start_time: formData.start_time,
                      current_cycle_hours_used: parseFloat(formData.current_cycle_used)
                    })
                  })

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                  }

                  const tripData = await response.json()
                  onTripCreated(tripData)
                  setError('')
                  
                } catch (err) {
                  console.error('Trip creation error:', err)
                  setError('Failed to create trip. Please try again.')
                } finally {
                  setIsSubmitting(false)
                }
              }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Trip</h2>
          <p className="text-gray-600">Enter your trip details to generate ELD logs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Location */}
          <div>
            <label htmlFor="current_location" className="block text-sm font-medium text-gray-700 mb-2">
              Current Location *
            </label>
            <div className="relative">
              <input
                ref={currentLocationRef}
                type="text"
                id="current_location"
                name="current_location"
                value={formData.current_location}
                onChange={handleInputChange}
                onFocus={() => setActiveField('current_location')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start typing your current address..."
                required
              />
              {activeField === 'current_location' && suggestions.current_location.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.current_location.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion, 'current_location')}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{suggestion.place_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Location *
            </label>
            <div className="relative">
              <input
                ref={pickupRef}
                type="text"
                id="pickup"
                name="pickup"
                value={formData.pickup}
                onChange={handleInputChange}
                onFocus={() => setActiveField('pickup')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start typing pickup address..."
                required
              />
              {activeField === 'pickup' && suggestions.pickup.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.pickup.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion, 'pickup')}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{suggestion.place_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dropoff Location */}
          <div>
            <label htmlFor="dropoff" className="block text-sm font-medium text-gray-700 mb-2">
              Dropoff Location *
            </label>
            <div className="relative">
              <input
                ref={dropoffRef}
                type="text"
                id="dropoff"
                name="dropoff"
                value={formData.dropoff}
                onChange={handleInputChange}
                onFocus={() => setActiveField('dropoff')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start typing dropoff address..."
                required
              />
              {activeField === 'dropoff' && suggestions.dropoff.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.dropoff.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion, 'dropoff')}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{suggestion.place_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Start Time *
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Current Cycle Used */}
          <div>
            <label htmlFor="current_cycle_used" className="block text-sm font-medium text-gray-700 mb-2">
              Current Cycle Used (Hours) *
            </label>
            <input
              type="number"
              id="current_cycle_used"
              name="current_cycle_used"
              value={formData.current_cycle_used}
              onChange={handleChange}
              min="0"
              max="70"
              step="0.5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter hours used in current 8-day cycle"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Enter hours used in your current 70-hour/8-day cycle</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Trip...</span>
              </div>
            ) : (
              'Create Trip'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}