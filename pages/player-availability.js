import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout'
import CoachPlayerAvailabilityDashboard from '../components/dashboards/CoachPlayerAvailabilityDashboard'

export default function PlayerAvailabilityPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!loading && !user) {
      router.push('/login')
    } 
    // If user is logged in but NOT a coach, redirect to dashboard
    else if (!loading && profile && profile.role !== 'coach') {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  // Don't show anything while loading or if not authorized
  if (loading || !user || !profile) return null
  if (profile.role !== 'coach') return null

  // Show the player availability dashboard only for coaches
  return (
    <Layout title="Player Availability - Huddle">
      <CoachPlayerAvailabilityDashboard />
    </Layout>
  )
}