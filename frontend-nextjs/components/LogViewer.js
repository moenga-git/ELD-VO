import { useState } from 'react'

export default function LogViewer({ logs }) {
  const [selectedDate, setSelectedDate] = useState(null)

  if (!logs || !logs.logs || logs.logs.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-white/80">No log data available</p>
      </div>
    )
  }

  const availableDates = logs.logs.map(day => day.date)
  const currentDate = selectedDate || availableDates[0]
  const currentLog = logs.logs.find(day => day.date === currentDate)

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRIVING': return 'bg-eld-red'
      case 'ON_DUTY_NOT_DRIVING': return 'bg-eld-orange'
      case 'OFF_DUTY': return 'bg-green-500'
      case 'SLEEPER': return 'bg-eld-blue'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DRIVING': return 'Driving'
      case 'ON_DUTY_NOT_DRIVING': return 'On Duty'
      case 'OFF_DUTY': return 'Off Duty'
      case 'SLEEPER': return 'Sleeper'
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="flex flex-wrap gap-2">
        {availableDates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              currentDate === date
                ? 'bg-eld-green text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {new Date(date).toLocaleDateString()}
          </button>
        ))}
      </div>

      {/* Daily Totals */}
      {currentLog && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-white/80 text-sm">Driving</p>
            <p className="text-xl font-bold text-white">
              {currentLog.totals?.driving_hours?.toFixed(1) || '0.0'}h
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm">On Duty</p>
            <p className="text-xl font-bold text-white">
              {currentLog.totals?.on_duty_hours?.toFixed(1) || '0.0'}h
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm">Off Duty</p>
            <p className="text-xl font-bold text-white">
              {currentLog.totals?.off_duty_hours?.toFixed(1) || '0.0'}h
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm">Sleeper</p>
            <p className="text-xl font-bold text-white">
              {currentLog.totals?.sleeper_hours?.toFixed(1) || '0.0'}h
            </p>
          </div>
        </div>
      )}

      {/* 24-Hour Grid */}
      {currentLog && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-white">24-Hour Grid</h4>
          <div className="grid grid-cols-24 gap-1">
            {currentLog.grid_json?.map((block, index) => (
              <div
                key={index}
                className={`h-4 rounded-sm ${getStatusColor(block.status)}`}
                title={`${block.time} - ${getStatusLabel(block.status)}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-white/60 mt-2">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
        </div>
      )}

      {/* Duty Entries */}
      {currentLog && currentLog.duty_entries && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-white">Duty Entries</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentLog.duty_entries.map((entry, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.duty_status)} text-white`}>
                    {getStatusLabel(entry.duty_status)}
                  </span>
                  <span className="text-white/80 text-sm">
                    {new Date(entry.start).toLocaleTimeString()} - {new Date(entry.end).toLocaleTimeString()}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-white/80 text-sm mb-1">{entry.note}</p>
                )}
                {entry.rule_applied && (
                  <p className="text-white/60 text-xs">Rule: {entry.rule_applied}</p>
                )}
                {entry.explanation && (
                  <p className="text-white/60 text-xs">Explanation: {entry.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
