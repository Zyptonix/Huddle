import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import {
  User,
  Mail,
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

export default function Account() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Form state
  const [username, setUsername] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
    }
  }, [profile])

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError(null)
    setSuccess(null)

    // Send data to our API (Controller)
    const response = await fetch('/api/profile', {
      method: 'PATCH', // PATCH is for partial updates
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })

    if (response.ok) {
      setSuccess('Profile updated! Reloading to see changes...')
      // A full reload is the simplest way to refresh the AuthContext
      setTimeout(() => window.location.reload(), 1500)
    } else {
      const data = await response.json()
      setError(data.error || 'Failed to update profile.')
    }
    setFormLoading(false)
  }

  // Show loading screen
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Loading account...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>My Account - Huddle</title>
      </Head>
      <div className="max-w-xl mx-auto p-6 pt-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold my-4 text-gray-800">Your Account</h1>

        {/* --- Account Details Card --- */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Account Details
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700 capitalize">
                Role: 
                <strong className="font-medium text-gray-900">
                  {profile?.role}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* --- Edit Profile Form Card --- */}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white border rounded-lg shadow"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Edit Your Profile
          </h2>

          <div className="mb-4 relative">
            <label
              htmlFor="username"
              className="block font-medium mb-1 text-gray-700"
            >
              Public Username
            </label>
            <User
              className="absolute left-3 top-10 h-5 w-5 text-gray-400"
              size={20}
            />
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g., CoachSmith"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all"
          >
            {formLoading ? 'Saving...' : 'Save Changes'}
          </button>

          {/* --- Success & Error Messages --- */}
          {success && (
            <div className="flex items-center gap-2 text-green-700 mt-4 bg-green-100 p-3 rounded-lg border border-green-200">
              <CheckCircle size={20} />
              <p className="font-medium">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-700 mt-4 bg-red-100 p-3 rounded-lg border border-red-200">
              <AlertCircle size={20} />
              <p className="font-medium">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}