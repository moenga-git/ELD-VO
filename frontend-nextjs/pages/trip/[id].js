import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import MapView from '../../components/MapView'
import LogViewer from '../../components/LogViewer'
import PDFExport from '../../components/PDFExport'

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
            <MapView route={route} />
          </div>

          <div className="glass-card">
            <h2 className="text-2xl font-semibold text-white mb-4">ELD Logs</h2>
            <LogViewer logs={logs} />
          </div>
        </div>

        {logs && (
          <div className="glass-card mt-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Export & Upload</h2>
            <PDFExport tripId={id} logs={logs} />
          </div>
        )}
      </div>
    </div>
  )
}
