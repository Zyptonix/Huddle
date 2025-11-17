import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { LogIn, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard') // Redirect on success
    setLoading(false)
  }

  // A basic sign-up to get the user in the system.
  // We'll point them to the full register page you built.
  const handleSignUp = async (e) => {
    e.preventDefault()
    router.push('/register') // Go to the full registration page
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Head>
        <title>Login - Huddle</title>
      </Head>
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Sign in to Huddle
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form>
          <div className="mb-4 relative">
            <label className="block mb-1 font-medium text-gray-700">
              Email
            </label>
            <Mail
              className="absolute left-3 top-10 h-5 w-5 text-gray-400"
              size={20}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-6 relative">
            <label className="block mb-1 font-medium text-gray-700">
              Password
            </label>
            <Lock
              className="absolute left-3 top-10 h-5 w-5 text-gray-400"
              size={20}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-all"
          >
            <LogIn size={20} />
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="text-center my-4 text-gray-500">or</div>

          <button
            onClick={handleSignUp}
            className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus size={20} />
            Create an Account
          </button>
        </form>
        <p className="text-center text-sm mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}