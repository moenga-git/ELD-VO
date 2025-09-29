import { useState } from 'react'

export default function LogViewer({ logs }) {
  const [selectedDay, setSelectedDay] = useState(0)

  if (!logs || !logs.logs || logs.logs.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Log Data</h3>
        <p className="text-gray-600">Create a trip to generate ELD logs</p>
      </div>
    )
  }

  const currentLog = logs.logs[selectedDay]
  const getStatusColor = (status) => {
    switch (status) {
      case 'DRIVING': return 'bg-red-500'
      case 'ON_DUTY_NOT_DRIVING': return 'bg-orange-500'
      case 'OFF_DUTY': return 'bg-green-500'
      case 'SLEEPER': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DRIVING': return 'Driving'
      case 'ON_DUTY_NOT_DRIVING': return 'On Duty (not driving)'
      case 'OFF_DUTY': return 'Off Duty'
      case 'SLEEPER': return 'Sleeper Berth'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">ELD Compliance Logs</h2>
          <p className="text-gray-600">Professional Hours of Service tracking</p>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {currentLog.totals?.driving_hours?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-red-700 font-semibold">Driving Time</div>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {currentLog.totals?.on_duty_hours?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-orange-700 font-semibold">On Duty</div>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {((currentLog.totals?.driving_hours || 0) + (currentLog.totals?.on_duty_hours || 0)).toFixed(1)}h
            </div>
            <div className="text-sm text-green-700 font-semibold">Total On Duty</div>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {currentLog.totals?.cycle_70_hour_total?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-blue-700 font-semibold">70-Hour Cycle</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Grid */}
      <div className="glass-card">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">24-Hour Duty Status Grid</h3>
          <p className="text-gray-600">Visual representation of duty status throughout the day</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Hour Headers */}
            <div className="grid grid-cols-25 gap-1 mb-2">
              <div className="text-center text-sm font-semibold text-gray-700 py-2">Status</div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-600 py-1 border border-gray-200">
                  {i === 0 ? 'Mid' : i === 12 ? 'Noon' : i % 12 === 0 ? 'Mid' : i % 12}
                </div>
              ))}
            </div>

            {/* Status Rows */}
            {['OFF_DUTY', 'SLEEPER', 'DRIVING', 'ON_DUTY_NOT_DRIVING'].map((status, statusIdx) => (
              <div key={status} className="grid grid-cols-25 gap-1 mb-1">
                <div className="flex items-center justify-center text-sm font-semibold text-gray-700 py-2 bg-gray-50 border border-gray-200">
                  {statusIdx + 1}. {getStatusLabel(status)}
                </div>
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="h-8 border border-gray-200 relative">
                    {currentLog.grid_json
                      .filter(block => parseInt(block.time.split(':')[0]) === hour && block.status === status)
                      .map((block, blockIdx) => {
                        const startMin = parseInt(block.time.split(':')[1])
                        const durationMin = (new Date(block.end).getTime() - new Date(block.start).getTime()) / (1000 * 60)
                        const width = (durationMin / 60) * 100
                        const left = (startMin / 60) * 100
                        return (
                          <div
                            key={blockIdx}
                            className={`absolute h-full ${getStatusColor(status)} rounded-sm`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${block.time} - ${getStatusLabel(block.status)}`}
                          ></div>
                        )
                      })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Off Duty</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Sleeper Berth</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Driving</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-700">On Duty</span>
          </div>
        </div>
      </div>

      {/* Duty Entries */}
      <div className="glass-card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Duty Entries</h3>
        <div className="space-y-4">
          {currentLog.duty_entries.map((entry, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.duty_status)}`}></div>
                  <span className="font-semibold text-gray-900">
                    {getStatusLabel(entry.duty_status)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(entry.start).toLocaleTimeString()} - {new Date(entry.end).toLocaleTimeString()}
                </div>
              </div>
              {entry.rule_applied && (
                <div className="text-sm text-gray-700 mb-1">
                  <strong>Rule Applied:</strong> {entry.rule_applied}
                </div>
              )}
              {entry.explanation && (
                <div className="text-sm text-gray-600">
                  <strong>Explanation:</strong> {entry.explanation}
                </div>
              )}
              {entry.note && (
                <div className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border">
                  <strong>Note:</strong> {entry.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="glass-card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Compliance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">70-Hour/8-Day Cycle</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total hours on duty (last 7 days):</span>
                <span className="font-semibold">{currentLog.totals?.cycle_70_hour_total?.toFixed(1) || '0.0'}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours available tomorrow:</span>
                <span className="font-semibold text-green-600">
                  {(70 - (currentLog.totals?.cycle_70_hour_total || 0)).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">60-Hour/7-Day Cycle</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total hours on duty (last 6 days):</span>
                <span className="font-semibold">{currentLog.totals?.cycle_60_hour_total?.toFixed(1) || '0.0'}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours available tomorrow:</span>
                <span className="font-semibold text-green-600">
                  {(60 - (currentLog.totals?.cycle_60_hour_total || 0)).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If you took 34 consecutive hours off duty, you have 60/70 hours available.
          </p>
        </div>
      </div>
    </div>
  )
}