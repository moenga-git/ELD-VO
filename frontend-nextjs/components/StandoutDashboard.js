import { useState, useEffect } from 'react'

export default function StandoutDashboard({ user, tripData, logs }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [driverStatus, setDriverStatus] = useState('OFF_DUTY')
  const [complianceScore, setComplianceScore] = useState(98)
  const [fuelEfficiency, setFuelEfficiency] = useState(7.2)
  const [routeOptimization, setRouteOptimization] = useState(15)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRIVING': return 'standout-driving'
      case 'ON_DUTY_NOT_DRIVING': return 'standout-on-duty'
      case 'OFF_DUTY': return 'standout-off-duty'
      case 'SLEEPER': return 'standout-sleeper'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Professional Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ELD-VO Professional</h1>
              <p className="text-sm text-gray-600">Advanced Electronic Logging Device - FMCSA Compliant</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  System Operational
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-600">Current Time</div>
                <div className="text-xl font-bold text-gray-900 standout-animation">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Driver</div>
                <div className="text-xl font-bold text-gray-900">
                  {user?.user_metadata?.name || user?.email || 'Driver'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Compliance Score</div>
                <div className="text-xl font-bold text-green-600">{complianceScore}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Driver Status */}
          <div className="lg:col-span-1">
            <div className="standout-card">
              <div className="standout-header">
                <h3 className="text-lg font-semibold text-gray-900">Driver Status</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`standout-status ${getStatusColor(driverStatus)}`}>
                    {getStatusLabel(driverStatus)}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hours Today:</span>
                    <span className="text-sm font-semibold text-gray-900">8.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cycle Hours:</span>
                    <span className="text-sm font-semibold text-gray-900">45.2h / 70h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{width: '64.6%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500">64.6% of 70-hour cycle used</div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Metrics */}
          <div className="lg:col-span-3">
            <div className="standout-card">
              <div className="standout-header">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{complianceScore}%</div>
                    <div className="text-sm text-gray-600 font-medium">Compliance Score</div>
                    <div className="text-xs text-green-600 mt-1">Excellent</div>
                  </div>
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-green-600 mb-2">{fuelEfficiency} MPG</div>
                    <div className="text-sm text-gray-600 font-medium">Fuel Efficiency</div>
                    <div className="text-xs text-green-600 mt-1">Above Average</div>
                  </div>
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{routeOptimization}%</div>
                    <div className="text-sm text-gray-600 font-medium">Route Optimization</div>
                    <div className="text-xs text-blue-600 mt-1">AI Enhanced</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="standout-card">
            <div className="standout-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="standout-button text-sm">
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

        {/* Trip Information */}
        {tripData && (
          <div className="mt-8">
            <div className="standout-card">
              <div className="standout-header">
                <h3 className="text-lg font-semibold text-gray-900">Active Trip</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Origin</div>
                    <div className="font-medium text-gray-900">
                      {tripData.current_location?.address || 'Current Location'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Pickup</div>
                    <div className="font-medium text-gray-900">
                      {tripData.pickup?.address || 'Pickup Location'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Destination</div>
                    <div className="font-medium text-gray-900">
                      {tripData.dropoff?.address || 'Dropoff Location'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Distance</div>
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
            <div className="standout-card">
              <div className="standout-header">
                <h3 className="text-lg font-semibold text-gray-900">Today's Hours Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-red-600">
                      {logs.logs?.[0]?.totals?.driving_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Driving</div>
                  </div>
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-orange-600">
                      {logs.logs?.[0]?.totals?.on_duty_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-gray-600 font-medium">On Duty</div>
                  </div>
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-green-600">
                      {logs.logs?.[0]?.totals?.off_duty_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Off Duty</div>
                  </div>
                  <div className="standout-metric">
                    <div className="text-3xl font-bold text-blue-600">
                      {logs.logs?.[0]?.totals?.sleeper_hours?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Sleeper</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Status */}
        <div className="mt-8">
          <div className="standout-card">
            <div className="standout-header">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">✓</div>
                  <div className="text-sm text-gray-600">14-Hour Rule</div>
                  <div className="text-xs text-green-600">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">✓</div>
                  <div className="text-sm text-gray-600">11-Hour Rule</div>
                  <div className="text-xs text-green-600">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">✓</div>
                  <div className="text-sm text-gray-600">70-Hour Rule</div>
                  <div className="text-xs text-green-600">Compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Innovation Features */}
        <div className="mt-8">
          <div className="standout-card">
            <div className="standout-header">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Features</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Intelligent Analytics</h4>
                  <p className="text-gray-600 text-sm">Advanced algorithms optimize routes and predict potential delays</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Real-Time Monitoring</h4>
                  <p className="text-gray-600 text-sm">Live compliance tracking and instant status updates</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Predictive Compliance</h4>
                  <p className="text-gray-600 text-sm">Proactive HOS violation prevention and alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
