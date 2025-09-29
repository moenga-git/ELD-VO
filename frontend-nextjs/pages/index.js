import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import TripForm from '../components/TripForm'
import LogViewer from '../components/LogViewer'
import RouteMap from '../components/RouteMap'
import ELDLogSheet from '../components/ELDLogSheet'
import { clearAllCaches, forceRefresh, clearAuthCache, isCacheStale } from '../utils/cacheUtils'

const supabase = createClient(
  'https://ddisdxhjtoknvxswmasx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaXNkeGhqdG9rbnZ4c3dtYXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Nzc0NTQsImV4cCI6MjA3NDQ1MzQ1NH0.KV-i5qT11Bnw_3edNhvEukTcTxR9yNQmT2Qfaj8m-yg'
)

export default function Home() {
  const [user, setUser] = useState(null)
  const [tripId, setTripId] = useState(null)
  const [tripData, setTripData] = useState(null)
  const [logs, setLogs] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const generateMockLogs = () => {
    return {
      logs: [{
        date: new Date().toISOString().split('T')[0],
        grid_json: Array.from({ length: 24 }, (_, i) => ({
          time: `${i.toString().padStart(2, '0')}:00`,
          status: i < 8 ? 'OFF_DUTY' : i < 10 ? 'DRIVING' : i < 12 ? 'ON_DUTY_NOT_DRIVING' : 'OFF_DUTY',
          start: new Date().toISOString(),
          end: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        })),
        duty_entries: [
          {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            duty_status: 'DRIVING',
            rule_applied: '14-hour rule',
            explanation: 'Driving time within 14-hour window'
          }
        ],
        totals: {
          driving_hours: 8.5,
          on_duty_hours: 2.5,
          cycle_70_hour_total: 45.2,
          cycle_60_hour_total: 38.7
        }
      }]
    }
  }

  const handleTripCreated = async (trip) => {
    setTripId(trip.trip_id)
    setTripData(trip)
    
    // Fetch real ELD logs from backend
    try {
      const response = await fetch(`https://eld-backend-d0tz.onrender.com/api/trips/${trip.trip_id}/logs/`)
      if (response.ok) {
        const logsData = await response.json()
        setLogs(logsData)
      } else {
        console.error('Failed to fetch logs:', response.status)
        setLogs(generateMockLogs())
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      setLogs(generateMockLogs())
    }
    setActiveTab('route')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">ELD-VO</h1>
            <p className="text-gray-300 text-lg">Electronic Logging Device System</p>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white">
                System Ready
              </span>
            </div>
          </div>

          {!showForgotPassword && !showSignup ? (
            <>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const email = formData.get('email')
                const password = formData.get('password')
                
                try {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                  })
                  if (error) throw error
                  setUser(data.user)
                } catch (error) {
                  alert('Sign in failed: ' + error.message)
                }
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setShowSignup(true)}
                      className="font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            </>
          ) : showSignup ? (
            <div className="mt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Create Account</h3>
                <p className="text-gray-300 text-sm">Sign up for your ELD-VO account</p>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                setSignupLoading(true)
                const formData = new FormData(e.target)
                const email = formData.get('email')
                const password = formData.get('password')
                
                try {
                  const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                  })
                  if (error) throw error
                  alert('Check your email for the confirmation link!')
                  setShowSignup(false)
                } catch (error) {
                  alert('Sign up failed: ' + error.message)
                } finally {
                  setSignupLoading(false)
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {signupLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowSignup(false)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Reset Password</h3>
                <p className="text-gray-300 text-sm">Enter your email to receive reset instructions</p>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                setForgotLoading(true)
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                    redirectTo: 'https://eldvlo.vercel.app/auth/reset-password'
                  })
                  if (error) throw error
                  alert('Password reset email sent! Check your inbox.')
                  setShowForgotPassword(false)
                  setForgotEmail('')
                } catch (error) {
                  alert('Password reset failed: ' + error.message)
                } finally {
                  setForgotLoading(false)
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Send Reset Email'
                    )}
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotEmail('')
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Uber-Style Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">ELD-VO</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome back</p>
                <p className="font-semibold text-white">{user.user_metadata?.name || user.email}</p>
              </div>
              <button
                onClick={() => {
                  clearAllCaches()
                  forceRefresh()
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg text-xs hover:bg-gray-600 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  setUser(null)
                }}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'create', label: 'Create Trip' },
              ...(tripId ? [
                { id: 'route', label: 'Route Map' },
                { id: 'logs', label: 'ELD Logs' },
                { id: 'logsheet', label: 'Daily Log Sheet' }
              ] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* ELD Status Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  ELD Dashboard
                </h2>
                <p className="text-gray-600">Electronic Logging Device - Hours of Service Compliance</p>
              </div>
              
              {/* HOS Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">11h</div>
                  <div className="text-sm text-green-700 font-medium">Driving Hours</div>
                  <div className="text-xs text-green-600 mt-1">Max: 11 hours</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">14h</div>
                  <div className="text-sm text-blue-700 font-medium">Duty Hours</div>
                  <div className="text-xs text-blue-600 mt-1">Max: 14 hours</div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">30m</div>
                  <div className="text-sm text-yellow-700 font-medium">Break Required</div>
                  <div className="text-xs text-yellow-600 mt-1">After 8h driving</div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">70h</div>
                  <div className="text-sm text-purple-700 font-medium">8-Day Cycle</div>
                  <div className="text-xs text-purple-600 mt-1">Max: 70 hours</div>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Current Duty Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">ON DUTY</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Location</span>
                      <span className="text-sm text-gray-900">New York, NY</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Last Status Change</span>
                      <span className="text-sm text-gray-900">2 hours ago</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Driving Time Today</span>
                      <span className="text-sm text-gray-900">6h 30m</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Duty Time Today</span>
                      <span className="text-sm text-gray-900">8h 15m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Cycle Used</span>
                      <span className="text-sm text-gray-900">45h 20m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 text-white text-left p-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Start New Trip</h4>
                      <p className="text-blue-100 text-sm">Create trip with pickup/dropoff locations</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('logs')}
                  className="bg-gray-600 text-white text-left p-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">View ELD Logs</h4>
                      <p className="text-gray-300 text-sm">Check compliance and duty records</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-green-600 text-white text-left p-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Generate PDF</h4>
                      <p className="text-green-100 text-sm">Download daily log sheet</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <TripForm onTripCreated={handleTripCreated} loading={loading} setLoading={setLoading} />
        )}

        {activeTab === 'route' && tripData && (
          <RouteMap tripData={tripData} />
        )}

        {activeTab === 'logs' && logs && (
          <LogViewer logs={logs} />
        )}

        {activeTab === 'logsheet' && tripData && (
          <ELDLogSheet tripData={tripData} logs={logs} />
        )}

        {activeTab === 'daily-log' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">ELD Daily Log Sheet</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">FMCSA Hours of Service Log</h3>
              <p className="text-gray-600 mb-6">Professional ELD log sheet following HOS rules</p>
              {tripData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{tripData.distance_miles?.toFixed(1) || '0.0'} mi</div>
                    <div className="text-sm text-gray-600">Trip Distance</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Math.floor((tripData.duration_minutes || 0) / 60)}h {(tripData.duration_minutes || 0) % 60}m
                    </div>
                    <div className="text-sm text-gray-600">Trip Duration</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{tripData.current_cycle_used || 0}h</div>
                    <div className="text-sm text-gray-600">Cycle Used</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}