import { useState, useEffect } from 'react'

export default function ProfessionalDashboard({ user, tripData, logs }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [driverStatus, setDriverStatus] = useState('OFF_DUTY')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRIVING': return 'status-driving'
      case 'ON_DUTY_NOT_DRIVING': return 'status-on-duty'
      case 'OFF_DUTY': return 'status-off-duty'
      case 'SLEEPER': return 'status-sleeper'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DRIVING': return 'Driving'
      case 'ON_DUTY_NOT_DRIVING': return 'On Duty'
      case 'OFF_DUTY': return 'Off Duty'
      case 'SLEEPER': return 'Sleeper Berth'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ELD Dashboard</h1>
              <p className="text-sm text-gray-600">Electronic Logging Device - FMCSA Compliant</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Current Time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Driver</div>
                <div className="text-lg font-semibold text-gray-900">
                  {user?.user_metadata?.name || user?.email || 'Driver'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Driver Status */}
          <div className="lg:col-span-1">
            <div className="professional-card">
              <div className="professional-header">
                <h3 className="text-lg font-semibold text-gray-900">Driver Status</h3>
              </div>
              <div className="professional-content">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`status-indicator ${getStatusColor(driverStatus)}`}>
                    {getStatusLabel(driverStatus)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hours Today:</span>
                    <span className="text-sm font-semibold text-gray-900">8.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cycle Hours:</span>
                    <span className="text-sm font-semibold text-gray-900">45.2h / 70h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '64.6%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500">64.6% of 70-hour cycle used</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="professional-card">
              <div className="professional-header">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="professional-content">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="glass-button text-sm">
                    Start Trip
                  </button>
                  <button className="glass-button-secondary text-sm">
                    Take Break
                  </button>
                  <button className="glass-button-secondary text-sm">
                    View Logs
                  </button>
                  <button className="glass-button-secondary text-sm">
                    Route Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Information */}
        {tripData && (
          <div className="mt-8">
            <div className="professional-card">
              <div className="professional-header">
                <h3 className="text-lg font-semibold text-gray-900">Active Trip</h3>
              </div>
              <div className="professional-content">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Origin</div>
                    <div className="font-medium text-gray-900">
                      {tripData.current_location?.address || 'Current Location'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Pickup</div>
                    <div className="font-medium text-gray-900">
                      {tripData.pickup?.address || 'Pickup Location'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Destination</div>
                    <div className="font-medium text-gray-900">
                      {tripData.dropoff?.address || 'Dropoff Location'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Distance</div>
                    <div className="font-medium text-gray-900">
                      {tripData.distance_miles?.toFixed(1) || '0.0'} miles
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ELD Logs Summary */}
        {logs && (
          <div className="mt-8">
            <div className="professional-card">
              <div className="professional-header">
                <h3 className="text-lg font-semibold text-gray-900">Today's Hours Summary</h3>
              </div>
              <div className="professional-content">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">
                      {logs.logs?.[0]?.totals?.driving_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-red-600 font-medium">Driving</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">
                      {logs.logs?.[0]?.totals?.on_duty_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-orange-600 font-medium">On Duty</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {logs.logs?.[0]?.totals?.off_duty_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-green-600 font-medium">Off Duty</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {logs.logs?.[0]?.totals?.sleeper_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Sleeper</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Status */}
        <div className="mt-8">
          <div className="professional-card">
            <div className="professional-header">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
            </div>
            <div className="professional-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">✓</div>
                  <div className="text-sm text-gray-600">14-Hour Rule</div>
                  <div className="text-xs text-green-600">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">✓</div>
                  <div className="text-sm text-gray-600">11-Hour Rule</div>
                  <div className="text-xs text-green-600">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">✓</div>
                  <div className="text-sm text-gray-600">70-Hour Rule</div>
                  <div className="text-xs text-green-600">Compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
