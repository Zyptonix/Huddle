import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
// FIX: Correct path
import Layout from '../../components/ui/Layout'
import Alert from '../../components/ui/Alert'
import Loading from '../../components/ui/Loading'

// Modular Components
import TournamentHeader from '../../components/tournaments/TournamentHeader'
import RegisteredTeamsList from '../../components/tournaments/RegisteredTeamsList'
import MatchSchedule from '../../components/tournaments/MatchSchedule'
import AnnouncementFeed from '../../components/tournaments/AnnouncementFeed'

export default function TournamentPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile } = useAuth()
  
  const [tournament, setTournament] = useState(null)
  const [myTeams, setMyTeams] = useState([]) 
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      const loadData = async () => {
        try {
          const tRes = await fetch(`/api/tournaments/${id}`)
          const tData = await tRes.json()
          if (!tRes.ok) throw new Error(tData.error)
          setTournament(tData)

          if (profile?.role === 'coach') {
             const teamRes = await fetch('/api/teams/created')
             if (teamRes.ok) setMyTeams(await teamRes.json())
          }
        } catch (err) {
          setError(err.message)
        } finally {
          setFetchLoading(false)
        }
      }
      loadData()
    }
  }, [id, profile])

  const handleUpdateTournament = async (updatedData) => {
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    })
    if (res.ok) {
        const tRes = await fetch(`/api/tournaments/${id}`)
        setTournament(await tRes.json())
    } else {
        alert('Failed to update tournament')
    }
  }

  return (
    <Layout title={tournament ? `${tournament.name} - Huddle` : 'Loading Tournament...'}>
      {fetchLoading ? (
         <div className="py-20"><Loading message="Loading tournament..." /></div>
      ) : error ? (
         <Alert type="error" message={error} />
      ) : tournament ? (
        <>
          <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
             <TournamentHeader 
                tournament={tournament} 
                isOrganizer={user?.id === tournament.organizer_id} 
                onUpdate={handleUpdateTournament} 
              />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
               <RegisteredTeamsList 
                 teams={tournament.teams} 
                 myTeams={myTeams} 
                 profile={profile} 
                 tournamentId={id} 
                 sport={tournament.sport} 
                 onRefresh={() => window.location.reload()} 
               />
            </div>

            <div className="lg:col-span-2 space-y-8">
               <MatchSchedule 
                 matches={tournament.matches} 
                 isOrganizer={user?.id === tournament.organizer_id} 
                 tournamentId={id} 
                 onScheduleGenerated={() => window.location.reload()} 
               />
               
               <AnnouncementFeed 
                 announcements={tournament.announcements} 
                 tournamentId={id} 
                 isOrganizer={user?.id === tournament.organizer_id} 
                 user={user} 
                 onRefresh={() => window.location.reload()} 
               />
            </div>
          </div>
        </>
      ) : null}
    </Layout>
  )
}