import { useState } from 'react'
import { useRouter } from 'next/router'
import TripForm from '../components/TripForm'
import Auth from '../components/Auth'

export default function Home({ user }) {
  const [tripId, setTripId] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleTripCreated = (tripData) => {
    setTripId(tripData.trip_id)
    router.push(`/trip/${tripData.trip_id}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full">
          <h1 className="text-3xl font-bold text-white text-center mb-6">
            ELD Logging System
          </h1>
          <p className="text-white/80 text-center mb-8">
            Sign in to create and manage your electronic logs
          </p>
          <Auth />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user.user_metadata?.name || user.email}!
          </h1>
          <p className="text-white/80">
            Create a new trip to generate ELD logs and routes
          </p>
        </div>

        <div className="glass-card">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Create New Trip
          </h2>
          <TripForm onTripCreated={handleTripCreated} loading={loading} setLoading={setLoading} />
        </div>
      </div>
    </div>
  )
}
