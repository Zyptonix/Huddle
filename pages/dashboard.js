import { useEffect, useMemo } from 'react' // Import useMemo
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout'
import { Shield, Users, User, Heart } from 'lucide-react' // Import necessary icons

// Action Cards
import TeamPortalCard from '../components/dashboards/TeamPortalCard'
import TournamentPortalCard from '../components/dashboards/TournamentPortalCard'
import PlayerAvailabilityCard from '../components/dashboards/PlayerAvailabilityCard'
import MessagesPortalCard from '../components/dashboards/MessagesPortalCard'
import DashboardView from '../components/dashboards/DashboardView'
import Loading from '../components/ui/Loading'

// Helper configuration (similar to your DashboardView logic, but simplified for the banner)
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

// NOTE: You need to define these placeholder components if they don't exist
const OrganizerDashboard = () => <div>Organizer Content</div>
const CoachDashboard = () => <div>Coach Content</div>
const PlayerDashboard = () => <div>Player Content</div>
const FanDashboard = () => <div>Fan Content</div>


export default function Dashboard() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()

    // Debug Log
    console.log('[Dashboard Debug] Render:', { 
        loading, 
        hasUser: !!user, 
        hasProfile: !!profile 
    })

    useEffect(() => {
        if (!loading && !user) {
            console.log('[Dashboard Debug] Redirecting to login...')
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return <Loading message="Authenticating..." />
    }

    if (!user) return null

    // If user exists but no profile, show specific loading state
    if (user && !profile) {
        console.log('[Dashboard Debug] User exists but Profile missing. Showing setup loader.')
        return <Loading message="Setting up your profile..." />
    }
    
    // --- THE FIX: Define 'theme' using the profile's role ---
    // Use useMemo to ensure this only recalculates if the role changes
    const theme = useMemo(() => {
        const role = profile.role || 'fan'
        return roleThemeConfig[role] || roleThemeConfig['fan']
    }, [profile.role])


    return (
        <Layout title="Dashboard - Huddle">
            {/* The existing DashboardView (which has the full stats and quote logic) */}
            <DashboardView user={user} profile={profile} />
        </Layout>
    )
}