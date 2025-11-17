import { createContext, useContext, useEffect, useState } from 'react'
    import { supabase } from '../lib/supabaseClient'

    const AuthContext = createContext()

    export function AuthProvider({ children }) {
      const [user, setUser] = useState(null)
      const [profile, setProfile] = useState(null)
      const [loading, setLoading] = useState(true)

      useEffect(() => {
        // Get the initial session
        const getSession = async () => {
          const { data: { session } } = await supabase.auth.getSession()
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user)
          }
          setLoading(false)
        }
        getSession()

        // Listen for auth state changes (login/logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchProfile(session.user)
            } else {
              setProfile(null)
            }
            setLoading(false)
          }
        )

        return () => {
          authListener.subscription.unsubscribe()
        }
      }, [])

      // Helper to get the profile data
      const fetchProfile = async (user) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`username, role, phone, address, height, avatar_url`)
            .eq('id', user.id)
            .maybeSingle() // <-- THIS IS THE FIX

          if (error) throw error
          setProfile(data) // data will be 'null' if not found, which is fine
        } catch (error) {
          console.error('Error fetching profile:', error.message)
        }
      }

      const value = { user, profile, loading }

      return (
        <AuthContext.Provider value={value}>
          {!loading && children}
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