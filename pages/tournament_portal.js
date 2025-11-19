import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Layout from '../components/ui/Layout'

// Portal Views (These already contain their own Titles/Headers)
import OrganizerTournamentView from '../components/portals/OrganizerTournamentView'
import PublicTournamentView from '../components/portals/PublicTournamentView'

export default function TournamentPortal() {
  const { profile } = useAuth()

  return (
    <Layout title="Tournament Portal - Huddle">
      <div className="max-w-6xl mx-auto p-6 pt-8">
        {/* Navigation is safe to keep here */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        {/* The components handle the rest of the UI */}
        {profile.role === 'organizer' ? (
          <OrganizerTournamentView />
        ) : (
          <PublicTournamentView />
        )}
      </div>
    </Layout>
  )
}