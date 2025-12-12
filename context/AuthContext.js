import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Starts true

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();

      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          // 2. Fetch Profile only if user exists
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(data || { role: 'fan' });
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false); // STOP LOADING HERE
      }
    }

    getSession();

    // 3. Listen for changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Optional: Refetch profile here if needed
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
    loading // Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);