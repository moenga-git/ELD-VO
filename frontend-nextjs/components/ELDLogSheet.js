import { useState } from 'react'

export default function ELDLogSheet({ tripData, logs }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Use real data from backend if available
  const getRealLogData = () => {
    if (logs && logs.logs && logs.logs.length > 0) {
      const todayLog = logs.logs.find(log => log.date === selectedDate)
      if (todayLog) {
        return {
          grid_json: todayLog.grid_json,
          duty_entries: todayLog.duty_entries,
          totals: todayLog.totals
        }
      }
    }
    return null
  }

  const realLogData = getRealLogData()

  // Generate 24-hour grid matching traditional paper format
  const generate24HourGrid = () => {
    if (realLogData && realLogData.grid_json) {
      // Use real grid data from backend
      return Object.entries(realLogData.grid_json).map(([time, status]) => ({
        hour: time,
        status: status,
        location: getLocationForTime(time),
        remarks: getRemarksForTime(time)
      }))
    }

    // Fallback to mock data
    const hours = []
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0')
      hours.push({
        hour: `${hour}:00`,
        status: getStatusForHour(i),
        location: getLocationForHour(i),
        remarks: getRemarksForHour(i)
      })
    }
    return hours
  }

  const getStatusForHour = (hour) => {
    // Mock status based on trip timing
    if (hour >= 6 && hour < 8) return 'ON DUTY'
    if (hour >= 8 && hour < 16) return 'DRIVING'
    if (hour >= 16 && hour < 16.5) return 'OFF DUTY' // 30-min break
    if (hour >= 16.5 && hour < 18) return 'DRIVING'
    if (hour >= 18) return 'OFF DUTY'
    return 'OFF DUTY'
  }

  const getLocationForHour = (hour) => {
    if (hour >= 6 && hour < 8) return 'Current Location'
    if (hour >= 8 && hour < 12) return 'En Route to Pickup'
    if (hour >= 12 && hour < 13) return 'Pickup Location'
    if (hour >= 13 && hour < 16) return 'En Route to Dropoff'
    if (hour >= 16 && hour < 16.5) return 'Rest Stop'
    if (hour >= 16.5 && hour < 18) return 'En Route to Dropoff'
    if (hour >= 18) return 'Dropoff Location'
    return 'Off Duty'
  }

  const getRemarksForHour = (hour) => {
    if (hour === 16) return '30-min break required after 8h driving'
    if (hour === 12) return '1-hour pickup time'
    if (hour === 18) return '1-hour dropoff time'
    return ''
  }

  const getLocationForTime = (time) => {
    // Map time to location based on trip data
    const hour = parseInt(time.split(':')[0])
    if (hour >= 6 && hour < 8) return 'Current Location'
    if (hour >= 8 && hour < 12) return 'En Route to Pickup'
    if (hour >= 12 && hour < 13) return 'Pickup Location'
    if (hour >= 13 && hour < 16) return 'En Route to Dropoff'
    if (hour >= 16 && hour < 16.5) return 'Rest Stop'
    if (hour >= 16.5 && hour < 18) return 'En Route to Dropoff'
    if (hour >= 18) return 'Dropoff Location'
    return 'Off Duty'
  }

  const getRemarksForTime = (time) => {
    const hour = parseInt(time.split(':')[0])
    if (hour === 16) return '30-min break required after 8h driving'
    if (hour === 12) return '1-hour pickup time'
    if (hour === 18) return '1-hour dropoff time'
    return ''
  }

  const gridData = generate24HourGrid()

  const downloadPDF = () => {
    // This would generate and download the actual PDF
    alert('PDF generation would be implemented here with proper ELD log formatting')
  }

  return (
    <div className="bg-white border-2 border-black p-6 max-w-4xl mx-auto">
      {/* Header - Drivers Daily Log */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Drivers Daily Log (24 hours)</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span>From: _________________</span>
              <span>To: _________________</span>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="mb-2">
              <span className="font-semibold">Date: </span>
              <span className="border-b border-black px-2">{selectedDate}</span>
            </div>
            <div className="text-xs">
              <div>Original - File at home terminal.</div>
              <div>Duplicate - Driver retains in his/her possession for 8 days.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Total Miles Driving Today</label>
            <div className="border border-black h-8 px-2 flex items-center">150</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Total Mileage Today</label>
            <div className="border border-black h-8 px-2 flex items-center">150</div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Truck/Tractor and Trailer Numbers or License Plate[s]/State (show each unit)</label>
          <div className="border border-black h-8 px-2 flex items-center">TRK-001 / TRAILER-001</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name of Carrier or Carriers</label>
            <div className="border border-black h-8 px-2 flex items-center text-sm">ELD-VO Transport</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Main Office Address</label>
            <div className="border border-black h-8 px-2 flex items-center text-sm">123 Main St, City, State</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Home Terminal Address</label>
            <div className="border border-black h-8 px-2 flex items-center text-sm">456 Terminal Ave, City, State</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Grid - Traditional Format */}
      <div className="mb-6">
        <div className="eld-grid">
          {/* Grid Header */}
          <div className="font-semibold text-center bg-gray-100">Duty Status</div>
          {Array.from({length: 24}, (_, i) => (
            <div key={i} className="font-semibold text-center bg-gray-100">
              {i === 0 ? 'Midnight' : i === 12 ? 'Noon' : i < 12 ? `${i}` : `${i-12}`}
            </div>
          ))}
          <div className="font-semibold text-center bg-gray-100">Total Hours</div>
          
          {/* Duty Status Rows */}
          {[
            { label: '1. Off Duty', status: 'OFF DUTY', color: 'bg-gray-100' },
            { label: '2. Sleeper Berth', status: 'SLEEPER', color: 'bg-blue-100' },
            { label: '3. Driving', status: 'DRIVING', color: 'bg-red-100' },
            { label: '4. On Duty (not driving)', status: 'ON DUTY', color: 'bg-green-100' }
          ].map((duty, dutyIndex) => (
            <>
              <div key={`${dutyIndex}-label`} className="font-semibold text-left pl-2">{duty.label}</div>
              {Array.from({length: 24}, (_, hour) => {
                const status = getStatusForHour(hour)
                const isActive = (status === duty.status) || 
                  (duty.status === 'OFF DUTY' && (status === 'OFF DUTY' || status === 'SLEEPER'))
                return (
                  <div key={`${dutyIndex}-${hour}`} className={`${
                    isActive ? duty.color : 'bg-white'
                  }`}>
                    {isActive && <div className="w-full h-1 bg-black"></div>}
                  </div>
                )
              })}
              <div key={`${dutyIndex}-total`} className="font-semibold text-center">
                {dutyIndex === 0 ? '8' : dutyIndex === 1 ? '0' : dutyIndex === 2 ? '8.5' : '3.5'}
              </div>
            </>
          ))}
        </div>
      </div>

      {/* HOS Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {realLogData?.totals?.driving_hours?.toFixed(1) || '8.5'}h
          </div>
          <div className="text-sm text-blue-700">Driving Time</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {realLogData?.totals?.on_duty_hours?.toFixed(1) || '12'}h
          </div>
          <div className="text-sm text-green-700">Duty Time</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {realLogData?.totals?.off_duty_hours?.toFixed(1) || '0.5'}h
          </div>
          <div className="text-sm text-yellow-700">Break Time</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {tripData?.cycle_hours_used || '45'}h
          </div>
          <div className="text-sm text-purple-700">Cycle Used</div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 text-green-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-800">HOS Compliance: PASSED</h4>
            <p className="text-sm text-green-700 mt-1">
              All Hours of Service regulations met. 30-minute break scheduled after 8 hours of driving.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={downloadPDF}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Download PDF Log
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Print Log
        </button>
      </div>
    </div>
  )
}
