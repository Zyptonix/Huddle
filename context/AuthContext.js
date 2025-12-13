import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- IMPROVED FETCH FUNCTION WITH RETRY ---
  const fetchProfile = async (userId, retries = 3) => {
    try {
      // 1. Attempt to fetch
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else if (retries > 0) {
        // 2. If no data, WAIT 1 second and TRY AGAIN
        console.log(`Profile not found yet. Retrying... (${retries} attempts left)`);
        setTimeout(() => {
            fetchProfile(userId, retries - 1);
        }, 1000); 
      } else {
        // 3. Give up after 3 tries (User truly has no profile)
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          // Pass '3' to enable retries on initial load
          await fetchProfile(session.user.id, 3); 
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Retry is CRITICAL here for Google Sign-In
            await fetchProfile(session.user.id, 3); 
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    profile,
    loading,
    // --- NEW: Expose this function to the app ---
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