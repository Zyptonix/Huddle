import { useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout'
import { Shield, Users, User, Heart } from 'lucide-react'

// Action Cards and Loading (Keep your imports)
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
    const { user, profile, loading } = useAuth()
    const router = useRouter()

    // --- FIX: Hooks must be at the top level ---
    // We moved useMemo here, BEFORE any 'return' statements.
    // We use optional chaining (profile?.role) because profile might be null initially.
    const theme = useMemo(() => {
        const role = profile?.role || 'fan'
        return roleThemeConfig[role] || roleThemeConfig['fan']
    }, [profile]) // Depend on profile object

    useEffect(() => {
        if (!loading && !user) {
            console.log('[Dashboard Debug] Redirecting to login...')
            router.push('/login')
        }
    }, [user, loading, router])

    // --- NOW it is safe to use conditional returns ---

    if (loading) {
        return <Loading message="Authenticating..." />
    }

    if (!user) return null

    // If user exists but no profile, show specific loading state
    if (user && !profile) {
        return <Loading message="Setting up your profile..." />
    }
    
    return (
        <Layout title="Dashboard - Huddle">
            {/* You can pass the 'theme' prop to DashboardView if it needs it */}
            <DashboardView user={user} profile={profile} theme={theme} />
        </Layout>
    )
}