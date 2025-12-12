import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { LogIn, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import GoogleButton from './GoogleButton'

export default function LoginForm() {
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
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Sign in to Huddle</h1>
      
      {/* --- Google Sign In --- */}
      <div className="space-y-4 mb-6">
        <GoogleButton />
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Or sign in with email</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
      </div>

      <Alert type="error" message={error} className="mb-4" />

      <form onSubmit={handleLogin} className="space-y-4">
        <Input 
          label="Email" 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          icon={<Mail size={18} />} 
          placeholder="you@example.com" 
        />
        
        <Input 
          label="Password" 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          icon={<Lock size={18} />} 
          placeholder="••••••••" 
        />

        <Button type="submit" isLoading={loading} className="w-full">
          <LogIn size={20} className="mr-2" /> {loading ? 'Logging in...' : 'Log In'}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="success" 
          onClick={() => router.push('/register')} 
          className="w-full"
        >
          <UserPlus size={20} className="mr-2" /> Create an Account
        </Button>
      </form>
      
      <p className="text-center text-sm mt-6">
        <Link href="/" className="text-blue-600 hover:underline">&larr; Back to Home</Link>
      </p>
    </div>
  )
}