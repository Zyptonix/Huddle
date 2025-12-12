import { createContext, useContext, useEffect, useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import Loading from '../components/ui/Loading'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // FIX 1: Create the client once using useState. 
  // This prevents it from being re-created on every render, which crashes SSR.
  const [supabase] = useState(() => createPagesBrowserClient())

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          
          // Fetch profile safely
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
            
          if (mounted) setProfile(profileData || null)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        // Optionally refetch profile here if needed, but usually strictly not needed for simple auth switch
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // FIX 2: If the 'Loading' component itself has an error, it will crash the page.
  // If this still fails, try replacing <Loading... /> with a simple <div>Loading...</div>
  if (loading) {
    return <Loading message="Initializing..." />
  }

  return (
    <AuthContext.Provider value={{ user, profile, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
