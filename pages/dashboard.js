import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout'
import { supabase } from '../lib/supabaseClient' // <--- 1. ADDED SUPABASE IMPORT
import { Shield, Users, User, Heart } from 'lucide-react'

// Action Cards and Loading
import DashboardView from '../components/dashboards/DashboardView'
import Loading from '../components/ui/Loading'

const roleThemeConfig = {
    organizer: { 
        gradient: 'from-blue-600 to-indigo-700', 
        icon: <Shield size={18} /> 
    },
    coach: { 
        gradient: 'from-green-600 to-emerald-700', 
        icon: <Users size={18} /> 
    },
    player: { 
        gradient: 'from-yellow-500 to-amber-600', 
        icon: <User size={18} /> 
    },
    fan: { 
        gradient: 'from-red-500 to-rose-600', 
        icon: <Heart size={18} /> 
    }
}

export default function Dashboard() {
    // We try to get 'refreshProfile' from AuthContext, but if you haven't updated Context yet, 
    // we will use a fallback reload.
    const { user, profile, loading, refreshProfile } = useAuth()
    const router = useRouter()
    
    // --- 2. ADDED STATE LOCK ---
    // Prevents the app from trying to create the profile 50 times at once
    const [isCreating, setIsCreating] = useState(false)

    // --- THEME MEMO ---
    const theme = useMemo(() => {
        const role = profile?.role || 'fan'
        return roleThemeConfig[role] || roleThemeConfig['fan']
    }, [profile])

    // --- 3. REDIRECT IF LOGGED OUT ---
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    // --- 4. THE FIX: AUTO-CREATE PROFILE ---
    // This watches for the "Stuck" state: User exists, but Profile is missing.
    useEffect(() => {
        async function ensureProfile() {
            // Check: Are we logged in? Is profile missing? Are we not already working on it?
            if (user && !profile && !loading && !isCreating) {
                console.log("⚠️ Profile missing. Attempting to create default profile...")
                setIsCreating(true)

                try {
                    // Insert default row into Supabase
                    const { error } = await supabase.from('profiles').insert([
                        {
                            id: user.id,
                            username: user.email?.split('@')[0] || 'User',
                            role: 'fan',
                            created_at: new Date()
                        }
                    ])

                    if (error) {
                        console.error("Error creating profile:", error)
                    } else {
                        console.log("✅ Profile created! Refreshing...")
                        // If your AuthContext has refreshProfile, use it. 
                        // Otherwise, reload the page to load the new data.
                        if (refreshProfile) {
                            await refreshProfile()
                        } else {
                            router.reload() 
                        }
                    }
                } catch (err) {
                    console.error("Critical error in profile creation:", err)
                } finally {
                    setIsCreating(false)
                }
            }
        }

        ensureProfile()
    }, [user, profile, loading, isCreating, refreshProfile, router])

    // --- RENDER ---

    if (loading) {
        return <Loading message="Authenticating..." />
    }

    if (!user) return null

    // If user exists but no profile, show loading while the Effect above fixes it
    if (user && !profile) {
        return <Loading message="Setting up your profile..." />
    }
    
    return (
        <Layout title="Dashboard - Huddle">
            <DashboardView user={user} profile={profile} theme={theme} />
        </Layout>
    )
}