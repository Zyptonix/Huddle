import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout'
import DashboardView from '../components/dashboards/DashboardView'
import Loading from '../components/ui/Loading'

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

  return (
    <Layout title="Dashboard - Huddle">
      <DashboardView user={user} profile={profile} />
    </Layout>
  )
}