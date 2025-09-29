import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import LogViewer from '../../components/LogViewer'

export default function TripPage({ user }) {
  const router = useRouter()
  const { id } = router.query
  const [trip, setTrip] = useState(null)
  const [route, setRoute] = useState(null)
  const [logs, setLogs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchTripData()
    }
  }, [id])

  const fetchTripData = async () => {
    try {
      setLoading(true)
      
      // Fetch route data
      const routeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/trips/${id}/route/`)
      if (!routeResponse.ok) throw new Error('Failed to fetch route')
      const routeData = await routeResponse.json()
      setRoute(routeData)

      // Fetch logs data
      const logsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/trips/${id}/logs/`)
      if (!logsResponse.ok) throw new Error('Failed to fetch logs')
      const logsData = await logsResponse.json()
      setLogs(logsData)

      setTrip({ id, route: routeData, logs: logsData })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eld-green"></div>
          <p className="text-white mt-4">Loading trip data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="glass-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Trip {id}</h1>
            <button 
              onClick={() => router.push('/')}
              className="glass-button"
            >
              Back to Home
            </button>
          </div>
          {route && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-white/80">Total Distance</p>
                <p className="text-2xl font-bold text-white">{route.total_distance_mi.toFixed(1)} mi</p>
              </div>
              <div className="text-center">
                <p className="text-white/80">Total Duration</p>
                <p className="text-2xl font-bold text-white">{Math.round(route.total_duration_min / 60)}h {route.total_duration_min % 60}m</p>
              </div>
              <div className="text-center">
                <p className="text-white/80">Legs</p>
                <p className="text-2xl font-bold text-white">{route.legs.length}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card">
            <h2 className="text-2xl font-semibold text-white mb-4">Route Map</h2>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-gray-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Interactive Map</h4>
              <p className="text-gray-600">Route visualization with Mapbox integration</p>
            </div>
          </div>

          <div className="glass-card">
            <h2 className="text-2xl font-semibold text-white mb-4">ELD Logs</h2>
            <LogViewer logs={logs} />
          </div>
        </div>

        {logs && (
          <div className="glass-card mt-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Export & Upload</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Export Options</h4>
              <p className="text-sm text-gray-600 mb-4">
                Download your ELD log data in a formatted text file.
              </p>
              <button
                onClick={() => {
                  const logContent = `ELD DAILY LOG SHEET\n${'='.repeat(50)}\n\nTrip ID: ${id}\nDate: ${new Date().toLocaleDateString()}\n\nDUTY ENTRIES:\n${'-'.repeat(30)}\n`
                  const blob = new Blob([logContent], { type: 'text/plain' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `eld-log-${id}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Log File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
