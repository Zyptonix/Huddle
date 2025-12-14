import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use a Ref to track if the component is mounted. 
  // This is accessible everywhere, unlike the local 'let mounted' variable.
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- 1. SMART FETCH (Memoized & Safe) ---
  const fetchProfile = useCallback(async (userId) => {
    try {
      // Don't run if unmounted
      if (!isMounted.current) return; 

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      // Only update state if mounted
      if (isMounted.current) {
         setProfile(data || null);
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected fetch error:', error);
    }
  }, []);

  // --- 2. MAIN AUTH LOGIC ---
  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted.current) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error.message);
        if (isMounted.current) {
            setUser(null);
            setProfile(null);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted.current) {
          // Update User
          if (session?.user) {
            // Only update user if it changed to avoid loops
            setUser(prev => (prev?.id === session.user.id ? prev : session.user));
            
            // Fetch profile silently (don't block UI)
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // --- 3. EXPOSED VALUES ---
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    profile,
    loading,
    // This allows the Dashboard to manually update the profile after creating it
    refreshProfile: async () => {
        if (user) await fetchProfile(user.id);
    } 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);