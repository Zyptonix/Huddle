import { createContext, useContext, useEffect, useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs' // Direct import
import Loading from '../components/ui/Loading'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // 1. Initialize the client here to ensure it syncs with the latest cookies
  const [supabase] = useState(() => createPagesBrowserClient())
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        // 2. Use the local 'supabase' instance
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user) {
          if (mounted) setUser(session.user)
          await fetchProfile(session.user)
        } else {
          if (mounted) setLoading(false)
        }
      } catch (error) {
        console.error("Auth Init Error:", error)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           if (session?.user) {
             setUser(session.user)
             await fetchProfile(session.user)
           }
        } else if (event === 'SIGNED_OUT') {
           setUser(null)
           setProfile(null)
           setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase]) // Add supabase to dependency array

  const fetchProfile = async (currentUser) => {
    let retries = 5
    let profileData = null

    while (retries > 0 && !profileData) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (data) {
          profileData = data
        } else {
          // Profile not created yet, wait 1s
          retries--
          if (retries > 0) await new Promise(r => setTimeout(r, 1000))
        }
      } catch (err) {
        retries--
        if (retries > 0) await new Promise(r => setTimeout(r, 1000))
      }
    }

    setProfile(profileData)
    setLoading(false)
  }

  const value = { user, profile, loading, supabase } // Expose supabase to children if needed

  if (loading) {
    return <Loading message="Initializing..." />
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}