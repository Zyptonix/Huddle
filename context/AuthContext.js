import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. SMART FETCH WITH RETRY (Preserved your logic) ---
  const fetchProfile = async (userId, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else if (retries > 0) {
        // If no data, wait 1s and retry.
        // Note: This happens in background so it won't block the UI loading state
        console.log(`Profile missing. Retrying... (${retries} attempts left)`);
        setTimeout(() => {
            fetchProfile(userId, retries - 1);
        }, 1000); 
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // --- 2. MAIN AUTH LOGIC WITH SAFETY VALVE ---
  useEffect(() => {
    let mounted = true;

    async function getSession() {
      try {
        // A. Wrap Supabase call in try/catch
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error; // Force jump to catch block if Supabase fails

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Trigger profile fetch (don't block loading state for retries)
            await fetchProfile(session.user.id, 3); 
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error.message);
        // If auth fails, ensure we don't leave stale data
        if (mounted) {
            setUser(null);
            setProfile(null);
        }
      } finally {
        // B. THE FIX: This block runs 100% of the time.
        // Even if Supabase errors or network fails, we unlock the app.
        if (mounted) setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id, 3); 
          } else {
            setUser(null);
            setProfile(null);
          }
          // Ensure loading is off after any auth change
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // --- 3. EMERGENCY TIMEOUT (The "Last Resort" Fix) ---
  // If for some reason the above logic hangs (firewall, adblocker, browser glitch),
  // this forces the app to open after 4 seconds.
  useEffect(() => {
      const timer = setTimeout(() => {
          if (loading) {
              console.warn("Auth took too long. Forcing app to load.");
              setLoading(false);
          }
      }, 4000); 

      return () => clearTimeout(timer);
  }, [loading]);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    profile,
    loading,
    refreshProfile: () => {
        if (user) return fetchProfile(user.id);
    } 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);