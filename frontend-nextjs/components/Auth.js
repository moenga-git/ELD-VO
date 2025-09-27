import { useState } from 'react'
import { supabase } from '../pages/_app'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleAuth} className="space-y-4">
      {isSignUp && (
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full"
            placeholder="Your name"
            required
          />
        </div>
      )}
      
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="glass-input w-full"
          placeholder="your@email.com"
          required
        />
      </div>
      
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="glass-input w-full"
          placeholder="Password"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="glass-button w-full"
      >
        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
      </button>
      
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-white/80 hover:text-white text-sm"
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
      
      {message && (
        <p className={`text-sm ${message.includes('error') ? 'text-red-300' : 'text-green-300'}`}>
          {message}
        </p>
      )}
    </form>
  )
}
