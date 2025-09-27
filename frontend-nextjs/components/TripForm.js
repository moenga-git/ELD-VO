import { useState } from 'react'
import axios from 'axios'

export default function TripForm({ onTripCreated, loading, setLoading }) {
  const [formData, setFormData] = useState({
    current_location: { lat: '', lng: '' },
    pickup: { lat: '', lng: '' },
    dropoff: { lat: '', lng: '' },
    start_time: '',
    current_cycle_hours_used: 0
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Convert string coordinates to numbers
      const data = {
        ...formData,
        current_location: {
          lat: parseFloat(formData.current_location.lat),
          lng: parseFloat(formData.current_location.lng)
        },
        pickup: {
          lat: parseFloat(formData.pickup.lat),
          lng: parseFloat(formData.pickup.lng)
        },
        dropoff: {
          lat: parseFloat(formData.dropoff.lat),
          lng: parseFloat(formData.dropoff.lng)
        },
        current_cycle_hours_used: parseFloat(formData.current_cycle_hours_used)
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/trips/`,
        data
      )

      onTripCreated(response.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create trip')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Current Location</h3>
          <div className="space-y-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.current_location.lat}
              onChange={(e) => handleInputChange('current_location.lat', e.target.value)}
              className="glass-input w-full"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.current_location.lng}
              onChange={(e) => handleInputChange('current_location.lng', e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Pickup Location</h3>
          <div className="space-y-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.pickup.lat}
              onChange={(e) => handleInputChange('pickup.lat', e.target.value)}
              className="glass-input w-full"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.pickup.lng}
              onChange={(e) => handleInputChange('pickup.lng', e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Dropoff Location</h3>
          <div className="space-y-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.dropoff.lat}
              onChange={(e) => handleInputChange('dropoff.lat', e.target.value)}
              className="glass-input w-full"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.dropoff.lng}
              onChange={(e) => handleInputChange('dropoff.lng', e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Trip Details</h3>
          <div className="space-y-3">
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              className="glass-input w-full"
              required
            />
            <input
              type="number"
              step="0.1"
              placeholder="Current cycle hours used"
              value={formData.current_cycle_hours_used}
              onChange={(e) => handleInputChange('current_cycle_hours_used', e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="glass-button w-full"
      >
        {loading ? 'Creating Trip...' : 'Create Trip'}
      </button>
    </form>
  )
}
